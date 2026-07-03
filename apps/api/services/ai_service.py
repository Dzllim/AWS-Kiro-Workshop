"""AI Service - Amazon Bedrock integration for explanations."""
from config import settings


class AIService:
    """Generates AI explanations using Amazon Bedrock Converse API. (Req 4)"""

    async def explain_prediction(self, prediction_id: str) -> dict:
        """Generate AI explanation for a prediction.
        
        In production, this calls Amazon Bedrock Converse API.
        For development, returns a template-based explanation.
        """
        # Development fallback - template explanation
        # In production, replace with Bedrock Converse API call
        return {
            "explanation": (
                "Based on the prediction analysis, the home team is favoured due to "
                "their stronger recent form, higher Elo rating, and superior attacking efficiency. "
                "The home advantage also contributes positively, while the away team's defensive "
                "record partially offsets these factors. The confidence score reflects good data "
                "availability for this matchup."
            ),
            "topFactors": [
                {"factor": "Recent Form", "contribution": 22.5},
                {"factor": "Elo Rating", "contribution": 18.3},
                {"factor": "Attacking Strength", "contribution": 15.7},
                {"factor": "Home Advantage", "contribution": 12.1},
                {"factor": "Defensive Record", "contribution": -8.4},
            ],
            "wordCount": 67,
        }

    async def answer_question(self, prediction_id: str, question: str) -> dict:
        """Answer a user question about a prediction. (Req 4.2)
        
        In production, passes prediction context + question to Bedrock.
        """
        # Development fallback
        return {
            "answer": (
                f"Regarding your question about this prediction: The model considers multiple "
                f"factors including team strength ratings, recent form, and head-to-head history. "
                f"The primary reason for the predicted outcome is the difference in attacking "
                f"efficiency and recent results between the two teams."
            ),
            "referencedFactors": ["Recent Form", "Attacking Strength", "Elo Rating"],
        }
