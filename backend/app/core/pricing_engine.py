"""
Moteur de prix anti-catastrophe NEXUS-DROP.
5 garde-fous séquentiels — toute anomalie → QUARANTINE.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from app.core.pipeline_types import PricingResult, PricingStatus

logger = logging.getLogger(__name__)

ELECTRONICS_KEYWORDS = re.compile(
    r"électronique|electronique|montre|smartwatch|watch|phone|tablette|laptop",
    re.IGNORECASE,
)

PRICING_ENGINE_VERSION = "2026-08-31-guard0"

BRAND_KEYWORDS = [
    "logitech",
    "samsung",
    "apple",
    "sony",
    "casque",
    "montre",
    "électronique",
    "electronique",
    "souris",
    "laptop",
    "mx master",
]

FEE_RATE = 0.20
NET_MARGIN_DIVISOR = 0.95  # 5 % marge nette minimum
HISTORICAL_DROP_THRESHOLD = 0.60  # coût < 60 % de la moyenne historique → rejet
UNDERcut_FACTOR = 0.98
PARSING_SUSPICION_COST = 5.0


def calculate_safe_price(
    supplier_cost: float,
    shipping: float,
    competitor_min: float,
    historical_avg: float | None = None,
    *,
    keyword: str = "",
) -> dict[str, Any]:
    """
    Calcule un prix de vente sûr ou renvoie un statut QUARANTINE.

    Garde-fous appliqués séquentiellement :
    0. Données manquantes — concurrent/historique absent sur produit de marque
    1. Parsing — coût suspect sur produits électroniques
    2. Historique — écart > 40 % vs moyenne historique
    3. Marge — prix minimum pour 5 % net
    4. Compétitivité — impossible d'être moins cher avec la marge requise
    """
    # GARDE-FOU 0 : Vérification des données manquantes pour les marques/électronique
    keyword_lower = keyword.lower()
    is_brand = any(brand_kw in keyword_lower for brand_kw in BRAND_KEYWORDS)

    if (competitor_min == 0.0 or historical_avg is None) and is_brand:
        result = PricingResult(
            status=PricingStatus.QUARANTINE,
            reason=(
                "Données concurrentes manquantes pour un produit de marque. "
                "Risque de prix aberrant."
            ),
            guard_failed="missing_competitor_data_brand",
            competitor_min=competitor_min,
        )
        logger.warning("QUARANTINE: %s", result.reason)
        payload = result.model_dump()
        payload["pricing_engine_version"] = PRICING_ENGINE_VERSION
        return payload

    if competitor_min == 0.0 or historical_avg is None:
        logger.warning(
            "WARNING: Données marché incomplètes (competitor_min=%.2f, historical_avg=%s) "
            "pour produit générique « %s » — poursuite des garde-fous.",
            competitor_min,
            historical_avg,
            keyword[:60],
        )

    result = _run_guards(
        supplier_cost=supplier_cost,
        shipping=shipping,
        competitor_min=competitor_min,
        historical_avg=historical_avg,
        keyword=keyword,
    )
    payload = result.model_dump()
    payload["pricing_engine_version"] = PRICING_ENGINE_VERSION
    if result.status == PricingStatus.QUARANTINE:
        logger.warning("QUARANTINE: %s", result.reason)
    else:
        logger.info(
            "PRIX APPROUVÉ: %.2f € (marge %.2f %%) — coût %.2f + livraison %.2f",
            result.price,
            result.margin_pct,
            supplier_cost,
            shipping,
        )
    return payload


def _run_guards(
    supplier_cost: float,
    shipping: float,
    competitor_min: float,
    historical_avg: float | None,
    keyword: str,
) -> PricingResult:
    # Garde-fou 1 — Parsing
    if supplier_cost < PARSING_SUSPICION_COST and ELECTRONICS_KEYWORDS.search(keyword):
        reason = (
            f"Prix fournisseur {supplier_cost:.2f} € suspect pour « {keyword} » "
            f"(seuil parsing {PARSING_SUSPICION_COST} € — erreur % vs € probable)."
        )
        return PricingResult(
            status=PricingStatus.QUARANTINE,
            reason=reason,
            guard_failed="parsing",
            competitor_min=competitor_min or None,
        )

    # Garde-fou 2 — Historique
    if historical_avg is not None and historical_avg > 0:
        threshold = historical_avg * HISTORICAL_DROP_THRESHOLD
        if supplier_cost < threshold:
            drop_pct = (1 - supplier_cost / historical_avg) * 100
            reason = (
                f"Prix fournisseur {supplier_cost:.2f} € détecté, "
                f"mais moyenne historique {historical_avg:.2f} €. "
                f"Écart > 40 % ({drop_pct:.1f} %)."
            )
            return PricingResult(
                status=PricingStatus.QUARANTINE,
                reason=reason,
                guard_failed="historical",
                competitor_min=competitor_min or None,
            )

    # Garde-fou 3 — Marge nette 5 % minimum
    base = supplier_cost + shipping
    fees = base * FEE_RATE
    min_selling_price = (base + fees) / NET_MARGIN_DIVISOR

    # Garde-fou 4 — Compétitivité vs marché
    if competitor_min > 0:
        competitive_ceiling = competitor_min * UNDERcut_FACTOR
        # RÈGLE STRICTE NEXUS-DROP : Si on ne peut pas battre le prix concurrent TOUT
        # en gardant une marge nette >= 5%, on ne publie PAS. Le produit part en quarantaine.
        if min_selling_price > competitor_min:
            return PricingResult(
                status=PricingStatus.QUARANTINE,
                reason="Marge < 5% ou prix non compétitif",
                guard_failed="competitive",
                min_selling_price=round(min_selling_price, 2),
                competitor_min=competitor_min,
            )
        target_price = min(min_selling_price, competitive_ceiling)
        if target_price > competitor_min:
            return PricingResult(
                status=PricingStatus.QUARANTINE,
                reason="Marge < 5% ou prix non compétitif",
                guard_failed="competitive",
                min_selling_price=round(min_selling_price, 2),
                competitor_min=competitor_min,
            )
    else:
        target_price = min_selling_price

    margin_pct = ((target_price - base - fees) / target_price) * 100 if target_price > 0 else 0.0

    return PricingResult(
        status=PricingStatus.APPROVED,
        price=round(target_price, 2),
        margin_pct=round(margin_pct, 2),
        min_selling_price=round(min_selling_price, 2),
        competitor_min=competitor_min or None,
    )
