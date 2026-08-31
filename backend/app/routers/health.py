"""Santé de l'API."""

import os

from fastapi import APIRouter

from app.core.pricing_engine import PRICING_ENGINE_VERSION

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Endpoint de liveness pour Docker / nginx."""
    return {
        "status": "ok",
        "service": "nexus-drop-backend",
        "pricing_engine_version": PRICING_ENGINE_VERSION,
        "playwright_browsers_path": os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "(default)"),
    }
