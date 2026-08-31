"""Authentification admin JWT."""

from fastapi import APIRouter, HTTPException, status

from app.deps import AdminDep, DbDep
from app.schemas.auth import AdminUserOut, LoginRequest, TokenResponse
from app.services.auth import authenticate_admin, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: DbDep) -> TokenResponse:
    """Connexion admin — retourne un JWT bearer."""
    admin = await authenticate_admin(session, body.email, body.password)
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )
    token = create_access_token(admin.email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=AdminUserOut)
async def me(admin: AdminDep) -> AdminUserOut:
    """Profil de l'admin connecté."""
    return AdminUserOut.model_validate(admin)
