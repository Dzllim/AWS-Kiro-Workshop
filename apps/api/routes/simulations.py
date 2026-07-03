"""Simulation routes - timeline and live event simulation."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.prediction_service import PredictionService

router = APIRouter()
prediction_service = PredictionService()


class TimelineRequest(BaseModel):
    home_team_id: str
    away_team_id: str
    competition: str
    speed: int = 1


class LiveEventRequest(BaseModel):
    simulation_id: str
    event: dict


@router.post("/timeline")
async def start_timeline(request: TimelineRequest):
    """Start a match timeline simulation. (Req 10)"""
    try:
        result = prediction_service.simulate_timeline(
            home_team_id=request.home_team_id,
            away_team_id=request.away_team_id,
            competition=request.competition,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/live-event")
async def inject_live_event(request: LiveEventRequest):
    """Inject event into live simulation. (Req 22)"""
    try:
        result = prediction_service.inject_event(
            simulation_id=request.simulation_id,
            event=request.event,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
