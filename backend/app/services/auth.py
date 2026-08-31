"""Authentification JWT + bcrypt pour admin."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.admin_user import AdminUser


def hash_password(plain: str) -> str:
    """Hash bcrypt du mot de passe."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Vérifie le mot de passe contre le hash."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str) -> str:
    """Génère un JWT pour l'admin."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str | None:
    """Décode le JWT et retourne le subject (email) ou None."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None


async def authenticate_admin(
    session: AsyncSession,
    email: str,
    password: str,
) -> AdminUser | None:
    """Authentifie un admin par email/mot de passe."""
    result = await session.execute(
        select(AdminUser).where(AdminUser.email == email, AdminUser.is_active.is_(True))
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user


async def get_admin_by_email(session: AsyncSession, email: str) -> AdminUser | None:
    """Récupère un admin actif par email."""
    result = await session.execute(
        select(AdminUser).where(AdminUser.email == email, AdminUser.is_active.is_(True))
    )
    return result.scalar_one_or_none()
