"""Model performance routes."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/metrics")
async def get_model_metrics():
    """Get performance metrics for all models. (Req 8)"""
    # Sample metrics for development
    return {
        "models": [
            {
                "modelId": "logistic_regression",
                "name": "Logistic Regression",
                "accuracy": 68.2,
                "precision": 65.4,
                "recall": 70.1,
                "f1Score": 67.7,
                "rocAuc": 0.73,
            },
            {
                "modelId": "random_forest",
                "name": "Random Forest",
                "accuracy": 70.5,
                "precision": 68.9,
                "recall": 71.3,
                "f1Score": 70.1,
                "rocAuc": 0.76,
            },
            {
                "modelId": "xgboost",
                "name": "XGBoost",
                "accuracy": 72.1,
                "precision": 70.3,
                "recall": 73.2,
                "f1Score": 71.7,
                "rocAuc": 0.78,
            },
            {
                "modelId": "lightgbm",
                "name": "LightGBM",
                "accuracy": 71.8,
                "precision": 69.7,
                "recall": 72.9,
                "f1Score": 71.3,
                "rocAuc": 0.77,
            },
            {
                "modelId": "ensemble",
                "name": "Ensemble (Primary)",
                "accuracy": 73.4,
                "precision": 71.2,
                "recall": 74.1,
                "f1Score": 72.6,
                "rocAuc": 0.79,
            },
        ],
        "lastUpdated": "2026-07-01T00:00:00Z",
    }


@router.get("/compare")
async def compare_models(
    home_team_id: str = "",
    away_team_id: str = "",
    competition: str = "",
    match_date: str = "",
):
    """Compare model predictions for a match. (Req 8.3)"""
    # TODO: Implement actual model comparison
    return {"comparison": []}
