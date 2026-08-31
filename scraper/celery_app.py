"""Celery application for NEXUS-DROP scraper worker."""

from __future__ import annotations

import os

from celery import Celery

_broker_url = os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = Celery("nexus_drop_scraper", broker=_broker_url, backend=_broker_url)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Europe/Paris",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    imports=("tasks",),
)
