"""Squad service - fetches full squad, injuries, and lineups for club teams.

Uses API-Football (api-sports.io) for:
- /players/squads?team={id} — full squad roster
- /injuries?team={id}&season=2025 — current injuries
- /predictions?fixture={id} — predicted lineup

Caching strategy:
- Squad: cached 7 days (rosters don't change often)
- Injuries: cached 6 hours (updated daily)
- Lineups: cached 5 minutes (only near match time)
"""
import os
import json
import time
import logging
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)

API_KEY = os.getenv("API_FOOTBALL_KEY", "")
BASE_URL = "https://v3.football.api-sports.io"
CACHE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "cache" / "squads"

# API-Football team ID mapping for major clubs
# You can expand this by searching: GET /teams?search={name}
TEAM_ID_MAP = {
    # Premier League
    "Arsenal": 42, "Manchester City": 50, "Man City": 50, "Liverpool": 40,
    "Chelsea": 49, "Manchester United": 33, "Man United": 33, "Tottenham": 47,
    "Newcastle": 34, "Aston Villa": 66, "Brighton": 51,
    "West Ham": 48, "Everton": 45, "Nottingham Forest": 65,
    "Fulham": 36, "Brentford": 55, "Crystal Palace": 52,
    "Wolverhampton": 39, "Wolves": 39, "Bournemouth": 35, "Leicester": 46,
    "Leeds": 63, "Southampton": 41,
    "Nott'm Forest": 65,
    # La Liga
    "Real Madrid": 541, "Barcelona": 529, "Atletico Madrid": 530,
    "Real Sociedad": 548, "Athletic Bilbao": 531, "Villarreal": 533,
    # Bundesliga
    "Bayern Munich": 157, "Borussia Dortmund": 165,
    "RB Leipzig": 173, "Bayer Leverkusen": 168,
    # Serie A
    "Inter Milan": 505, "AC Milan": 489, "Napoli": 492,
    "Juventus": 496, "Roma": 497, "Atalanta": 499,
    # Ligue 1
    "PSG": 85, "Monaco": 91, "Marseille": 81, "Lille": 79, "Lyon": 80,
}

SQUAD_CACHE_DURATION = 7 * 86400  # 7 days
INJURY_CACHE_DURATION = 6 * 3600   # 6 hours


