"""
Point d'entrée NEXUS-DROP backend.
Lance uvicorn sur 0.0.0.0:8000.
"""

from __future__ import annotations

import logging
from pathlib import Path

import uvicorn

from app.config import MEDIA_DIR
from app.factory import create_app

# Configuration logging basique
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# S'assure que le dossier media existe
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
