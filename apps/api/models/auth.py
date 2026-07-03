"""Pydantic models for authentication."""
from pydantic import BaseModel, Field, field_validator
import re


class RegisterRequest(BaseModel):
    """Registration request with email and password validation."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="Password (8+ chars, 1 upper, 1 lower, 1 digit)")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError("Invalid email address format")
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    """Login request."""
    email: str
    password: str


class AuthResponse(BaseModel):
    """Authentication response with JWT token."""
    token: str
    expires_at: str
    user: dict


class RegisterResponse(BaseModel):
    """Registration response."""
    user_id: str
    email: str
    token: str
    expires_at: str
