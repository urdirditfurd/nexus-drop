"""
Orchestrateur pipeline auto-publish NEXUS-DROP.
Scan → Source → Compare → Prix sécurisé → Listing → Publish / Quarantaine.
"""

from __future__ import annotations

import logging
import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.listing_generator import generate_listing, process_product_image, publish_to_storefront
from app.core.pipeline_types import PipelineResult, PipelineSeed, PricingStatus
from app.core.pricing_engine import calculate_safe_price
from app.models.auto_publish_log import AutoPublishLog
from app.models.product import Product
from app.models.trend import Trend
from scraper.competitors import get_market_price
from scraper.sourcing import find_best_supplier
from scraper.trends import scrape_trends

logger = logging.getLogger(__name__)


async def _log_action(
    session: AsyncSession,
    action: str,
    status: str,
    *,
    product_id: int | None = None,
    title: str | None = None,
    reason: str | None = None,
) -> None:
    session.add(
        AutoPublishLog(
            action=action,
            product_id=product_id,
            title=title,
            status=status,
            reason=reason,
        )
    )


async def _save_quarantine(
    session: AsyncSession,
    seed: PipelineSeed,
    reason: str,
    *,
    cost: float = 0,
    supplier_name: str | None = None,
) -> Product:
    sku = f"NXD-Q-{uuid.uuid4().hex[:8].upper()}"
    product = Product(
        sku=sku,
        title=(seed.title or seed.keyword or "Produit en quarantaine")[:512],
        description=f"Quarantaine auto-publish: {reason}",
        cost_price=Decimal(str(cost)),
        sell_price=Decimal("0"),
        status="quarantine",
        quarantine_reason=reason,
        asin=seed.asin,
        ean=seed.ean,
        source_url=seed.source_url,
        keyword=seed.keyword,
    )
    session.add(product)
    await session.flush()
    await _log_action(
        session,
        "quarantine",
        "quarantine",
        product_id=product.id,
        title=product.title,
        reason=reason,
    )
    logger.warning("QUARANTINE produit id=%s — %s", product.id, reason)
    return product


async def _historical_avg(session: AsyncSession, keyword: str) -> float | None:
    result = await session.execute(
        select(Trend.avg_price).where(Trend.keyword.ilike(f"%{keyword[:40]}%")).limit(5)
    )
    prices = [float(p) for p in result.scalars().all() if p is not None]
    if not prices:
        return None
    return sum(prices) / len(prices)


async def run_full_automation_pipeline(
    session: AsyncSession,
    product_seed: dict | PipelineSeed | None = None,
) -> PipelineResult:
    """
    Pipeline complet anti-catastrophe.
    Toute anomalie → quarantaine DB, jamais publication directe.
    """
    try:
        return await _run_pipeline(session, product_seed)
    except Exception as exc:
        logger.error("Pipeline crash évité — quarantaine d'urgence: %s", exc, exc_info=True)
        await session.rollback()
        seed = (
            product_seed
            if isinstance(product_seed, PipelineSeed)
            else PipelineSeed.model_validate(product_seed or {})
        )
        product = await _save_quarantine(
            session,
            seed,
            f"Erreur pipeline non gérée: {exc}",
        )
        await session.flush()
        return PipelineResult(
            success=False,
            product_id=product.id,
            status="quarantine",
            reason=str(exc),
            steps=["pipeline_crash"],
        )


