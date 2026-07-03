"""Team routes - team listing and comparison."""
from fastapi import APIRouter, HTTPException, Query
from services.data_service import DataService
from services.football_data_service import FootballDataService

router = APIRouter()
data_service = DataService()
football_data = FootballDataService()


@router.get("")
async def list_teams(
    competition: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = Query(default=200, le=500),
):
    """List teams with optional filtering. (Req 5, 6)"""
    teams = data_service.get_teams(competition=competition, search=search)

    # Pagination
    start = (page - 1) * page_size
    end = start + page_size
    paginated = teams[start:end]

    return {
        "teams": paginated,
        "pagination": {"page": page, "pageSize": page_size, "total": len(teams)},
    }


@router.get("/compare")
async def compare_teams(team_a: str = Query(...), team_b: str = Query(...)):
    """Compare two teams across performance dimensions. (Req 5)"""
    team_a_data = data_service.get_team(team_a)
    team_b_data = data_service.get_team(team_b)

    if not team_a_data:
        raise HTTPException(status_code=404, detail=f"Team {team_a} not found")
    if not team_b_data:
        raise HTTPException(status_code=404, detail=f"Team {team_b} not found")

    comparison = data_service.compare_teams(team_a_data, team_b_data)
    return comparison


@router.get("/{team_id}")
async def get_team(team_id: str):
    """Get full team details. (Req 5)"""
    team = data_service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.get("/competition/{competition}/squads")
async def get_competition_squads(competition: str):
    """Get all team squads for a competition (cached 24h). Uses football-data.org."""
    teams = football_data.get_competition_teams(competition)
    if not teams:
        return {"teams": [], "source": "unavailable", "note": "Data not cached yet or API unavailable"}
    return {"teams": teams, "source": "football-data.org", "cached": True}


@router.get("/{team_id}/squad")
async def get_team_squad(team_id: str):
    """Get squad for a specific team."""
    # Try football-data.org first (for club teams)
    try:
        numeric_id = int(team_id.replace("team-", ""))
        squad = football_data.get_team_squad(numeric_id)
        if squad:
            return {"squad": squad, "source": "football-data.org"}
    except (ValueError, TypeError):
        pass

    # Fall back to local data
    team = data_service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"squad": [], "source": "local", "note": "Squad data not available for this team"}


@router.get("/roster/{team_name}")
async def get_team_roster(team_name: str):
    """Get World Cup 2026 roster for a team by name."""
    import json
    from pathlib import Path

    roster_path = Path(__file__).parent.parent.parent.parent / "data" / "raw" / "rosters" / "worldcup2026.json"

    if not roster_path.exists():
        return {"roster": [], "available": False}

    with open(roster_path, "r", encoding="utf-8") as f:
        rosters = json.load(f)

    # Try exact match first, then case-insensitive
    squad = rosters.get(team_name)
    if not squad:
        for key, value in rosters.items():
            if key.startswith("_"):
                continue
            if key.lower() == team_name.lower():
                squad = value
                break

    if not squad:
        return {"roster": [], "available": False, "team": team_name}

    return {"roster": squad, "available": True, "team": team_name}


