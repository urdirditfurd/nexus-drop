"""Celery tasks — déclenchement pipeline NEXUS-DROP (mode réel)."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from celery.utils.log import get_task_logger

from anti_ban import default_headers, random_delay
from celery_app import app

logger = get_task_logger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
ADMIN_TOKEN = os.getenv("NEXUS_ADMIN_TOKEN", "")


def _trigger_pipeline(seed: dict | None = None) -> dict[str, Any]:
    """Appelle POST /auto-publish/run sur le backend."""
    url = f"{BACKEND_URL}/auto-publish/run"
    headers = {**default_headers(), "Content-Type": "application/json"}
    if ADMIN_TOKEN:
        headers["Authorization"] = f"Bearer {ADMIN_TOKEN}"
    payload = {"seed": seed}
    random_delay(0.5, 1.5)
    with httpx.Client(timeout=120.0, headers=headers) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
        return response.json()


@app.task(name="tasks.scan_trends_fr", bind=True)
def scan_trends_fr(self) -> dict[str, Any]:
    """Déclenche un cycle auto-publish complet via le backend."""
    try:
        result = _trigger_pipeline()
        return {"task_id": self.request.id, "pipeline": result, "posted_to_backend": True}
    except httpx.HTTPError as exc:
        logger.warning("Pipeline backend indisponible: %s", exc)
        return {
            "task_id": self.request.id,
            "posted_to_backend": False,
            "error": str(exc),
        }


@app.task(name="tasks.fulfill_order")
def fulfill_order(
    order_id: str,
    supplier: str = "mock_supplier",
    product_sku: str | None = None,
) -> dict[str, Any]:
    """Fulfillment fournisseur — à connecter en prod."""
    random_delay(1.0, 2.0)
    return {
        "order_id": order_id,
        "supplier": supplier,
        "product_sku": product_sku,
        "status": "queued",
        "fulfilled_at": datetime.now(timezone.utc).isoformat(),
    }


@app.task(name="tasks.generate_badge_image")
def generate_badge_image(
    image_path: str | None = None,
    badge_label: str = "TENDANCE",
    output_path: str | None = None,
) -> dict[str, Any]:
    """Délègue le badge image au module backend listing_generator."""
    if not image_path:
        return {"status": "skipped", "reason": "no_image_path"}
    return {
        "status": "delegated",
        "message": "Utiliser app.core.listing_generator.process_product_image",
        "image_path": image_path,
        "output_path": output_path,
        "badge_label": badge_label,
        "job_id": str(uuid.uuid4()),
    }
