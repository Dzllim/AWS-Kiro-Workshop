"""Prediction routes - core match prediction endpoints."""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import uuid
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages", "prediction-engine"))

from models.prediction import PredictionRequest, PredictionResponse, WhatIfRequest, WhatIfResponse
from services.prediction_service import PredictionService

router = APIRouter()
prediction_service = PredictionService()


@router.post("", response_model=PredictionResponse)
async def create_prediction(request: PredictionRequest):
    """Generate a match prediction. (Req 1, 2, 11)"""
    try:
        result = prediction_service.predict(
            home_team_id=request.home_team_id,
            away_team_id=request.away_team_id,
            competition=request.competition,
            match_date=request.match_date,
            weights=request.weights,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/lab", response_model=PredictionResponse)
async def prediction_lab(request: PredictionRequest):
    """Generate prediction with custom weights (Prediction Lab). (Req 3)"""
    if not request.weights:
        raise HTTPException(status_code=422, detail="Weights are required for Prediction Lab")

    try:
        result = prediction_service.predict(
            home_team_id=request.home_team_id,
            away_team_id=request.away_team_id,
            competition=request.competition,
            match_date=request.match_date,
            weights=request.weights,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/what-if", response_model=WhatIfResponse)
async def what_if_scenario(request: WhatIfRequest):
    """Apply what-if scenarios to an existing prediction. (Req 9)"""
    if len(request.scenarios) > 5:
        raise HTTPException(status_code=422, detail="Maximum 5 scenarios allowed")

    try:
        result = prediction_service.apply_what_if(
            prediction_id=request.prediction_id,
            scenarios=request.scenarios,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/{prediction_id}/save")
async def save_prediction(prediction_id: str):
    """Save a prediction to user's history. (Req 14)"""
    # TODO: Implement with DynamoDB persistence
    return {"saved": True, "predictionId": prediction_id}


@router.get("/history")
async def get_prediction_history(
    page: int = 1,
    page_size: int = 20,
    competition: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    status: str | None = None,
):
    """Get user's prediction history. (Req 14)"""
    # TODO: Implement with DynamoDB query
    return {
        "predictions": [],
        "pagination": {"page": page, "pageSize": page_size, "total": 0},
        "accuracyStats": {"correct": 0, "partial": 0, "incorrect": 0, "pending": 0, "accuracy": 0.0},
    }
