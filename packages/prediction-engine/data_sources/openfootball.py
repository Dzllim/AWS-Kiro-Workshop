"""OpenFootball data source adapter.

Loads World Cup and international match data from local CSV/JSON files.
OpenFootball provides CC0 public-domain-style licensed data.
"""
import json
import os
from typing import Optional
from .interface import DataSourceInterface


class OpenFootballAdapter(DataSourceInterface):
    """Adapter for OpenFootball datasets (local files)."""

    def __init__(self, data_dir: str = ""):
        self._data_dir = data_dir or os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "data", "raw", "openfootball"
        )

    @property
    def name(self) -> str:
        return "OpenFootball"

    def fetch_teams(self) -> list[dict]:
        """Load teams from OpenFootball datasets."""
        teams_path = os.path.join(self._data_dir, "teams.json")
        if not os.path.exists(teams_path):
            return []

        with open(teams_path, "r") as f:
            raw_teams = json.load(f)

        return [
            {
                "name": t.get("name", ""),
                "country": t.get("country", ""),
                "competition": "International",
                "source": self.name,
            }
            for t in raw_teams
        ]

    def fetch_matches(self, season: Optional[str] = None) -> list[dict]:
        """Load matches from OpenFootball datasets."""
        matches_path = os.path.join(self._data_dir, "matches.json")
        if not os.path.exists(matches_path):
            return []

        with open(matches_path, "r") as f:
            raw_matches = json.load(f)

        results = []
        for m in raw_matches:
            match = {
                "home_team": m.get("home_team", ""),
                "away_team": m.get("away_team", ""),
                "home_goals": m.get("score", [0, 0])[0] if isinstance(m.get("score"), list) else 0,
                "away_goals": m.get("score", [0, 0])[1] if isinstance(m.get("score"), list) else 0,
                "date": m.get("date", ""),
                "competition": m.get("competition", "International"),
                "source": self.name,
            }
            if season and season not in match["date"]:
                continue
            results.append(match)

        return results

    def fetch_players(self, team: Optional[str] = None) -> list[dict]:
        """OpenFootball doesn't provide detailed player data."""
        return []

    def is_available(self) -> bool:
        """Check if local data files exist."""
        return os.path.isdir(self._data_dir)
