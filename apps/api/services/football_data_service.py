"""football-data.org API service.

Free tier: 10 requests per minute.
Strategy: Cache squad data for 24 hours. Only refresh on demand.

Endpoints used:
- GET /v4/competitions/{id}/teams — teams in a competition
- GET /v4/teams/{id} — team details with squad
"""
import os
import json
import time
import logging
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)

API_KEY = os.getenv("FOOTBALL_DATA_API_KEY", "")
BASE_URL = "https://api.football-data.org/v4"

# Cache directory
CACHE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "cache" / "football-data"

# Competition IDs for football-data.org
COMPETITION_IDS = {
    "Premier League": "PL",
    "La Liga": "PD",
    "Bundesliga": "BL1",
    "Serie A": "SA",
    "Ligue 1": "FL1",
    "Champions League": "CL",
    "World Cup": "WC",
}

# Cache duration: 24 hours
CACHE_DURATION = 86400


class FootballDataService:
    """Service for football-data.org API with file-based caching."""

    def __init__(self):
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def get_competition_teams(self, competition: str) -> list[dict]:
        """Get teams for a competition (cached for 24h).

        Returns list of teams with squad players.
        """
        comp_id = COMPETITION_IDS.get(competition)
        if not comp_id:
            return []

        # Check cache first
        cached = self._read_cache(f"teams_{comp_id}")
        if cached is not None:
            return cached

        # Fetch from API
        if not API_KEY:
            logger.warning("FOOTBALL_DATA_API_KEY not set, using sample data")
            return []

        try:
            import urllib.request

            url = f"{BASE_URL}/competitions/{comp_id}/teams"
            req = urllib.request.Request(url)
            req.add_header("X-Auth-Token", API_KEY)

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())

            teams = []
            for team in data.get("teams", []):
                squad = []
                for player in team.get("squad", []):
                    squad.append({
                        "name": player.get("name", ""),
                        "position": self._map_position(player.get("position", "")),
                        "number": player.get("shirtNumber"),
                        "nationality": player.get("nationality", ""),
                        "dateOfBirth": player.get("dateOfBirth", ""),
                    })

                teams.append({
                    "id": team.get("id"),
                    "name": team.get("name", ""),
                    "shortName": team.get("shortName", ""),
                    "crest": team.get("crest", ""),
                    "squad": squad,
                })

            # Cache the result
            self._write_cache(f"teams_{comp_id}", teams)
            logger.info(f"Fetched {len(teams)} teams for {competition} from football-data.org")
            return teams

        except Exception as e:
            logger.error(f"football-data.org API error: {e}")
            return []

    def get_team_squad(self, team_id: int) -> list[dict]:
        """Get squad for a specific team (cached for 24h)."""
        cached = self._read_cache(f"squad_{team_id}")
        if cached is not None:
            return cached

        if not API_KEY:
            return []

        try:
            import urllib.request

            url = f"{BASE_URL}/teams/{team_id}"
            req = urllib.request.Request(url)
            req.add_header("X-Auth-Token", API_KEY)

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())

            squad = []
            for player in data.get("squad", []):
                squad.append({
                    "name": player.get("name", ""),
                    "position": self._map_position(player.get("position", "")),
                    "number": player.get("shirtNumber"),
                    "nationality": player.get("nationality", ""),
                })

            self._write_cache(f"squad_{team_id}", squad)
            return squad

        except Exception as e:
            logger.error(f"football-data.org squad error: {e}")
            return []

    def _map_position(self, pos: str) -> str:
        """Map football-data.org position names to our short codes."""
        mapping = {
            "Goalkeeper": "GK",
            "Defence": "DEF",
            "Left-Back": "DEF",
            "Right-Back": "DEF",
            "Centre-Back": "DEF",
            "Midfield": "MID",
            "Defensive Midfield": "MID",
            "Central Midfield": "MID",
            "Attacking Midfield": "MID",
            "Left Winger": "FWD",
            "Right Winger": "FWD",
            "Offence": "FWD",
            "Centre-Forward": "FWD",
        }
        return mapping.get(pos, "MID")

    def _read_cache(self, key: str) -> Optional[list]:
        """Read from file cache if not expired."""
        cache_file = CACHE_DIR / f"{key}.json"
        if not cache_file.exists():
            return None

        # Check age
        age = time.time() - cache_file.stat().st_mtime
        if age > CACHE_DURATION:
            return None

        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def _write_cache(self, key: str, data: list):
        """Write data to file cache."""
        cache_file = CACHE_DIR / f"{key}.json"
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Cache write error: {e}")
