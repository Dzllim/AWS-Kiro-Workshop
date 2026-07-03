"""Application configuration loaded from environment variables."""
import os

# Load .env file if it exists (development only)
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip())


class Settings:
    """Application settings with sensible defaults for development."""

    # API
    API_VERSION: str = "v1"
    API_PREFIX: str = f"/api/{API_VERSION}"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # CORS
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000"
    ).split(",")

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "matchlens-dev-secret-change-in-prod")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

    # Rate Limiting
    RATE_LIMIT_AUTHENTICATED: int = 100  # requests per minute
    RATE_LIMIT_UNAUTHENTICATED: int = 30  # requests per minute

    # AWS
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "matchlens-data")
    DYNAMODB_TABLE_PREFIX: str = os.getenv("DYNAMODB_TABLE_PREFIX", "matchlens-")

    # Bedrock
    BEDROCK_MODEL_ID: str = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
    BEDROCK_TIMEOUT: int = 10  # seconds

    # Prediction Engine
    MONTE_CARLO_SIMULATIONS: int = int(os.getenv("MONTE_CARLO_SIMULATIONS", "10000"))
    MAX_SCORELINE: int = 6  # Maximum goals per team in matrix

    # External APIs
    FOOTBALL_DATA_API_KEY: str = os.getenv("FOOTBALL_DATA_API_KEY", "")
    API_FOOTBALL_KEY: str = os.getenv("API_FOOTBALL_KEY", "")


settings = Settings()
