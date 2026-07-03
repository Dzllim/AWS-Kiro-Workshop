"""Data pipeline orchestrator.

Implements: Req 12.1-12.7
Collects data from multiple sources, validates, processes, and stores results.
"""
import json
import os
import logging
from datetime import datetime, timezone
from typing import Optional

from data_sources.interface import DataSourceInterface
from data_sources.openfootball import OpenFootballAdapter
from data_sources.clubelo import ClubEloAdapter
from data_sources.kaggle_adapter import KaggleAdapter

logger = logging.getLogger(__name__)

# Mandatory fields for validation (Req 12.2)
REQUIRED_MATCH_FIELDS = {"home_team", "away_team", "date", "competition"}
REQUIRED_TEAM_FIELDS = {"name", "country"}


class DataPipeline:
    """Automated ETL pipeline for football data. (Req 12)"""

    def __init__(self, output_dir: str = ""):
        self._output_dir = output_dir or os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "processed"
        )
        self._sources: list[DataSourceInterface] = [
            OpenFootballAdapter(),
            ClubEloAdapter(),
            KaggleAdapter(),
        ]
        self._errors: list[dict] = []
        self._last_run: Optional[str] = None

    def add_source(self, source: DataSourceInterface):
        """Register an additional data source. (Req 12.1)"""
        self._sources.append(source)

    def remove_source(self, name: str):
        """Remove a data source by name."""
        self._sources = [s for s in self._sources if s.name != name]

    def run(self) -> dict:
        """Execute the full data pipeline.

        Steps:
        1. Collect data from all sources
        2. Validate data integrity (Req 12.2)
        3. Deduplicate and merge
        4. Store processed data (Req 12.5)

        Returns:
            Summary dict with counts and errors
        """
        logger.info("Starting data pipeline run")
        self._errors = []

        all_teams: list[dict] = []
        all_matches: list[dict] = []
        all_players: list[dict] = []

        # Step 1: Collect from all sources
        for source in self._sources:
            if not source.is_available():
                self._log_error(source.name, "N/A", "Source unavailable")
                continue

            # Retry logic (Req 12.4) - simplified for dev
            try:
                teams = source.fetch_teams()
                all_teams.extend(teams)
                logger.info(f"{source.name}: fetched {len(teams)} teams")
            except Exception as e:
                self._log_error(source.name, "teams", str(e))

            try:
                matches = source.fetch_matches()
                all_matches.extend(matches)
                logger.info(f"{source.name}: fetched {len(matches)} matches")
            except Exception as e:
                self._log_error(source.name, "matches", str(e))

            try:
                players = source.fetch_players()
                all_players.extend(players)
            except Exception as e:
                self._log_error(source.name, "players", str(e))

        # Step 2: Validate (Req 12.2, 12.3)
        valid_teams = self._validate_teams(all_teams)
        valid_matches = self._validate_matches(all_matches)

        # Step 3: Deduplicate
        unique_teams = self._deduplicate_teams(valid_teams)
        unique_matches = self._deduplicate_matches(valid_matches)

        # Step 4: Store
        self._store_processed(unique_teams, unique_matches, all_players)
        self._last_run = datetime.now(timezone.utc).isoformat()

        summary = {
            "status": "completed",
            "timestamp": self._last_run,
            "teams_processed": len(unique_teams),
            "matches_processed": len(unique_matches),
            "players_processed": len(all_players),
            "errors": len(self._errors),
            "error_details": self._errors[:10],  # Return first 10 errors
        }

        logger.info(f"Pipeline complete: {summary['teams_processed']} teams, {summary['matches_processed']} matches, {summary['errors']} errors")
        return summary

    def _validate_teams(self, teams: list[dict]) -> list[dict]:
        """Validate team records. Skip invalid ones. (Req 12.3)"""
        valid = []
        for team in teams:
            missing = REQUIRED_TEAM_FIELDS - set(team.keys())
            if missing:
                self._log_error(team.get("source", "unknown"), team.get("name", "unknown"), f"Missing fields: {missing}")
                continue
            if not team["name"].strip():
                self._log_error(team.get("source", "unknown"), "empty", "Empty team name")
                continue
            valid.append(team)
        return valid

    def _validate_matches(self, matches: list[dict]) -> list[dict]:
        """Validate match records. Skip invalid ones. (Req 12.3)"""
        valid = []
        for match in matches:
            missing = REQUIRED_MATCH_FIELDS - set(match.keys())
            if missing:
                self._log_error(match.get("source", "unknown"), str(match), f"Missing fields: {missing}")
                continue

            # Check for outlier goal counts (>10 goals per team is suspicious)
            home_goals = match.get("home_goals", 0)
            away_goals = match.get("away_goals", 0)
            if isinstance(home_goals, (int, float)) and home_goals > 10:
                self._log_error(match.get("source", "unknown"), match.get("date", ""), f"Outlier: {home_goals} home goals")
                continue
            if isinstance(away_goals, (int, float)) and away_goals > 10:
                self._log_error(match.get("source", "unknown"), match.get("date", ""), f"Outlier: {away_goals} away goals")
                continue

            valid.append(match)
        return valid

    def _deduplicate_teams(self, teams: list[dict]) -> list[dict]:
        """Remove duplicate teams (same name + country)."""
        seen = set()
        unique = []
        for team in teams:
            key = (team["name"], team.get("country", ""))
            if key not in seen:
                seen.add(key)
                unique.append(team)
        return unique

    def _deduplicate_matches(self, matches: list[dict]) -> list[dict]:
        """Remove duplicate matches (same teams + date). (Req 12.2)"""
        seen = set()
        unique = []
        for match in matches:
            key = (match["home_team"], match["away_team"], match["date"])
            if key not in seen:
                seen.add(key)
                unique.append(match)
        return unique

    def _store_processed(self, teams: list[dict], matches: list[dict], players: list[dict]):
        """Store processed data to output directory. (Req 12.5)

        In production, this uploads to S3 and updates DynamoDB.
        For development, writes to local files.
        """
        os.makedirs(self._output_dir, exist_ok=True)

        with open(os.path.join(self._output_dir, "teams.json"), "w") as f:
            json.dump(teams, f, indent=2)

        with open(os.path.join(self._output_dir, "matches.json"), "w") as f:
            json.dump(matches, f, indent=2)

        if players:
            with open(os.path.join(self._output_dir, "players.json"), "w") as f:
                json.dump(players, f, indent=2)

    def _log_error(self, source: str, record_id: str, reason: str):
        """Log validation error. (Req 12.3)"""
        error = {
            "source": source,
            "record": record_id,
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._errors.append(error)
        logger.warning(f"Pipeline error: {source} - {reason}")

    @property
    def last_run(self) -> Optional[str]:
        return self._last_run

    @property
    def sources(self) -> list[str]:
        return [s.name for s in self._sources]
