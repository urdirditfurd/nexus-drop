"""Santé de l'API."""

import os
from pathlib import Path

from fastapi import APIRouter

from app.config import settings
from app.core.pricing_engine import PRICING_ENGINE_VERSION

router = APIRouter(tags=["health"])

PLAYWRIGHT_MARKER = Path(
    os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "/ms-playwright")
)


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Endpoint de liveness pour Docker / nginx."""
    pw_installed = "yes" if PLAYWRIGHT_MARKER.exists() else "no"
    return {
        "status": "ok",
        "service": "nexus-drop-backend",
        "pricing_engine_version": PRICING_ENGINE_VERSION,
        "environment": settings.environment,
        "scraper_headless": str(settings.scraper_headless).lower(),
        "scraper_proxy_active": str(bool(settings.effective_scraper_proxy)).lower(),
        "playwright_browsers_path": os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "(default)"),
        "playwright_installed": pw_installed,
    }
