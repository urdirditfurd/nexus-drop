"""
Synchronisation des tendances scrapées → base PostgreSQL.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pipeline_types import TrendItem
from app.models.trend import Trend
from scraper.trends import scrape_trends

logger = logging.getLogger(__name__)


def _niche_for_keyword(keyword: str) -> str:
    lower = keyword.lower()
    if any(w in lower for w in ("yoga", "sport", "gourde", "fitness")):
        return "sport"
    if any(w in lower for w in ("voiture", "auto", "téléphone", "telephone")):
        return "auto-tech"
    if any(w in lower for w in ("led", "lumière", "lumiere", "déco", "deco")):
        return "home-deco"
    if any(w in lower for w in ("bureau", "laptop", "ergonomique")):
        return "home-office"
    return "general"


def trend_item_to_model(item: TrendItem, *, image_url: str | None = None, supplier_price: float | None = None) -> Trend:
    competitor = float(item.price or 0)
    supplier = supplier_price if supplier_price is not None else round(competitor * 0.38, 2)
    meta = {
        "title": item.title,
        "image_url": image_url,
        "supplier_price": supplier,
        "competitor_min": competitor,
        "source": item.source,
        "url": item.url,
        "asin": item.asin,
        "ean": item.ean,
    }
    return Trend(
        keyword=(item.keyword or item.title)[:255],
        niche=_niche_for_keyword(item.keyword or item.title),
        platform=(item.source or "multi")[:64],
        score=float(item.velocity_score or 50),
        search_volume=max(500, int(item.review_count or 0) * 40),
        avg_price=Decimal(str(competitor or "19.99")),
        competition="medium",
        metadata_json=json.dumps(meta, ensure_ascii=False),
        scanned_at=datetime.now(timezone.utc),
    )


async def sync_trends_from_scanner(session: AsyncSession, *, limit: int = 10) -> list[Trend]:
    """Scrape (avec fallback réaliste) et insère les tendances en base."""
    items = await scrape_trends(limit=limit)
    if not items:
        logger.error("sync_trends_from_scanner — aucune tendance même après fallback")
        return []

    from scraper.trends import get_fallback_metadata

    created: list[Trend] = []
    for item in items:
        meta = get_fallback_metadata(item.keyword or item.title)
        trend = trend_item_to_model(
            item,
            image_url=meta.get("image_url") if meta else None,
            supplier_price=meta.get("supplier_price") if meta else None,
        )
        session.add(trend)
        created.append(trend)

    await session.flush()
    for trend in created:
        await session.refresh(trend)

    logger.info("sync_trends_from_scanner — %d tendances persistées", len(created))
    return created


async def ensure_trends_seeded(session: AsyncSession, *, min_count: int = 5) -> list[Trend]:
    """Garantit des tendances en base — auto-seed si vide."""
    result = await session.execute(select(Trend).order_by(Trend.score.desc()))
    existing = list(result.scalars().all())
    if existing:
        return existing

    logger.warning("ensure_trends_seeded — base vide, déclenchement sync scanner + fallback")
    created = await sync_trends_from_scanner(session, limit=max(min_count, 8))
    return created
