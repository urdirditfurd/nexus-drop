"""
DEPRECATED — NE PAS UTILISER.

Remplacé par backend/workers/pipeline.py + docker-compose services:
  - celery-worker
  - celery-beat

Voir scripts/start-automation.ps1 et DEPLOYMENT_CHECKLIST.md
"""

from __future__ import annotations

import logging
import os
import warnings

from celery import Celery

logger = logging.getLogger(__name__)
warnings.warn(
    "scraper/celery_app.py est DEPRECATED — utiliser backend/workers/pipeline.py",
    DeprecationWarning,
    stacklevel=2,
)
logger.warning("DEPRECATED: scraper/celery_app.py — stack legacy non maintenue")

_broker_url = os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Conservé pour compatibilité locale uniquement — ne pas lancer en prod
app = Celery("nexus_drop_scraper_legacy", broker=_broker_url, backend=_broker_url)
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Paris",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    imports=(),  # Désactivé — plus de tasks legacy
)
