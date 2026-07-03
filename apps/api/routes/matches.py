"""Match explorer routes - historical match search."""
from fastapi import APIRouter, HTTPException, Query
from services.data_service import DataService

router = APIRouter()
data_service = DataService()


@router.get("")
async def search_matches(
    team: str | None = None,
    competition: str | None = None,
    season: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    manager: str | None = None,
    page: int = 1,
    page_size: int = Query(default=20, le=100),
):
    """Search historical matches with filters. (Req 6)"""
    matches = data_service.get_matches(
        team=team,
        competition=competition,
        season=season,
        date_from=date_from,
        date_to=date_to,
        manager=manager,
    )

    # Pagination
    start = (page - 1) * page_size
    end = start + page_size
    paginated = matches[start:end]

    return {
        "matches": paginated,
        "pagination": {"page": page, "pageSize": page_size, "total": len(matches)},
    }


@router.get("/{match_id}")
async def get_match(match_id: str):
    """Get full match details. (Req 6)"""
    match = data_service.get_match(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.get("/lineup/{fixture_id}")
async def get_match_lineup(fixture_id: int):
    """Get confirmed lineup for a fixture (available ~30 min before kickoff).

    Uses API-Football. Only call this close to match time to conserve daily quota.
    """
    from services.api_football_service import ApiFootballService
    api_football = ApiFootballService()

    lineup = api_football.get_lineup(fixture_id)
    if not lineup:
        return {
            "lineup": None,
            "available": False,
            "message": "Lineup not yet announced. Typically available 30-60 minutes before kickoff.",
        }

    return {"lineup": lineup, "available": True}


@router.get("/today")
async def get_todays_fixtures():
    """Get today's fixtures with IDs (for lineup lookup). Uses API-Football."""
    from services.api_football_service import ApiFootballService
    api_football = ApiFootballService()

    fixtures = api_football.get_fixtures_today()
    return {"fixtures": fixtures, "count": len(fixtures)}