class SquadService:
    """Fetches and caches squad data from API-Football."""

    def __init__(self):
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def get_club_squad(self, team_name: str) -> Optional[list[dict]]:
        """Get full squad for a club team."""
        team_id = TEAM_ID_MAP.get(team_name)
        if not team_id:
            return None

        # Check cache
        cached = self._read_cache(f"squad_{team_id}", SQUAD_CACHE_DURATION)
        if cached is not None:
            return cached

        if not API_KEY:
            logger.warning("API_FOOTBALL_KEY not set")
            return None

        try:
            import urllib.request
            url = f"{BASE_URL}/players/squads?team={team_id}"
            req = urllib.request.Request(url)
            req.add_header("x-apisports-key", API_KEY)

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())

            players = []
            for item in data.get("response", []):
                for player in item.get("players", []):
                    pos_map = {"Goalkeeper": "GK", "Defender": "DEF", "Midfielder": "MID", "Attacker": "FWD"}
                    players.append({
                        "name": player.get("name", ""),
                        "position": pos_map.get(player.get("position", ""), "MID"),
                        "number": player.get("number"),
                        "photo": player.get("photo", ""),
                    })

            if players:
                self._write_cache(f"squad_{team_id}", players)
                logger.info(f"Fetched squad for {team_name}: {len(players)} players")

            return players

        except Exception as e:
            logger.error(f"API-Football squad error for {team_name}: {e}")
            return None

    def get_injuries(self, team_name: str) -> list[dict]:
        """Get current injuries for a club team."""
        team_id = TEAM_ID_MAP.get(team_name)
        if not team_id:
            return []

        # Check cache
        cached = self._read_cache(f"injuries_{team_id}", INJURY_CACHE_DURATION)
        if cached is not None:
            return cached

        if not API_KEY:
            return []

        try:
            import urllib.request
            url = f"{BASE_URL}/injuries?team={team_id}&season=2025"
            req = urllib.request.Request(url)
            req.add_header("x-apisports-key", API_KEY)

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())

            injuries = []
            seen = set()
            for item in data.get("response", []):
                player = item.get("player", {})
                name = player.get("name", "")
                if name in seen:
                    continue
                seen.add(name)

                injuries.append({
                    "name": name,
                    "position": "MID",  # API doesn't always give position in injury endpoint
                    "reason": item.get("player", {}).get("reason", "Injury"),
                    "type": item.get("player", {}).get("type", "Missing"),
                })

            self._write_cache(f"injuries_{team_id}", injuries)
            logger.info(f"Fetched injuries for {team_name}: {len(injuries)} players")
            return injuries

        except Exception as e:
            logger.error(f"API-Football injuries error for {team_name}: {e}")
            return []

    def get_team_id(self, team_name: str) -> Optional[int]:
        """Get API-Football team ID for a team name."""
        return TEAM_ID_MAP.get(team_name)

    def _read_cache(self, key: str, max_age: int) -> Optional[list]:
        cache_file = CACHE_DIR / f"{key}.json"
        if not cache_file.exists():
            return None
        age = time.time() - cache_file.stat().st_mtime
        if age > max_age:
            return None
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def _write_cache(self, key: str, data: list):
        cache_file = CACHE_DIR / f"{key}.json"
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Cache write error: {e}")


    def find_fixture(self, home_team: str, away_team: str, date: str) -> Optional[int]:
        """Find a fixture ID for a specific match on a given date.

        Args:
            home_team: Home team name
            away_team: Away team name
            date: Match date (YYYY-MM-DD)

        Returns:
            Fixture ID if found, None otherwise
        """
        home_id = TEAM_ID_MAP.get(home_team)
        away_id = TEAM_ID_MAP.get(away_team)

        if not home_id or not away_id or not API_KEY:
            return None

        # Check cache first
        cache_key = f"fixture_{home_id}_{away_id}_{date}"
        cached = self._read_cache(cache_key, 3600)  # Cache 1 hour
        if cached is not None:
            return cached.get("fixture_id") if isinstance(cached, dict) else cached

        try:
            import urllib.request
            url = f"{BASE_URL}/fixtures?team={home_id}&date={date}&season=2025"
            req = urllib.request.Request(url)
            req.add_header("x-apisports-key", API_KEY)

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())

            for fixture in data.get("response", []):
                teams = fixture.get("teams", {})
                fixture_home = teams.get("home", {}).get("id")
                fixture_away = teams.get("away", {}).get("id")

                if fixture_home == home_id and fixture_away == away_id:
                    fixture_id = fixture.get("fixture", {}).get("id")
                    self._write_cache(cache_key, {"fixture_id": fixture_id})
                    logger.info(f"Found fixture {fixture_id} for {home_team} vs {away_team} on {date}")
                    return fixture_id

            return None

        except Exception as e:
            logger.error(f"Fixture search error: {e}")
            return None

    def get_live_lineup(self, fixture_id: int) -> Optional[dict]:
        """Get confirmed lineup for a fixture (available ~30 min before kickoff).

        Returns:
            Dict with 'home' and 'away' lineup data, or None if not available yet.
        """
        if not API_KEY or not fixture_id:
            return None

        # Check cache (5 min - lineups don't change once announced)
        cached = self._read_cache(f"lineup_{fixture_id}", 300)
        if cached is not None:
            return cached

        try:
            import urllib.request
            url = f"{BASE_URL}/fixtures/lineups?fixture={fixture_id}"
            req = urllib.request.Request(url)
            req.add_header("x-apisports-key", API_KEY)

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())

            lineups = data.get("response", [])
            if not lineups:
                return None

            result = {"home": None, "away": None}

            for i, lineup in enumerate(lineups):
                team_name = lineup.get("team", {}).get("name", "")
                formation = lineup.get("formation", "")

                starting_xi = []
                for player in lineup.get("startXI", []):
                    p = player.get("player", {})
                    pos_map = {"G": "GK", "D": "DEF", "M": "MID", "F": "FWD"}
                    starting_xi.append({
                        "name": p.get("name", ""),
                        "number": p.get("number"),
                        "position": pos_map.get(p.get("pos", ""), "MID"),
                    })

                substitutes = []
                for player in lineup.get("substitutes", []):
                    p = player.get("player", {})
                    pos_map = {"G": "GK", "D": "DEF", "M": "MID", "F": "FWD"}
                    substitutes.append({
                        "name": p.get("name", ""),
                        "number": p.get("number"),
                        "position": pos_map.get(p.get("pos", ""), "MID"),
                    })

                team_data = {
                    "team": team_name,
                    "formation": formation,
                    "startingXI": starting_xi,
                    "substitutes": substitutes,
                }

                if i == 0:
                    result["home"] = team_data
                else:
                    result["away"] = team_data

            self._write_cache(f"lineup_{fixture_id}", result)
            logger.info(f"Fetched live lineup for fixture {fixture_id}")
            return result

        except Exception as e:
            logger.error(f"Live lineup error: {e}")
            return None
