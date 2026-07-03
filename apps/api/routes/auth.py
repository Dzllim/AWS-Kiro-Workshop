"""Authentication routes - register, login."""
from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
import uuid

from config import settings
from models.auth import RegisterRequest, LoginRequest, AuthResponse, RegisterResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# In-memory user store for development (DynamoDB in production)
users_db: dict[str, dict] = {}


def create_token(user_id: str, role: str) -> tuple[str, str]:
    """Generate JWT token with expiration."""
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expires,
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, expires.isoformat()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """Register a new user account. (Req 13.1)"""
    # Check if email already exists
    for user in users_db.values():
        if user["email"] == request.email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

    user_id = str(uuid.uuid4())
    password_hash = pwd_context.hash(request.password)

    users_db[user_id] = {
        "user_id": user_id,
        "email": request.email,
        "password_hash": password_hash,
        "role": "user",
        "favourite_teams": [],
        "dark_mode": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    token, expires_at = create_token(user_id, "user")

    return RegisterResponse(
        user_id=user_id,
        email=request.email,
        token=token,
        expires_at=expires_at,
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT token. (Req 13.3, 13.4)"""
    # Find user by email
    user = None
    for u in users_db.values():
        if u["email"] == request.email.lower():
            user = u
            break

    # Generic error message - don't reveal which field is wrong (Req 13.4)
    if not user or not pwd_context.verify(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token, expires_at = create_token(user["user_id"], user["role"])

    return AuthResponse(
        token=token,
        expires_at=expires_at,
        user={
            "userId": user["user_id"],
            "email": user["email"],
            "role": user["role"],
        },
    )
