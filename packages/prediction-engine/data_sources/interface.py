"""Abstract data source interface.

All data providers implement this interface so they can be swapped
without modifying pipeline logic. (Req 12.1)
"""
from abc import ABC, abstractmethod
from typing import Optional


class DataSourceInterface(ABC):
    """Base interface for football data sources."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable source name."""
        ...

    @abstractmethod
    def fetch_teams(self) -> list[dict]:
        """Fetch team data from source.

        Returns:
            List of team dicts with standardized schema:
            {name, country, competition, elo_rating, goals_scored, goals_conceded, matches_played, ...}
        """
        ...

    @abstractmethod
    def fetch_matches(self, season: Optional[str] = None) -> list[dict]:
        """Fetch match results from source.

        Args:
            season: Optional season filter (e.g., "2024-25")

        Returns:
            List of match dicts with standardized schema:
            {home_team, away_team, home_goals, away_goals, date, competition, ...}
        """
        ...

    @abstractmethod
    def fetch_players(self, team: Optional[str] = None) -> list[dict]:
        """Fetch player data from source.

        Args:
            team: Optional team filter

        Returns:
            List of player dicts with standardized schema:
            {name, team, position, goals, assists, xG, xA, ...}
        """
        ...

    def is_available(self) -> bool:
        """Check if the data source is reachable.

        Default implementation returns True. Override for sources
        that require network connectivity.
        """
        return True
