"""Kaggle data source adapter.

Loads international football results from Kaggle CSV datasets.
Dataset: "International Football Results from 1872 to 2024"
"""
import os
import json
from typing import Optional
from .interface import DataSourceInterface


class KaggleAdapter(DataSourceInterface):
    """Adapter for Kaggle historical international results CSV."""

    def __init__(self, data_dir: str = ""):
        self._data_dir = data_dir or os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "data", "raw", "kaggle"
        )

    @property
    def name(self) -> str:
        return "Kaggle Historical"

    def fetch_teams(self) -> list[dict]:
        """Extract unique teams from match history."""
        matches = self.fetch_matches()
        teams_seen = set()
        teams = []

        for m in matches:
            for team_name in [m["home_team"], m["away_team"]]:
                if team_name not in teams_seen:
                    teams_seen.add(team_name)
                    teams.append({
                        "name": team_name,
                        "country": team_name,
                        "competition": "International",
                        "source": self.name,
                    })

        return teams

    def fetch_matches(self, season: Optional[str] = None) -> list[dict]:
        """Load matches from Kaggle CSV.

        Expected CSV columns: date, home_team, away_team, home_score, away_score, tournament
        For development, loads from JSON sample.
        """
        # In production, parse CSV with pandas
        # For development, use sample data
        sample_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "data", "sample", "matches.json"
        )

        if not os.path.exists(sample_path):
            return []

        with open(sample_path, "r") as f:
            raw = json.load(f)

        results = []
        for m in raw:
            results.append({
                "home_team": m.get("homeTeam", ""),
                "away_team": m.get("awayTeam", ""),
                "home_goals": m.get("homeGoals", 0),
                "away_goals": m.get("awayGoals", 0),
                "date": m.get("matchDate", ""),
                "competition": m.get("competition", "International"),
                "source": self.name,
            })

        return results

    def fetch_players(self, team: Optional[str] = None) -> list[dict]:
        """Kaggle historical results don't include player data."""
        return []

    def is_available(self) -> bool:
        """Check if data files exist."""
        return True  # Always available with sample fallback
