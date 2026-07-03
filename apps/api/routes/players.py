"""Player routes - player listing and profiles."""
from fastapi import APIRouter, HTTPException, Query
from services.data_service import DataService

router = APIRouter()
data_service = DataService()


@router.get("")
async def list_players(
    team_id: str | None = None,
    position: str | None = None,
    search: str | None = None,
    sort_by: str = "goals",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = Query(default=20, le=100),
):
    """List players with filtering and sorting. (Req 7)"""
    players = data_service.get_players(
        team_id=team_id, position=position, search=search
    )

    # Sort
    reverse = sort_order == "desc"
    players.sort(key=lambda p: p.get(sort_by, 0), reverse=reverse)

    # Pagination
    start = (page - 1) * page_size
    end = start + page_size
    paginated = players[start:end]

    return {
        "players": paginated,
        "pagination": {"page": page, "pageSize": page_size, "total": len(players)},
    }


@router.get("/{player_id}")
async def get_player(player_id: str):
    """Get full player profile with statistics. (Req 7)"""
    player = data_service.get_player(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player
