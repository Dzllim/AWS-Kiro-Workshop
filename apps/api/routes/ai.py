"""AI Coach routes - explanations and question answering."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


class ExplainRequest(BaseModel):
    prediction_id: str


class AskRequest(BaseModel):
    prediction_id: str
    question: str


@router.post("/explain")
async def get_explanation(request: ExplainRequest):
    """Get AI explanation for a prediction. (Req 4)"""
    try:
        result = await ai_service.explain_prediction(request.prediction_id)
        return result
    except Exception as e:
        # Fallback: return raw feature importance (Req 4.5)
        return {
            "explanation": "Explanation service temporarily unavailable.",
            "topFactors": [],
            "fallback": True,
        }


@router.post("/ask")
async def ask_coach(request: AskRequest):
    """Ask AI Coach a question about a prediction. (Req 4.2)"""
    try:
        result = await ai_service.answer_question(request.prediction_id, request.question)
        return result
    except Exception as e:
        return {
            "answer": "The AI Coach is temporarily unavailable. Please try again later.",
            "referencedFactors": [],
            "fallback": True,
        }
