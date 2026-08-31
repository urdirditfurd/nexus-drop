"""Connexion SQLAlchemy 2 async — PostgreSQL ou SQLite."""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _build_engine():
    """Crée le moteur async selon DATABASE_URL."""
    connect_args: dict = {}
    if settings.is_sqlite:
        # Obligatoire pour SQLite async en multi-thread (uvicorn)
        connect_args["check_same_thread"] = False

    return create_async_engine(
        settings.database_url,
        echo=False,
        connect_args=connect_args,
        pool_pre_ping=not settings.is_sqlite,
    )


engine = _build_engine()
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base déclarative SQLAlchemy 2."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dépendance FastAPI — session DB par requête."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