async def _run_pipeline(
    session: AsyncSession,
    product_seed: dict | PipelineSeed | None = None,
) -> PipelineResult:
    seed = (
        product_seed
        if isinstance(product_seed, PipelineSeed)
        else PipelineSeed.model_validate(product_seed or {})
    )
    steps: list[str] = []

    # 1. Trend scan si pas de seed
    trend = None
    if not seed.keyword and not seed.title:
        steps.append("scan_trends")
        trends = await scrape_trends(limit=5)
        if not trends:
            db_trend = (
                await session.execute(select(Trend).order_by(Trend.score.desc()).limit(1))
            ).scalar_one_or_none()
            if db_trend:
                from app.core.pipeline_types import TrendItem

                trends = [
                    TrendItem(
                        title=db_trend.keyword,
                        keyword=db_trend.keyword,
                        price=float(db_trend.avg_price or 29.99),
                        review_count=db_trend.search_volume or 100,
                        source="db_cache",
                        velocity_score=db_trend.score,
                    )
                ]
                steps.append("trend_fallback_db")
            else:
                product = await _save_quarantine(
                    session,
                    seed,
                    "Aucune tendance détectée — scan vide ou Playwright indisponible.",
                )
                return PipelineResult(
                    success=False,
                    product_id=product.id,
                    status="quarantine",
                    reason=product.quarantine_reason,
                    steps=steps,
                )
        trend = trends[0]
        seed = PipelineSeed(
            keyword=trend.keyword or trend.title,
            title=trend.title,
            asin=trend.asin,
            ean=trend.ean,
            source_url=trend.url,
        )
        steps.append(f"trend_selected:{trend.title[:40]}")

    keyword = seed.keyword or seed.title or ""
    steps.append(f"seed:{keyword[:40]}")

    # 2. Supplier sniper
    steps.append("find_supplier")
    offer = await find_best_supplier(seed.ean or keyword)
    if offer is None:
        product = await _save_quarantine(
            session,
            seed,
            "Aucune offre fournisseur valide (rating < 0.95 ou livraison > 15j).",
        )
        return PipelineResult(
            success=False,
            product_id=product.id,
            status="quarantine",
            reason=product.quarantine_reason,
            steps=steps,
        )
    steps.append(f"supplier:{offer.supplier_name}@{offer.price:.2f}")

    # 3. Competitor check
    steps.append("competitor_check")
    market = await get_market_price(seed.ean or "", seed.asin or "", keyword=keyword)
    competitor_min = market.min_price
    steps.append(f"market_min:{competitor_min:.2f}")

    # 4. Pricing engine
    steps.append("pricing_engine")
    historical = await _historical_avg(session, keyword)
    if trend and trend.price:
        historical = historical or trend.price

    pricing = calculate_safe_price(
        supplier_cost=offer.price,
        shipping=offer.shipping_cost,
        competitor_min=competitor_min,
        historical_avg=historical,
        keyword=keyword,
    )

    if pricing["status"] == PricingStatus.QUARANTINE:
        product = await _save_quarantine(
            session,
            seed,
            pricing["reason"] or "Échec garde-fou prix",
            cost=offer.price,
            supplier_name=offer.supplier_name,
        )
        return PipelineResult(
            success=False,
            product_id=product.id,
            status="quarantine",
            reason=pricing["reason"],
            steps=steps,
        )

    sell_price = pricing["price"]
    margin_pct = pricing["margin_pct"]
    steps.append(f"approved_price:{sell_price}")

    # 5. Generate listing + image
    steps.append("generate_listing")
    draft = Product(
        sku=f"NXD-DRAFT-{uuid.uuid4().hex[:6]}",
        title=(seed.title or keyword)[:512],
        description="",
        cost_price=Decimal(str(offer.price)),
        sell_price=Decimal(str(sell_price)),
        category="auto-import",
        keyword=keyword,
        margin_calculated=margin_pct,
        shipping_cost=Decimal(str(offer.shipping_cost)),
        asin=seed.asin,
        ean=seed.ean,
        source_url=seed.source_url or offer.url,
    )
    listing_copy = await generate_listing(draft)
    image_path = await process_product_image(seed.source_url)
    image_urls = [image_path] if image_path else []

    # 6. Publish storefront
    steps.append("publish_storefront")
    product = await publish_to_storefront(
        session,
        {
            "title": listing_copy.seo_title,
            "description": listing_copy.description_html,
            "cost_price": offer.price,
            "sell_price": sell_price,
            "shipping_cost": offer.shipping_cost,
            "margin_calculated": margin_pct,
            "image_urls": image_urls,
            "asin": seed.asin,
            "ean": seed.ean,
            "source_url": seed.source_url or offer.url,
            "keyword": keyword,
            "velocity_score": trend.velocity_score if trend else None,
            "category": "auto-import",
            "stock": 50,
        },
    )
    product.status = "published"
    await session.flush()

    await _log_action(
        session,
        "published",
        "published",
        product_id=product.id,
        title=product.title,
        reason=f"Marge {margin_pct}% — {offer.supplier_name}",
    )
    steps.append(f"published:id={product.id}")

    return PipelineResult(
        success=True,
        product_id=product.id,
        status="published",
        steps=steps,
    )


async def revive_from_quarantine(session: AsyncSession, product_id: int) -> Product:
    """Remet un produit quarantaine en draft pour re-traitement manuel."""
    product = await session.get(Product, product_id)
    if product is None:
        raise ValueError("Produit introuvable")
    product.status = "draft"
    product.quarantine_reason = None
    await _log_action(session, "revive", "draft", product_id=product.id, title=product.title)
    return product
