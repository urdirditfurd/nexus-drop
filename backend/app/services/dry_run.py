"""
Pipeline dry-run — test à blanc sans écriture DB ni publication.
"""

from __future__ import annotations

import logging
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.listing_generator import generate_listing, process_product_image
from app.core.pipeline_types import PipelineSeed, PricingStatus
from app.core.pricing_engine import calculate_safe_price
from app.models.product import Product
from app.models.trend import Trend
from app.schemas.auto_publish import (
    DryRunPricingStep,
    DryRunReport,
    DryRunRequest,
    DryRunStepResult,
)
from scraper.competitors import get_market_price_detailed
from scraper.sourcing import find_best_supplier
from scraper.trends import scrape_keyword_search

logger = logging.getLogger(__name__)


async def _historical_avg(session: AsyncSession, keyword: str) -> float | None:
    result = await session.execute(
        select(Trend.avg_price).where(Trend.keyword.ilike(f"%{keyword[:40]}%")).limit(5)
    )
    prices = [float(p) for p in result.scalars().all() if p is not None]
    if not prices:
        return None
    return sum(prices) / len(prices)


async def run_dry_run_pipeline(
    session: AsyncSession,
    payload: DryRunRequest,
) -> DryRunReport:
    """
    Exécute le pipeline une fois en mode lecture seule.
    Aucun produit publié, aucune quarantaine enregistrée.
    """
    keyword = payload.keyword.strip()
    ean = (payload.ean or "").strip()
    asin = (payload.asin or "").strip()
    title = payload.title or keyword

    logger.info("DRY-RUN démarré — keyword=%s ean=%s asin=%s", keyword, ean, asin)

    seed = PipelineSeed(
        keyword=keyword,
        title=title,
        ean=ean or None,
        asin=asin or None,
    )

    # Step 1 — Trend / recherche produit
    step_1 = DryRunStepResult(success=False, data={})
    trend_item = None
    try:
        trend_item, scrape_meta = await scrape_keyword_search(keyword)
        if trend_item:
            step_1 = DryRunStepResult(
                success=True,
                data={
                    "title": trend_item.title,
                    "price": trend_item.price,
                    "velocity_score": trend_item.velocity_score,
                    "source": trend_item.source,
                    "scrape": {
                        "success": scrape_meta.success,
                        "error": scrape_meta.error,
                        "captcha": scrape_meta.captcha_detected,
                        "attempt": scrape_meta.attempt,
                    },
                },
            )
            logger.info("DRY-RUN step_1 OK — %s", trend_item.title[:50])
        else:
            step_1 = DryRunStepResult(
                success=False,
                data={
                    "keyword": keyword,
                    "scrape": {
                        "success": scrape_meta.success,
                        "error": scrape_meta.error,
                        "captcha": scrape_meta.captcha_detected,
                    },
                },
                error=scrape_meta.error or "Aucun résultat trend pour ce mot-clé",
            )
            logger.warning("DRY-RUN step_1 échec: %s", step_1.error)
    except Exception as exc:
        step_1 = DryRunStepResult(success=False, data={"keyword": keyword}, error=str(exc))
        logger.error("DRY-RUN step_1 exception: %s", exc)

    historical_hint = float(trend_item.price) if trend_item and trend_item.price else None

    # Step 2 — Supplier
    step_2 = DryRunStepResult(success=False, data={})
    try:
        offer = await find_best_supplier(ean or keyword)
        if offer and not offer.rejected:
            step_2 = DryRunStepResult(
                success=True,
                data=offer.model_dump(),
            )
            logger.info("DRY-RUN step_2 OK — %s @ %.2f€", offer.supplier_name, offer.price)
        else:
            reason = offer.reject_reason if offer else "Aucune offre trouvée"
            step_2 = DryRunStepResult(
                success=False,
                data=offer.model_dump() if offer else {},
                error=reason,
            )
            logger.warning("DRY-RUN step_2 échec: %s", reason)
    except Exception as exc:
        step_2 = DryRunStepResult(success=False, data={}, error=str(exc))
        logger.error("DRY-RUN step_2 exception: %s", exc)

    # Step 3 — Competitor
    step_3 = DryRunStepResult(success=False, data={})
    market = None
    try:
        market, scrape_meta = await get_market_price_detailed(ean, asin, keyword=keyword)
        has_prices = market.min_price > 0
        step_3 = DryRunStepResult(
            success=has_prices,
            data={
                "min_price": market.min_price,
                "avg_price": market.avg_price,
                "max_price": market.max_price,
                "source": market.source,
                "scrape_meta": scrape_meta,
            },
            error=None if has_prices else "Aucun prix concurrent extrait",
        )
        if has_prices:
            logger.info("DRY-RUN step_3 OK — min=%.2f€", market.min_price)
        else:
            logger.warning("DRY-RUN step_3 — pas de prix concurrent")
    except Exception as exc:
        step_3 = DryRunStepResult(success=False, data={}, error=str(exc))
        logger.error("DRY-RUN step_3 exception: %s", exc)

    # Step 4 — Pricing (garde-fous inchangés)
    step_4 = DryRunPricingStep(
        status="QUARANTINE",
        reason="Données insuffisantes pour calculer le prix",
    )
    try:
        if step_2.success and step_2.data:
            supplier_cost = float(step_2.data.get("price", 0))
            shipping = float(step_2.data.get("shipping_cost", 0))
            competitor_min = market.min_price if market else 0.0
            historical = await _historical_avg(session, keyword)
            historical = historical or historical_hint

            pricing = calculate_safe_price(
                supplier_cost=supplier_cost,
                shipping=shipping,
                competitor_min=competitor_min,
                historical_avg=historical,
                keyword=keyword,
            )

            step_4 = DryRunPricingStep(
                status=pricing["status"],
                reason=pricing.get("reason"),
                calculated_price=pricing.get("price"),
                margin=pricing.get("margin_pct"),
                guard_failed=pricing.get("guard_failed"),
                min_selling_price=pricing.get("min_selling_price"),
                competitor_min=competitor_min,
                historical_avg=historical,
                pricing_engine_version=pricing.get("pricing_engine_version"),
            )
            logger.info(
                "DRY-RUN step_4 — %s (prix=%s, marge=%s)",
                step_4.status,
                step_4.calculated_price,
                step_4.margin,
            )
        else:
            step_4.reason = "Fournisseur indisponible — pricing non calculé"
    except Exception as exc:
        step_4.reason = f"Erreur pricing: {exc}"
        logger.error("DRY-RUN step_4 exception: %s", exc)

    # Step 5 — Listing preview (sans publication)
    step_5 = DryRunStepResult(success=False, data={})
    try:
        sell_price = step_4.calculated_price or 0.0
        cost = float(step_2.data.get("price", 0)) if step_2.success else 0.0
        draft = Product(
            sku="DRY-RUN",
            title=title[:512],
            description="",
            cost_price=Decimal(str(cost)),
            sell_price=Decimal(str(sell_price)),
            keyword=keyword,
            asin=asin or None,
            ean=ean or None,
        )
        listing = await generate_listing(draft)
        image_generated = False
        image_note = "Pas d'URL source pour l'image"

        if payload.source_url:
            image_path = await process_product_image(payload.source_url)
            image_generated = image_path is not None
            image_note = image_path or "Échec traitement image"
        elif trend_item and trend_item.url:
            image_path = await process_product_image(trend_item.url)
            image_generated = image_path is not None
            image_note = image_path or "Échec traitement image depuis URL trend"

        step_5 = DryRunStepResult(
            success=True,
            data={
                "seo_title": listing.seo_title,
                "description_preview": listing.description_html[:300],
                "source": listing.source,
                "image_generated": image_generated,
                "image_note": image_note,
                "would_publish": step_4.status == PricingStatus.APPROVED,
            },
        )
        logger.info("DRY-RUN step_5 OK — listing généré (publish=%s)", step_5.data.get("would_publish"))
    except Exception as exc:
        step_5 = DryRunStepResult(success=False, data={}, error=str(exc))
        logger.error("DRY-RUN step_5 exception: %s", exc)

    overall = (
        step_4.status == PricingStatus.APPROVED
        and step_2.success
        and step_5.success
    )

    return DryRunReport(
        dry_run=True,
        keyword=keyword,
        ean=ean or None,
        asin=asin or None,
        overall_would_publish=overall,
        step_1_trend=step_1,
        step_2_supplier=step_2,
        step_3_competitor=step_3,
        step_4_pricing=step_4,
        step_5_listing=step_5,
    )
