"""Celery tasks for trend scanning, order fulfillment, and badge generation."""

from __future__ import annotations

import os
import random
import string
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from celery.utils.log import get_task_logger
from PIL import Image, ImageDraw, ImageFont

from anti_ban import default_headers, random_delay
from celery_app import app

logger = get_task_logger(__name__)

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000").rstrip("/")
MEDIA_DIR = Path(os.getenv("MEDIA_DIR", "/app/media"))

DEMO_TRENDS: list[dict[str, Any]] = [
    {
        "source": "amazon_fr",
        "title": "Brosse lissante ionique sans fil — chauffe rapide 200°C",
        "score": 92.4,
        "category": "Beauté",
        "price_eur": 34.99,
        "url": "https://www.amazon.fr/dp/demo-brosse-ionique",
    },
    {
        "source": "amazon_fr",
        "title": "Mini projecteur portable Full HD 1080p avec Android TV",
        "score": 88.1,
        "category": "High-tech",
        "price_eur": 89.0,
        "url": "https://www.amazon.fr/dp/demo-projecteur-hd",
    },
    {
        "source": "cdiscount",
        "title": "Aspirateur balai sans fil 3 en 1 — autonomie 45 min",
        "score": 86.7,
        "category": "Maison",
        "price_eur": 119.99,
        "url": "https://www.cdiscount.com/demo-aspirateur-balai",
    },
    {
        "source": "cdiscount",
        "title": "Set casseroles antiadhésives induction — 10 pièces",
        "score": 79.3,
        "category": "Cuisine",
        "price_eur": 54.9,
        "url": "https://www.cdiscount.com/demo-casseroles-set",
    },
    {
        "source": "temu",
        "title": "Lampe de bureau LED avec chargeur sans fil intégré",
        "score": 91.0,
        "category": "Bureau",
        "price_eur": 18.49,
        "url": "https://www.temu.com/fr/demo-lampe-led-chargeur",
    },
    {
        "source": "temu",
        "title": "Organisateur de câbles magnétique — lot de 6",
        "score": 74.5,
        "category": "Accessoires",
        "price_eur": 6.99,
        "url": "https://www.temu.com/fr/demo-organisateur-cables",
    },
    {
        "source": "tiktok_shop_fr",
        "title": "Gourde isotherme 1L avec paille — tendance #WaterBottle",
        "score": 95.2,
        "category": "Lifestyle",
        "price_eur": 14.9,
        "url": "https://shop.tiktok.com/fr/demo-gourde-isotherme",
    },
    {
        "source": "tiktok_shop_fr",
        "title": "Écouteurs Bluetooth sport IPX7 — réduction de bruit",
        "score": 89.8,
        "category": "Audio",
        "price_eur": 22.5,
        "url": "https://shop.tiktok.com/fr/demo-ecouteurs-sport",
    },
]


def _build_trend_payload() -> dict[str, Any]:
    scanned_at = datetime.now(timezone.utc).isoformat()
    items = [
        {
            **item,
            "id": str(uuid.uuid4()),
            "scanned_at": scanned_at,
            "country": "FR",
        }
        for item in DEMO_TRENDS
    ]
    return {"items": items, "scanned_at": scanned_at, "country": "FR"}


def _post_trends_bulk(payload: dict[str, Any]) -> dict[str, Any] | None:
    url = f"{BACKEND_URL}/trends/bulk"
    try:
        random_delay(0.3, 1.0)
        with httpx.Client(timeout=15.0, headers=default_headers()) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as exc:
        logger.warning("Backend indisponible (%s), retour local uniquement: %s", url, exc)
        return None


@app.task(name="tasks.scan_trends_fr", bind=True)
def scan_trends_fr(self) -> dict[str, Any]:
    """Scan French marketplaces (demo data) and push trends to the backend."""
    payload = _build_trend_payload()
    backend_result = _post_trends_bulk(payload)

    result: dict[str, Any] = {
        "task_id": self.request.id,
        "items_count": len(payload["items"]),
        "sources": sorted({item["source"] for item in payload["items"]}),
        "items": payload["items"],
        "posted_to_backend": backend_result is not None,
    }
    if backend_result is not None:
        result["backend_response"] = backend_result

    return result


def _generate_tracking_number() -> str:
    prefix = random.choice(("JD", "LX", "SF", "4PX", "YTO"))
    suffix = "".join(random.choices(string.digits, k=12))
    return f"{prefix}{suffix}FR"


@app.task(name="tasks.fulfill_order")
def fulfill_order(
    order_id: str,
    supplier: str = "mock_supplier",
    product_sku: str | None = None,
) -> dict[str, Any]:
    """Mock supplier purchase and return a tracking number."""
    random_delay(1.0, 3.0)

    purchase_id = f"PUR-{uuid.uuid4().hex[:12].upper()}"
    tracking_number = _generate_tracking_number()
    estimated_delivery_days = random.randint(5, 14)

    return {
        "order_id": order_id,
        "supplier": supplier,
        "product_sku": product_sku,
        "purchase_id": purchase_id,
        "status": "purchased",
        "tracking_number": tracking_number,
        "carrier": random.choice(["Colissimo", "Chronopost", "DPD", "GLS"]),
        "estimated_delivery_days": estimated_delivery_days,
        "fulfilled_at": datetime.now(timezone.utc).isoformat(),
    }


def _draw_badge_overlay(image: Image.Image, label: str = "TENDANCE") -> Image.Image:
    overlay = image.copy().convert("RGBA")
    width, height = overlay.size
    badge_height = max(28, height // 12)
    badge_width = min(width, badge_height * max(len(label), 4))

    badge = Image.new("RGBA", (badge_width, badge_height), (220, 38, 38, 210))
    draw = ImageDraw.Draw(badge)
    font_size = max(12, badge_height // 2)
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", font_size)
    except OSError:
        font = ImageFont.load_default()

    text_bbox = draw.textbbox((0, 0), label, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]
    draw.text(
        ((badge_width - text_w) / 2, (badge_height - text_h) / 2 - 1),
        label,
        fill=(255, 255, 255, 255),
        font=font,
    )

    overlay.paste(badge, (12, 12), badge)
    return overlay.convert("RGB")


@app.task(name="tasks.generate_badge_image")
def generate_badge_image(
    image_path: str | None = None,
    badge_label: str = "TENDANCE",
    output_path: str | None = None,
) -> dict[str, Any]:
    """Overlay a simple badge on the first product image when a path is provided."""
    if not image_path:
        return {
            "status": "skipped",
            "reason": "no_image_path",
            "output_path": None,
        }

    source = Path(image_path)
    if not source.is_file():
        return {
            "status": "error",
            "reason": "image_not_found",
            "image_path": image_path,
            "output_path": None,
        }

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    destination = Path(output_path) if output_path else MEDIA_DIR / f"badge_{source.stem}.jpg"

    with Image.open(source) as img:
        result_img = _draw_badge_overlay(img, label=badge_label)
        result_img.save(destination, format="JPEG", quality=90)

    return {
        "status": "ok",
        "image_path": str(source),
        "output_path": str(destination),
        "badge_label": badge_label,
    }
