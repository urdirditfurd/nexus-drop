"""Schémas authentification admin."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    # str volontaire : admin@nexus-drop.local n'est pas accepté par EmailStr
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminUserOut(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}
