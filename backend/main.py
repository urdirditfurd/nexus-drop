"""
Point d'entrée NEXUS-DROP backend.
Lance uvicorn sur 0.0.0.0:8000.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

# Cursor sandbox injecte un PLAYWRIGHT_BROWSERS_PATH invalide — forcer l'install globale
_pw_path = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "")
if not _pw_path or "cursor-sandbox-cache" in _pw_path.replace("\\", "/").lower():
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "0"

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
