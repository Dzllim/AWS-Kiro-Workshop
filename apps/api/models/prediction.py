"""Pydantic models for prediction requests and responses."""
from pydantic import BaseModel, Field
from typing import Optional


class PredictionRequest(BaseModel):
    """Request body for generating a match prediction."""
    home_team_id: str = Field(..., description="Home team identifier")
    away_team_id: str = Field(..., description="Away team identifier")
    competition: str = Field(..., description="Competition name")
    match_date: str = Field(..., description="Match date in ISO8601 format")
    weights: Optional[dict[str, int]] = Field(None, description="Custom factor weights (0-100)")


class Scoreline(BaseModel):
    """A single scoreline with probability."""
    home: int
    away: int
    probability: float


class FeatureContribution(BaseModel):
    """A prediction factor with its contribution percentage."""
    factor: str
    contribution: float


class AdditionalProbabilities(BaseModel):
    """BTTS, over/under, clean sheet probabilities."""
    clean_sheet_home: float = Field(..., ge=0, le=1)
    clean_sheet_away: float = Field(..., ge=0, le=1)
    btts: float = Field(..., ge=0, le=1)
    over: dict[str, float]
    under: dict[str, float]


class PlayerInsight(BaseModel):
    """Player goalscorer/danger information."""
    player_id: str
    name: str
    probability: Optional[float] = None
    danger_rating: Optional[float] = None


class PredictionResponse(BaseModel):
    """Full prediction result returned to client."""
    prediction_id: str
    home_team: dict
    away_team: dict
    probabilities: dict
    expected_goals: dict
    confidence_score: int = Field(..., ge=0, le=100)
    scorelines: list[Scoreline]
    scoreline_matrix: list[list[float]]
    additional_probabilities: AdditionalProbabilities
    feature_importance: list[FeatureContribution]
    first_goalscorer: Optional[PlayerInsight] = None
    most_dangerous: Optional[PlayerInsight] = None
    explanation: str
    insights: list[str]
    created_at: str


class WhatIfScenario(BaseModel):
    """A single what-if scenario to apply."""
    type: str = Field(..., description="Scenario type: player_injury, red_card, weather, venue_change")
    player_id: Optional[str] = None
    team: Optional[str] = None
    minute: Optional[int] = None
    condition: Optional[str] = None
    neutral: Optional[bool] = None


class WhatIfRequest(BaseModel):
    """Request body for what-if scenarios."""
    prediction_id: str
    scenarios: list[WhatIfScenario] = Field(..., max_length=5)


class WhatIfResponse(BaseModel):
    """What-if comparison result."""
    baseline: dict
    adjusted: dict
    differences: dict
    scenarios_applied: int
    explanation: str
