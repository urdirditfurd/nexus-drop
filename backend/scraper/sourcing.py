"""
Supplier Sniper — AliExpress + CJ Dropshipping.
Rejet auto si seller_rating < 0.95 ou shipping_days > 15.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re

import httpx

from app.core.pipeline_types import SupplierOffer
from scraper.anti_ban import random_user_agent
from scraper.price_estimator import estimate_supplier_cost, is_scraped_price_suspicious

logger = logging.getLogger(__name__)

SCRAPE_TIMEOUT = 30.0
MIN_SELLER_RATING = 0.95
MAX_SHIPPING_DAYS = 15
CJ_API_KEY = os.getenv("CJ_DROPSHIPPING_API_KEY", "").strip()


def _reject(offer: SupplierOffer, reason: str) -> SupplierOffer:
    logger.warning("OFFRE REJETÉE (%s): %s", offer.supplier_name, reason)
    return offer.model_copy(update={"rejected": True, "reject_reason": reason})


def _simulated_cj_offer(keyword: str) -> SupplierOffer:
    cost = estimate_supplier_cost(keyword)
    logger.info(
        "CJ simulateur (sans clé API) — « %s » → coût estimé %.2f €",
        keyword[:60],
        cost,
    )
    return SupplierOffer(
        supplier_name="CJ Dropshipping (simulé)",
        price=cost,
        shipping_cost=3.50,
        shipping_days=10,
        seller_rating=0.97,
        url=f"https://cjdropshipping.com/search?q={keyword.replace(' ', '+')}",
    )


async def _search_aliexpress(keyword: str) -> SupplierOffer | None:
    url = f"https://www.aliexpress.com/wholesale?SearchText={keyword.replace(' ', '+')}"
    headers = {"User-Agent": random_user_agent(), "Accept-Language": "fr-FR,fr;q=0.9"}
    try:
        async with httpx.AsyncClient(timeout=SCRAPE_TIMEOUT, headers=headers, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.warning("AliExpress HTTP %d — fallback simulateur", response.status_code)
                return _simulated_cj_offer(keyword)
            text = response.text
            price_match = re.search(r"(\d+[.,]\d{2})\s*€", text)
            if not price_match:
                logger.warning("AliExpress — aucun prix trouvé, fallback simulateur")
                return _simulated_cj_offer(keyword)
            price = float(price_match.group(1).replace(",", "."))
            if is_scraped_price_suspicious(keyword, price):
                logger.warning(
                    "AliExpress — prix scrape suspect %.2f € pour « %s », simulateur utilisé",
                    price,
                    keyword[:40],
                )
                return _simulated_cj_offer(keyword)
            rating_match = re.search(r"(\d\.\d)\s*%?\s*positive", text, re.I)
            rating = (
                float(rating_match.group(1)) / 100
                if rating_match and float(rating_match.group(1)) > 1
                else 0.96
            )
            return SupplierOffer(
                supplier_name="AliExpress",
                price=price,
                shipping_cost=2.99,
                shipping_days=12,
                seller_rating=min(1.0, rating),
                url=url,
            )
    except Exception as exc:
        logger.error("AliExpress search failed: %s — fallback simulateur", exc)
        return _simulated_cj_offer(keyword)


async def _search_cj_dropshipping(keyword: str) -> SupplierOffer | None:
    if CJ_API_KEY:
        logger.info("CJ Dropshipping API — recherche: %s", keyword[:60])
        try:
            async with httpx.AsyncClient(timeout=SCRAPE_TIMEOUT) as client:
                response = await client.get(
                    "https://developers.cjdropshipping.com/api2.0/v1/product/list",
                    params={"productNameEn": keyword},
                    headers={"CJ-Access-Token": CJ_API_KEY},
                )
                if response.status_code == 200:
                    data = response.json()
                    products = data.get("data", {}).get("list") or []
                    if products:
                        p = products[0]
                        return SupplierOffer(
                            supplier_name="CJ Dropshipping",
                            price=float(p.get("sellPrice", estimate_supplier_cost(keyword))),
                            shipping_cost=3.50,
                            shipping_days=10,
                            seller_rating=0.97,
                            url=p.get("productUrl", "https://cjdropshipping.com"),
                        )
        except Exception as exc:
            logger.error("CJ API error: %s — fallback simulateur", exc)
    return _simulated_cj_offer(keyword)


async def find_best_supplier(ean_or_keyword: str) -> SupplierOffer | None:
    keyword = ean_or_keyword.strip()
    if not keyword:
        return None

    logger.info("Sourcing fournisseur: %s", keyword[:80])
    offers = await asyncio.gather(
        _search_aliexpress(keyword),
        _search_cj_dropshipping(keyword),
        return_exceptions=True,
    )

    valid: list[SupplierOffer] = []
    for raw in offers:
        if isinstance(raw, Exception):
            logger.error("Erreur sourcing isolée: %s", raw)
            continue
        if not isinstance(raw, SupplierOffer):
            continue
        offer = raw
        if offer.seller_rating < MIN_SELLER_RATING:
            offer = _reject(offer, f"seller_rating {offer.seller_rating} < {MIN_SELLER_RATING}")
        elif offer.shipping_days > MAX_SHIPPING_DAYS:
            offer = _reject(offer, f"shipping_days {offer.shipping_days} > {MAX_SHIPPING_DAYS}")
        if not offer.rejected:
            valid.append(offer)

    if not valid:
        logger.warning("Aucune offre fournisseur valide pour « %s »", keyword[:60])
        return None

    best = min(valid, key=lambda o: o.price + o.shipping_cost)
    logger.info(
        "Meilleure offre: %s — %.2f € + %.2f € livraison (%d j)",
        best.supplier_name,
        best.price,
        best.shipping_cost,
        best.shipping_days,
    )
    return best
