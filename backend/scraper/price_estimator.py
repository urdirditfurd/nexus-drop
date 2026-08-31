"""
Estimation réaliste de prix fournisseur / marché selon le mot-clé.
Utilisé en dev sans proxy ni clé API — pas de valeurs hardcodées absurdes.
"""

from __future__ import annotations

import hashlib
import re

# (regex catégorie, coût min-max €, marché min-max €)
CATEGORY_RULES: list[tuple[re.Pattern[str], tuple[float, float], tuple[float, float]]] = [
    (re.compile(r"yoga|tapis|fitness|sport", re.I), (12.0, 22.0), (28.0, 45.0)),
    (re.compile(r"organisateur|bureau|rangement", re.I), (8.0, 18.0), (22.0, 38.0)),
    (re.compile(r"casque|écouteur|ecouteur|audio", re.I), (18.0, 35.0), (45.0, 120.0)),
    (re.compile(r"logitech|souris|mx master|clavier", re.I), (35.0, 55.0), (65.0, 110.0)),
    (re.compile(r"montre|smartwatch|connectée", re.I), (15.0, 35.0), (40.0, 90.0)),
    (re.compile(r"lampe|led|déco|deco", re.I), (6.0, 15.0), (18.0, 35.0)),
    (re.compile(r"cuisine|ustensile|robot", re.I), (10.0, 25.0), (30.0, 60.0)),
]

DEFAULT_COST = (10.0, 20.0)
DEFAULT_MARKET = (25.0, 45.0)


def _stable_float(keyword: str, salt: str, lo: float, hi: float) -> float:
    digest = hashlib.md5(f"{keyword.strip().lower()}:{salt}".encode()).hexdigest()
    ratio = int(digest[:8], 16) / 0xFFFFFFFF
    return round(lo + ratio * (hi - lo), 2)


def _match_category(keyword: str) -> tuple[tuple[float, float], tuple[float, float]]:
    for pattern, cost_range, market_range in CATEGORY_RULES:
        if pattern.search(keyword):
            return cost_range, market_range
    return DEFAULT_COST, DEFAULT_MARKET


def estimate_supplier_cost(keyword: str) -> float:
    """Prix fournisseur réaliste pour tests sans API."""
    cost_range, _ = _match_category(keyword)
    return _stable_float(keyword, "supplier", cost_range[0], cost_range[1])


def estimate_market_prices(keyword: str) -> tuple[float, float, float]:
    """min, avg, max marché estimés pour produits génériques sans scrape."""
    _, market_range = _match_category(keyword)
    lo, hi = market_range
    min_p = _stable_float(keyword, "market_min", lo, lo + (hi - lo) * 0.35)
    max_p = _stable_float(keyword, "market_max", lo + (hi - lo) * 0.65, hi)
    avg_p = round((min_p + max_p) / 2, 2)
    return min_p, avg_p, max_p


def is_scraped_price_suspicious(keyword: str, price: float) -> bool:
    """Détecte un prix scrape manifestement aberrant (ex. 2.69 € pour Logitech)."""
    cost_range, _ = _match_category(keyword)
    floor = cost_range[0] * 0.35
    return price < floor
