"""
Celery Beat — scheduler auto-publish SÛR (6h, max 10 produits/run).
Lance: celery -A workers.celerybeat beat --loglevel=info
"""

from __future__ import annotations

import logging
import os

from celery.schedules import crontab

from workers.pipeline import app

logger = logging.getLogger(__name__)

CRON_RAW = os.getenv("AUTO_PUBLISH_CRON_SCHEDULE", "0 */6 * * *")
MAX_PRODUCTS = int(os.getenv("AUTO_PUBLISH_MAX_PRODUCTS", "10"))


def _parse_cron(expr: str) -> crontab:
    parts = expr.strip().split()
    if len(parts) != 5:
        logger.warning("Cron invalide '%s' — fallback 0 */6 * * *", expr)
        parts = "0 */6 * * *".split()
    minute, hour, day_of_month, month, day_of_week = parts
    return crontab(
        minute=minute,
        hour=hour,
        day_of_month=day_of_month,
        month_of_year=month,
        day_of_week=day_of_week,
    )


app.conf.beat_schedule = {
    "auto-publish-safe-batch": {
        "task": "pipeline.run_scheduled_batch",
        "schedule": _parse_cron(CRON_RAW),
        "kwargs": {"max_products": MAX_PRODUCTS},
    },
}
app.conf.timezone = "Europe/Paris"
