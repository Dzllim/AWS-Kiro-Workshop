"""ClubElo data source adapter.

Fetches Elo-style football strength ratings from ClubElo API endpoints.
Provides historical ratings for club teams.
"""
from typing import Optional
from .interface import DataSourceInterface


CLUBELO_BASE_URL = "http://api.clubelo.com"


class ClubEloAdapter(DataSourceInterface):
    """Adapter for ClubElo ratings API."""

    def __init__(self):
        self._cache: dict[str, any] = {}

    @property
    def name(self) -> str:
        return "ClubElo"

    def fetch_teams(self) -> list[dict]:
        """Fetch current team Elo ratings.

        In production, calls: http://api.clubelo.com/{date}
        For development, returns sample data.
        """
        # Sample Elo data for development
        # In production: requests.get(f"{CLUBELO_BASE_URL}/2026-07-03")
        sample_elos = [
            {"name": "Manchester City", "elo": 1920, "country": "ENG"},
            {"name": "Real Madrid", "elo": 1940, "country": "ESP"},
            {"name": "Bayern Munich", "elo": 1910, "country": "GER"},
            {"name": "Arsenal", "elo": 1890, "country": "ENG"},
            {"name": "Liverpool", "elo": 1880, "country": "ENG"},
            {"name": "Barcelona", "elo": 1900, "country": "ESP"},
            {"name": "Inter Milan", "elo": 1860, "country": "ITA"},
            {"name": "PSG", "elo": 1850, "country": "FRA"},
            {"name": "Borussia Dortmund", "elo": 1840, "country": "GER"},
            {"name": "Chelsea", "elo": 1820, "country": "ENG"},
        ]

        return [
            {
                "name": t["name"],
                "country": t["country"],
                "elo_rating": t["elo"],
                "source": self.name,
            }
            for t in sample_elos
        ]

    def fetch_matches(self, season: Optional[str] = None) -> list[dict]:
        """ClubElo doesn't provide match data directly."""
        return []

    def fetch_players(self, team: Optional[str] = None) -> list[dict]:
        """ClubElo doesn't provide player data."""
        return []

    def is_available(self) -> bool:
        """In production, ping the API. For dev, always available."""
        return True
