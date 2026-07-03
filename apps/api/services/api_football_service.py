"""API-Football service for live lineups.

Free tier: 100 requests per day.
Strategy: Only fetch lineups when a match is within 60 minutes of kickoff.
Cache lineups for 5 minutes (they don't change once announced).

Host: v3.football.api-sports.io
Docs: https://www.api-football.com/documentation-v3
"""
import os
import json
import time
import logging
from typing import Optional
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

API_KEY = os.getenv("API_FOOTBALL_KEY", "")
BASE_URL = "https://v3.football.api-sports.io"

# Cache directory
CACHE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "cache" / "api-football"

# Cache lineup for 5 minutes (once announced, it rarely changes)
LINEUP_CACHE_DURATION = 300


class ApiFootballService:
    """Service for API-Football — primarily for live lineups."""

    def __init__(self):
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        self._daily_requests = 0
        self._request_date = datetime.now(timezone.utc).date()

    def get_lineup(self, fixture_id: int) -> Optional[dict]:
        """Get lineup for a specific fixture.

        Only call this when the match is within 60 minutes of kickoff.
        Lineups are typically announced 30-60 min before kickoff.

        Returns:
            Dict with home and away lineups, or None if not available.
        """
        # Check cache
        cached = self._read_cache(f"lineup_{fixture_id}")
        if cached is not None:
            return cached

        # Rate limit check (100/day)
        if not self._can_make_request():
            logger.warning("API-Football daily limit reached (100 requests)")
            return None

        if not API_KEY:
            logger.warning("API_FOOTBALL_KEY not set")
            return None

        try:
            import urllib.request

            url = f"{BASE_URL}/fixtures/lineups?fixture={fixture_id}"
            req = urllib.request.Request(url)
            req.add_header("x-apisports-key", API_KEY)

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())

            self._daily_requests += 1

            lineups = data.get("response", [])
            if not lineups:
                return None

            result = {"home": None, "away": None}

            for lineup in lineups:
                team_info = lineup.get("team", {})
                formation = lineup.get("formation", "")
                start_xi = []
                substitutes = []

                for player in lineup.get("startXI", []):
                    p = player.get("player", {})
                    start_xi.append({
                        "name": p.get("name", ""),
                        "number": p.get("number"),
                        "position": p.get("pos", ""),
                    })

                for player in lineup.get("substitutes", []):
                    p = player.get("player", {})
                    substitutes.append({
                        "name": p.get("name", ""),
                        "number": p.get("number"),
                        "position": p.get("pos", ""),
                    })

                team_data = {
                    "team": team_info.get("name", ""),
                    "formation": formation,
                    "startXI": start_xi,
                    "substitutes": substitutes,
                }

                # First team = home, second = away
                if result["home"] is None:
                    result["home"] = team_data
                else:
                    result["away"] = team_data

            # Cache it
            self._write_cache(f"lineup_{fixture_id}", result)
            logger.info(f"Fetched lineup for fixture {fixture_id}")
            return result

        except Exception as e:
            logger.error(f"API-Football lineup error: {e}")
            return None

    def get_fixtures_today(self) -> list[dict]:
        """Get today's fixtures to find fixture IDs.

        Call this once per day to know which matches are happening.
        """
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        cached = self._read_cache(f"fixtures_{today}")
        if cached is not None:
            return cached

        if not self._can_make_request() or not API_KEY:
            return []

        try:
            import urllib.request

            url = f"{BASE_URL}/fixtures?date={today}"
            req = urllib.request.Request(url)
            req.add_header("x-apisports-key", API_KEY)

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())

            self._daily_requests += 1

            fixtures = []
            for fixture in data.get("response", []):
                fixtures.append({
                    "fixture_id": fixture.get("fixture", {}).get("id"),
                    "date": fixture.get("fixture", {}).get("date"),
                    "status": fixture.get("fixture", {}).get("status", {}).get("short"),
                    "home_team": fixture.get("teams", {}).get("home", {}).get("name"),
                    "away_team": fixture.get("teams", {}).get("away", {}).get("name"),
                    "league": fixture.get("league", {}).get("name"),
                })

            # Cache for the day
            self._write_cache(f"fixtures_{today}", fixtures)
            return fixtures

        except Exception as e:
            logger.error(f"API-Football fixtures error: {e}")
            return []

    def _can_make_request(self) -> bool:
        """Check if we can make another request today."""
        today = datetime.now(timezone.utc).date()
        if today != self._request_date:
            self._request_date = today
            self._daily_requests = 0
        return self._daily_requests < 95  # Leave 5 buffer

    def _read_cache(self, key: str) -> Optional[any]:
        """Read from file cache if not expired."""
        cache_file = CACHE_DIR / f"{key}.json"
        if not cache_file.exists():
            return None

        age = time.time() - cache_file.stat().st_mtime
        if age > LINEUP_CACHE_DURATION:
            return None

        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def _write_cache(self, key: str, data: any):
        """Write data to file cache."""
        cache_file = CACHE_DIR / f"{key}.json"
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Cache write error: {e}")
