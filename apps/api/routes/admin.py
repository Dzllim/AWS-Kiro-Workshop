"""Admin routes - dataset management, model refresh, monitoring."""
from fastapi import APIRouter, HTTPException, status

router = APIRouter()

# Track whether an operation is in progress (Req 17.8)
_operation_in_progress = False


@router.post("/data/refresh")
async def refresh_data():
    """Trigger data pipeline refresh. (Req 17.1)"""
    global _operation_in_progress
    if _operation_in_progress:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A refresh operation is already in progress",
        )
    # TODO: Implement actual pipeline trigger
    return {"status": "triggered", "message": "Data refresh initiated"}


@router.post("/models/retrain")
async def retrain_models():
    """Trigger model retraining. (Req 17.3)"""
    global _operation_in_progress
    if _operation_in_progress:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A model training operation is already in progress",
        )
    # TODO: Implement actual model retraining
    return {"status": "triggered", "message": "Model retraining initiated"}


@router.get("/system/status")
async def system_status():
    """Get system health status. (Req 17.4)"""
    return {
        "status": "healthy",
        "dataSources": [
            {"name": "OpenFootball", "status": "healthy", "lastRefresh": "2026-07-03T06:00:00Z"},
            {"name": "ClubElo", "status": "healthy", "lastRefresh": "2026-07-03T06:00:00Z"},
            {"name": "football-data.org", "status": "healthy", "lastRefresh": "2026-07-03T06:00:00Z"},
        ],
        "modelVersion": "ensemble_v1_20260703",
        "operationInProgress": _operation_in_progress,
    }


@router.get("/system/logs")
async def system_logs(page: int = 1, page_size: int = 50, level: str | None = None):
    """Get system error logs. (Req 17.4)"""
    # TODO: Implement actual log retrieval
    return {"logs": [], "pagination": {"page": page, "pageSize": page_size, "total": 0}}