@router.get("/squad-details/{team_name}")
async def get_squad_details(team_name: str):
    """Get comprehensive squad data for a team.

    Returns: full squad, expected XI, bench, injured, suspended players.
    Sources:
    - International teams: Static FIFA roster file
    - Club teams: API-Football (squad + injuries)
    """
    import json
    from pathlib import Path
    from services.squad_service import SquadService

    roster_path = Path(__file__).parent.parent.parent.parent / "data" / "raw" / "rosters" / "worldcup2026.json"
    squad_service = SquadService()

    # Name aliases
    NAME_ALIASES = {
        "cape verde": "Cabo Verde", "cabo verde": "Cabo Verde",
        "south korea": "Korea Republic", "korea": "Korea Republic",
        "iran": "IR Iran", "ir iran": "IR Iran",
        "turkey": "Türkiye", "turkiye": "Türkiye",
        "usa": "USA", "united states": "USA",
        "ivory coast": "Côte d'Ivoire", "cote d'ivoire": "Côte d'Ivoire",
    }

    resolved_name = NAME_ALIASES.get(team_name.lower(), team_name)

    squad = []
    starting_xi = []
    bench = []
    injured = []
    suspended = []
    expected_lineup = []
    formation = ""
    source = "none"

    # 1. Try club team via API-Football
    club_squad = squad_service.get_club_squad(resolved_name)
    if club_squad:
        squad = club_squad
        source = "api-football"

        # Get injuries
        injury_list = squad_service.get_injuries(resolved_name)
        injured_names = set(p["name"] for p in injury_list)
        injured = [{"name": p["name"], "position": "MID", "reason": p.get("reason", "Injury")} for p in injury_list]

        # Build expected XI: pick first available GK + 4 DEF + 3 MID + 3 FWD
        available = [p for p in squad if p["name"] not in injured_names]
        gks = [p for p in available if p["position"] == "GK"]
        defs = [p for p in available if p["position"] == "DEF"]
        mids = [p for p in available if p["position"] == "MID"]
        fwds = [p for p in available if p["position"] == "FWD"]

        expected_lineup = (gks[:1] + defs[:4] + mids[:3] + fwds[:3])
        bench = [p for p in available if p not in expected_lineup][:12]
        formation = "4-3-3"

    # 2. Try international team via static roster
    if not squad and roster_path.exists():
        with open(roster_path, "r", encoding="utf-8") as f:
            rosters = json.load(f)

        roster = None
        for key, value in rosters.items():
            if key.startswith("_"):
                continue
            if key.lower() == resolved_name.lower():
                roster = value
                break

        if roster:
            squad = roster
            source = "fifa-roster"

            # Build expected XI by caps (most experienced)
            gks = sorted([p for p in roster if p.get("position") == "GK"], key=lambda x: x.get("caps", 0), reverse=True)
            defs = sorted([p for p in roster if p.get("position") == "DEF"], key=lambda x: x.get("caps", 0), reverse=True)
            mids = sorted([p for p in roster if p.get("position") == "MID"], key=lambda x: x.get("caps", 0), reverse=True)
            fwds = sorted([p for p in roster if p.get("position") == "FWD"], key=lambda x: x.get("caps", 0), reverse=True)

            expected_lineup = (gks[:1] + defs[:4] + mids[:3] + fwds[:3])
            bench = [p for p in roster if p not in expected_lineup]
            formation = "4-3-3"

    if not squad:
        return {
            "available": False,
            "squad": [], "startingXI": [], "bench": [],
            "injured": [], "suspended": [],
            "expectedLineup": [], "formation": "",
            "source": "none",
            "message": f"Squad data not available for {team_name}.",
        }

    return {
        "available": True,
        "squad": squad,
        "startingXI": starting_xi,
        "bench": bench,
        "injured": injured,
        "suspended": suspended,
        "expectedLineup": expected_lineup,
        "formation": formation,
        "source": source,
    }


@router.get("/live-lineup")
async def get_live_lineup(home_team: str, away_team: str, date: str = ""):
    """Get confirmed live lineup for a match (available ~30 min before kickoff).

    If the match has a real fixture today and lineups are announced,
    returns the confirmed starting XI and bench for both teams.
    """
    from services.squad_service import SquadService
    from datetime import datetime, timezone

    squad_service = SquadService()

    # Use today's date if none provided
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Find the fixture
    fixture_id = squad_service.find_fixture(home_team, away_team, date)

    if not fixture_id:
        return {
            "available": False,
            "message": "No fixture found for this match on the given date.",
            "fixture_id": None,
        }

    # Try to get live lineup
    lineup = squad_service.get_live_lineup(fixture_id)

    if not lineup:
        return {
            "available": False,
            "message": "Lineup not yet announced. Typically available 30-60 minutes before kickoff.",
            "fixture_id": fixture_id,
        }

    return {
        "available": True,
        "fixture_id": fixture_id,
        "home": lineup.get("home"),
        "away": lineup.get("away"),
    }
