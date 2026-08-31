"""Tâches Celery fulfillment — Redis ou mock synchrone."""

from __future__ import annotations

import logging
import uuid

from celery import Celery

from app.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "nexus_drop",
    broker=settings.broker_url,
    backend=settings.broker_url,
)


@celery_app.task(name="nexus_drop.fulfill_order")
def fulfill_order_task(order_id: int) -> dict:
    """Tâche stub — marque la commande comme expédiée côté worker."""
    logger.info("Fulfillment stub pour commande #%s", order_id)
    return {"order_id": order_id, "status": "fulfilled_stub"}


def _redis_available() -> bool:
    """Vérifie si Redis répond (pour choisir async vs sync)."""
    try:
        import redis

        client = redis.from_url(settings.broker_url, socket_connect_timeout=1)
        client.ping()
        return True
    except Exception:
        return False


def queue_fulfill_order(order_id: int) -> tuple[bool, str | None, str]:
    """
    Enfile la tâche Celery si Redis disponible, sinon exécution mock synchrone.
    Retourne (queued, task_id, message).
    """
    if _redis_available():
        try:
            async_result = fulfill_order_task.delay(order_id)
            return True, async_result.id, "Tâche fulfillment enfilée via Celery/Redis."
        except Exception as exc:
            logger.warning("Celery indisponible (%s), mock sync", exc)

    # Mock synchrone sans broker
    result = fulfill_order_task(order_id)
    mock_id = f"sync-{uuid.uuid4().hex[:12]}"
    return False, mock_id, f"Fulfillment mock synchrone : {result['status']}"
