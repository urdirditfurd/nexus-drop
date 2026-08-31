"""
Competitor Check — Amazon autres vendeurs + eBay ventes terminées.
Playwright stealth pour résistance anti-bot.
"""

from __future__ import annotations

import logging
import re
from urllib.parse import quote_plus

from app.config import settings
from app.core.pipeline_types import MarketPrices
from scraper.browser import ScrapeResult, fetch_page_html
from scraper.price_estimator import estimate_market_prices

logger = logging.getLogger(__name__)

PRICE_EUR = re.compile(r"(\d+[.,]\d{2})\s*(?:€|EUR)", re.IGNORECASE)
ASIN_ATTR = re.compile(r'data-asin="([A-Z0-9]{10})"', re.IGNORECASE)
ASIN_URL = re.compile(r"/(?:dp|gp/product)/([A-Z0-9]{10})", re.IGNORECASE)


def _extract_asin_from_html(html: str) -> str | None:
    match = ASIN_ATTR.search(html)
    if match:
        return match.group(1).upper()
    url_match = ASIN_URL.search(html)
    return url_match.group(1).upper() if url_match else None


async def _extract_prices_from_url(url: str, source: str) -> tuple[list[float], ScrapeResult]:
    try:
        result = await fetch_page_html(url, source)
        if result.captcha_detected:
            logger.warning(
                "[%s] CAPTCHA détecté — prix concurrents indisponibles (proxy recommandé)",
                source,
            )
            return [], result
        if not result.success or not result.html:
            logger.warning("[%s] Prix concurrents indisponibles: %s", source, result.error)
            return [], result
        prices = [
            float(m.group(1).replace(",", "."))
            for m in PRICE_EUR.finditer(result.html)
            if 0.5 < float(m.group(1).replace(",", ".")) < 10000
        ]
        logger.info("[%s] %d prix extraits", source, len(prices))
        return prices[:20], result
    except Exception as exc:
        logger.error("[%s] Exception scrape prix: %s", source, exc)
        return [], ScrapeResult(success=False, error=str(exc), source=source)


async def _resolve_asin(asin: str, keyword: str) -> tuple[str | None, ScrapeResult | None]:
    if asin:
        return asin, None
    if not keyword:
        return None, None
    search_url = f"https://www.amazon.fr/s?k={quote_plus(keyword)}"
    try:
        result = await fetch_page_html(search_url, "amazon_asin_lookup")
        if result.captcha_detected:
            logger.warning("Recherche ASIN — CAPTCHA pour « %s »", keyword[:40])
            return None, result
        if result.html:
            resolved = _extract_asin_from_html(result.html)
            if resolved:
                logger.info("ASIN résolu depuis recherche: %s", resolved)
                return resolved, result
    except Exception as exc:
        logger.error("Résolution ASIN échouée: %s", exc)
    return None, None


async def _amazon_other_sellers(asin: str, keyword: str) -> tuple[list[float], ScrapeResult | None]:
    resolved_asin, lookup_result = await _resolve_asin(asin, keyword)
    if not resolved_asin:
        return [], lookup_result
    url = f"https://www.amazon.fr/gp/offer-listing/{resolved_asin}"
    prices, result = await _extract_prices_from_url(url, "amazon_offers")
    return prices, result


async def _ebay_sold_listings(keyword: str) -> tuple[list[float], ScrapeResult | None]:
    if not keyword:
        return [], None
    url = f"https://www.ebay.fr/sch/i.html?_nkw={keyword.replace(' ', '+')}&LH_Complete=1&LH_Sold=1"
    prices, result = await _extract_prices_from_url(url, "ebay_sold")
    return prices, result


def _dev_market_fallback(keyword: str) -> MarketPrices | None:
    if settings.effective_scraper_proxy:
        return None
    min_p, avg_p, max_p = estimate_market_prices(keyword)
    logger.warning(
        "Scrape concurrent vide — estimation dev pour « %s »: min=%.2f€ avg=%.2f€",
        keyword[:40],
        min_p,
        avg_p,
    )
    return MarketPrices(
        min_price=min_p,
        avg_price=avg_p,
        max_price=max_p,
        source="keyword_estimate_dev",
    )


async def get_market_price(
    ean: str,
    asin: str,
    *,
    keyword: str = "",
) -> MarketPrices:
    search_key = keyword or ean or asin or ""
    logger.info("Competitor check — ASIN=%s EAN=%s keyword=%s", asin, ean, search_key[:40])

    amazon_prices: list[float] = []
    ebay_prices: list[float] = []

    try:
        amazon_prices, amazon_result = await _amazon_other_sellers(asin, search_key)
        if amazon_result and not amazon_result.success:
            logger.warning("Amazon offers: %s", amazon_result.error)
    except Exception as exc:
        logger.error("Amazon competitor check isolé: %s", exc)

    try:
        ebay_prices, ebay_result = await _ebay_sold_listings(search_key)
        if ebay_result and not ebay_result.success:
            logger.warning("eBay sold: %s", ebay_result.error)
    except Exception as exc:
        logger.error("eBay competitor check isolé: %s", exc)

    all_prices = amazon_prices + ebay_prices

    if not all_prices:
        logger.warning("Aucun prix concurrent trouvé pour « %s »", search_key[:40])
        fallback = _dev_market_fallback(search_key) if search_key else None
        if fallback:
            return fallback
        return MarketPrices(min_price=0.0, avg_price=0.0, max_price=0.0, source="none")

    return MarketPrices(
        min_price=min(all_prices),
        avg_price=sum(all_prices) / len(all_prices),
        max_price=max(all_prices),
        source="amazon+ebay",
    )


async def get_market_price_detailed(
    ean: str,
    asin: str,
    *,
    keyword: str = "",
) -> tuple[MarketPrices, dict]:
    search_key = keyword or ean or asin or ""
    meta: dict = {"amazon": {}, "ebay": {}}

    amazon_prices, amazon_result = await _amazon_other_sellers(asin, search_key)
    if amazon_result:
        meta["amazon"] = {
            "success": amazon_result.success,
            "error": amazon_result.error,
            "captcha": amazon_result.captcha_detected,
            "prices_found": len(amazon_prices),
        }

    ebay_prices, ebay_result = await _ebay_sold_listings(search_key)
    if ebay_result:
        meta["ebay"] = {
            "success": ebay_result.success,
            "error": ebay_result.error,
            "captcha": ebay_result.captcha_detected,
            "prices_found": len(ebay_prices),
        }

    all_prices = amazon_prices + ebay_prices
    if not all_prices:
        fallback = _dev_market_fallback(search_key) if search_key else None
        if fallback:
            meta["dev_fallback"] = True
            return fallback, meta
        return MarketPrices(min_price=0.0, avg_price=0.0, max_price=0.0, source="none"), meta

    return MarketPrices(
        min_price=min(all_prices),
        avg_price=sum(all_prices) / len(all_prices),
        max_price=max(all_prices),
        source="amazon+ebay",
    ), meta
