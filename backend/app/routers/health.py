"""Santé de l'API."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Endpoint de liveness pour Docker / nginx."""
    return {"status": "ok", "service": "nexus-drop-backend"}
