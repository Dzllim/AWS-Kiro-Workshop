"""Prediction service - orchestrates prediction engine calls."""
import uuid
from datetime import datetime, timezone
from typing import Optional
import sys
import os

# Add prediction engine to path
engine_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages", "prediction-engine")
sys.path.insert(0, engine_path)

from engine import PredictionEngine


class PredictionService:
    """Orchestrates prediction generation, caching, and scenarios."""

    def __init__(self):
        self._engine = PredictionEngine()
        self._prediction_cache: dict[str, dict] = {}

    def predict(
        self,
        home_team_id: str,
        away_team_id: str,
        competition: str,
        match_date: str,
        weights: Optional[dict[str, int]] = None,
    ) -> dict:
        """Generate a full match prediction. (Req 1, 2, 3, 11)"""
        result = self._engine.predict(
            home_team_id=home_team_id,
            away_team_id=away_team_id,
            competition=competition,
            weights=weights,
        )

        prediction_id = str(uuid.uuid4())
        result["prediction_id"] = prediction_id
        result["created_at"] = datetime.now(timezone.utc).isoformat()

        # Cache for what-if scenarios
        self._prediction_cache[prediction_id] = result
        return result

    def apply_what_if(self, prediction_id: str, scenarios: list) -> dict:
        """Apply what-if scenarios. (Req 9)"""
        baseline = self._prediction_cache.get(prediction_id)
        if not baseline:
            raise ValueError("Prediction not found. Generate a prediction first.")

        # Re-run prediction with scenario adjustments
        adjusted = self._engine.predict_with_scenarios(
            home_team_id=baseline["home_team"]["id"],
            away_team_id=baseline["away_team"]["id"],
            competition=baseline.get("competition", ""),
            scenarios=[s.model_dump() if hasattr(s, 'model_dump') else s for s in scenarios],
        )

        baseline_probs = baseline["probabilities"]
        adjusted_probs = adjusted["probabilities"]

        return {
            "baseline": baseline_probs,
            "adjusted": adjusted_probs,
            "differences": {
                "homeWin": round(adjusted_probs["homeWin"] - baseline_probs["homeWin"], 1),
                "draw": round(adjusted_probs["draw"] - baseline_probs["draw"], 1),
                "awayWin": round(adjusted_probs["awayWin"] - baseline_probs["awayWin"], 1),
            },
            "scenarios_applied": len(scenarios),
            "explanation": "Probabilities adjusted based on applied scenarios.",
        }

    def simulate_timeline(self, home_team_id: str, away_team_id: str, competition: str) -> dict:
        """Generate match timeline simulation. (Req 10)"""
        return self._engine.simulate_timeline(home_team_id, away_team_id)

    def inject_event(self, simulation_id: str, event: dict) -> dict:
        """Inject event into live simulation. (Req 22)"""
        return self._engine.calculate_live_event_impact(event)
