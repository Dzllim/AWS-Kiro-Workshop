"""MatchLens API - FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from config import settings
from routes import auth, predictions, teams, players, matches, simulations, ai, models, admin

app = FastAPI(
    title="MatchLens API",
    description="AI-powered football analytics prediction API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware (Req 19.3)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(predictions.router, prefix=f"{settings.API_PREFIX}/predictions", tags=["Predictions"])
app.include_router(teams.router, prefix=f"{settings.API_PREFIX}/teams", tags=["Teams"])
app.include_router(players.router, prefix=f"{settings.API_PREFIX}/players", tags=["Players"])
app.include_router(matches.router, prefix=f"{settings.API_PREFIX}/matches", tags=["Matches"])
app.include_router(simulations.router, prefix=f"{settings.API_PREFIX}/simulations", tags=["Simulations"])
app.include_router(ai.router, prefix=f"{settings.API_PREFIX}/ai", tags=["AI Coach"])
app.include_router(models.router, prefix=f"{settings.API_PREFIX}/models", tags=["Models"])
app.include_router(admin.router, prefix=f"{settings.API_PREFIX}/admin", tags=["Admin"])


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancer."""
    return {"status": "healthy", "version": "1.0.0"}


# Lambda handler for AWS deployment
handler = Mangum(app)
