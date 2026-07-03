"""Data service - loads and serves team/player/match data."""
import json
import os
from typing import Optional

SAMPLE_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "sample")


class DataService:
    """Service for accessing team, player, and match data."""

    def __init__(self):
        self._teams: list[dict] = []
        self._players: list[dict] = []
        self._matches: list[dict] = []
        self._load_sample_data()

    def _load_sample_data(self):
        """Load sample data from JSON files."""
        try:
            teams_path = os.path.join(SAMPLE_DATA_PATH, "teams.json")
            if os.path.exists(teams_path):
                with open(teams_path, "r") as f:
                    self._teams = json.load(f)

            players_path = os.path.join(SAMPLE_DATA_PATH, "players.json")
            if os.path.exists(players_path):
                with open(players_path, "r") as f:
                    self._players = json.load(f)

            matches_path = os.path.join(SAMPLE_DATA_PATH, "matches.json")
            if os.path.exists(matches_path):
                with open(matches_path, "r") as f:
                    self._matches = json.load(f)
        except Exception:
            pass

    def get_teams(self, competition: Optional[str] = None, search: Optional[str] = None) -> list[dict]:
        """Get teams with optional filtering."""
        result = self._teams
        if competition:
            result = [t for t in result if t.get("competition") == competition]
        if search and len(search) >= 3:
            search_lower = search.lower()
            result = [t for t in result if search_lower in t.get("name", "").lower()]
        return result

    def get_team(self, team_id: str) -> Optional[dict]:
        """Get single team by ID."""
        for team in self._teams:
            if team.get("teamId") == team_id:
                return team
        return None

    def compare_teams(self, team_a: dict, team_b: dict) -> dict:
        """Compare two teams across dimensions. (Req 5)"""
        metrics_a = {
            "attack": team_a.get("attackStrength", 0),
            "defence": team_a.get("defenceStrength", 0),
            "passing": team_a.get("passAccuracy", 0),
            "pressing": team_a.get("pressingIntensity", 0),
            "possession": team_a.get("possession", 0),
            "xgPerMatch": team_a.get("xGFor", 0),
        }
        metrics_b = {
            "attack": team_b.get("attackStrength", 0),
            "defence": team_b.get("defenceStrength", 0),
            "passing": team_b.get("passAccuracy", 0),
            "pressing": team_b.get("pressingIntensity", 0),
            "possession": team_b.get("possession", 0),
            "xgPerMatch": team_b.get("xGFor", 0),
        }

        # Find top 3 advantages for each team
        diffs = {k: metrics_a[k] - metrics_b[k] for k in metrics_a}
        sorted_diffs = sorted(diffs.items(), key=lambda x: x[1], reverse=True)

        advantages_a = [f"Superior {k}" for k, v in sorted_diffs[:3] if v > 0]
        advantages_b = [f"Superior {k}" for k, v in sorted_diffs[-3:] if v < 0]

        return {
            "teamA": {"name": team_a.get("name"), "metrics": metrics_a},
            "teamB": {"name": team_b.get("name"), "metrics": metrics_b},
            "tacticalAdvantages": {
                "teamA": advantages_a or ["Balanced performance"],
                "teamB": advantages_b or ["Balanced performance"],
            },
        }

    def get_players(self, team_id: Optional[str] = None, position: Optional[str] = None, search: Optional[str] = None) -> list[dict]:
        """Get players with optional filtering."""
        result = self._players
        if team_id:
            result = [p for p in result if p.get("teamId") == team_id]
        if position:
            result = [p for p in result if p.get("position") == position]
        if search and len(search) >= 3:
            search_lower = search.lower()
            result = [p for p in result if search_lower in p.get("name", "").lower()]
        return result

    def get_player(self, player_id: str) -> Optional[dict]:
        """Get single player by ID."""
        for player in self._players:
            if player.get("playerId") == player_id:
                return player
        return None

    def get_matches(self, team: Optional[str] = None, competition: Optional[str] = None,
                    season: Optional[str] = None, date_from: Optional[str] = None,
                    date_to: Optional[str] = None, manager: Optional[str] = None) -> list[dict]:
        """Get matches with filtering."""
        result = self._matches
        if team:
            team_lower = team.lower()
            result = [m for m in result if team_lower in m.get("homeTeam", "").lower() or team_lower in m.get("awayTeam", "").lower()]
        if competition:
            result = [m for m in result if m.get("competition") == competition]
        if season:
            result = [m for m in result if m.get("season") == season]
        return result

    def get_match(self, match_id: str) -> Optional[dict]:
        """Get single match by ID."""
        for match in self._matches:
            if match.get("matchId") == match_id:
                return match
        return None
