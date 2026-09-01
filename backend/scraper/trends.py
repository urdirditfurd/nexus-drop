"""
Trend Scanner — Amazon.fr, Cdiscount, AliExpress FR.
Playwright stealth + proxy + retries (via scraper.browser).
"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.core.pipeline_types import TrendItem
from scraper.browser import ScrapeResult, fetch_page_html

logger = logging.getLogger(__name__)

AMAZON_MOVERS = "https://www.amazon.fr/gp/movers-and-shakers"
CDISCOUNT_TOP = "https://www.cdiscount.com/top-ventes/f-0.html"
ALIEXPRESS_FR = "https://fr.aliexpress.com/w/wholesale-trending.html"

ASIN_ATTR = re.compile(r'data-asin="([A-Z0-9]{10})"', re.IGNORECASE)
ASIN_URL = re.compile(r"/(?:dp|gp/product)/([A-Z0-9]{10})", re.IGNORECASE)
EAN_PATTERN = re.compile(r"\b(\d{13})\b")
PRICE_WHOLE = re.compile(
    r'class="a-price-whole"[^>]*>([\d\s]+)</span>.*?class="a-price-fraction"[^>]*>(\d{2})',
    re.IGNORECASE | re.DOTALL,
)
PRICE_EUR = re.compile(r"(\d+[.,]\d{2})\s*€")
TITLE_PATTERN = re.compile(
    r"<(?:h2|h3|a)[^>]*>([^<]{10,200})</(?:h2|h3|a)>",
    re.IGNORECASE,
)


def _velocity_score(review_count: int, rank: int | None) -> float:
    rank_factor = max(1, 100 - (rank or 50))
    return round(min(100.0, (review_count / 10) + rank_factor * 0.5), 2)


def _extract_asin(html: str) -> str | None:
    match = ASIN_ATTR.search(html)
    if match:
        return match.group(1).upper()
    url_match = ASIN_URL.search(html)
    return url_match.group(1).upper() if url_match else None


def _extract_ean(html: str) -> str | None:
    match = EAN_PATTERN.search(html)
    return match.group(1) if match else None


def _extract_prices(html: str, limit: int = 15) -> list[float]:
    prices: list[float] = []
    for whole, frac in PRICE_WHOLE.findall(html)[:limit]:
        try:
            value = float(whole.replace(" ", "").replace("\xa0", "") + "." + frac)
            if 0.5 < value < 10000:
                prices.append(value)
        except ValueError:
            continue
    if not prices:
        prices = [
            float(p.replace(",", "."))
            for p in PRICE_EUR.findall(html)[:limit]
            if 0.5 < float(p.replace(",", ".")) < 10000
        ]
    return prices


def _parse_trend_cards(html: str, source: str, url: str, limit: int = 15) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    asin = _extract_asin(html)
    ean = _extract_ean(html)
    titles = TITLE_PATTERN.findall(html)[:limit]
    prices = _extract_prices(html, limit)

    for i, title in enumerate(titles):
        title_clean = re.sub(r"\s+", " ", title).strip()
        if len(title_clean) < 8:
            continue
        items.append(
            {
                "title": title_clean[:512],
                "price": prices[i] if i < len(prices) else 0.0,
                "review_count": max(10, 200 - i * 12),
                "rank": i + 1,
                "source": source,
                "url": url,
                "asin": asin if i == 0 else None,
                "ean": ean if i == 0 else None,
            }
        )
    return items


async def _scrape_source(url: str, source: str) -> tuple[list[dict[str, Any]], ScrapeResult]:
    logger.info("[%s] Scrape URL: %s", source, url)
    try:
        result = await fetch_page_html(url, source)
        if result.captcha_detected:
            html_snippet = (result.html or "")[:200].replace("\n", " ")
            logger.error(
                "[%s] CAPTCHA détecté — URL=%s | html_preview=%r",
                source,
                url,
                html_snippet,
            )
            return [], result
        if not result.success or not result.html:
            html_snippet = (result.html or "")[:200].replace("\n", " ")
            logger.error(
                "[%s] Scrape échoué — URL=%s | error=%s | html_preview=%r",
                source,
                url,
                result.error,
                html_snippet,
            )
            return [], result
        html_snippet = result.html[:200].replace("\n", " ")
        logger.info("[%s] Scrape OK — %d octets | preview=%r", source, len(result.html), html_snippet)
        items = _parse_trend_cards(result.html, source, url)
        if items and items[0].get("asin"):
            logger.info("[%s] ASIN extrait: %s", source, items[0]["asin"])
        logger.info("[%s] %d tendances extraites", source, len(items))
        return items, result
    except Exception as exc:
        logger.error("[%s] Exception non gérée: %s", source, exc)
        return [], ScrapeResult(success=False, error=str(exc), source=source)


def _to_trend_items(raw: list[dict[str, Any]], default_price: float) -> list[TrendItem]:
    return [
        TrendItem(
            title=r["title"],
            asin=r.get("asin"),
            ean=r.get("ean"),
            price=r["price"] or default_price,
            review_count=r["review_count"],
            rank=r["rank"],
            source=r["source"],
            url=r["url"],
            velocity_score=_velocity_score(r["review_count"], r["rank"]),
            keyword=r["title"][:80],
        )
        for r in raw
    ]


async def scrape_amazon_movers() -> list[TrendItem]:
    try:
        raw, _ = await _scrape_source(AMAZON_MOVERS, "amazon_fr")
        return _to_trend_items(raw, 29.99)
    except Exception as exc:
        logger.error("scrape_amazon_movers crash évité: %s", exc)
        return []


async def scrape_cdiscount_top() -> list[TrendItem]:
    try:
        raw, _ = await _scrape_source(CDISCOUNT_TOP, "cdiscount")
        return _to_trend_items(raw, 19.99)
    except Exception as exc:
        logger.error("scrape_cdiscount_top crash évité: %s", exc)
        return []


async def scrape_aliexpress_fr() -> list[TrendItem]:
    try:
        raw, _ = await _scrape_source(ALIEXPRESS_FR, "aliexpress_fr")
        return _to_trend_items(raw, 9.99)
    except Exception as exc:
        logger.error("scrape_aliexpress_fr crash évité: %s", exc)
        return []


async def scrape_trends(limit: int = 20) -> list[TrendItem]:
    logger.info("Démarrage scan tendances FR (furtif, max %d)", limit)
    merged: list[TrendItem] = []

    for scraper in (scrape_amazon_movers, scrape_cdiscount_top, scrape_aliexpress_fr):
        try:
            batch = await scraper()
            merged.extend(batch)
        except Exception as exc:
            logger.error("Batch tendances en échec (isolé): %s", exc)

    merged.sort(key=lambda t: t.velocity_score, reverse=True)
    logger.info("%d tendances collectées au total", len(merged))
    return merged[:limit]


async def scrape_keyword_search(keyword: str) -> tuple[TrendItem | None, ScrapeResult]:
    from urllib.parse import quote_plus

    url = f"https://www.amazon.fr/s?k={quote_plus(keyword)}"
    try:
        raw, result = await _scrape_source(url, "amazon_search")
        if result.captcha_detected:
            logger.warning("Recherche « %s » — CAPTCHA Amazon, échec propre", keyword[:60])
            return None, result
        if not raw:
            return None, result
        items = _to_trend_items(raw[:1], 0.0)
        item = items[0] if items else None
        if item:
            item = item.model_copy(update={"keyword": keyword, "title": item.title or keyword})
        return item, result
    except Exception as exc:
        logger.error("scrape_keyword_search crash évité: %s", exc)
        return None, ScrapeResult(success=False, error=str(exc), source="amazon_search")
