"""Garde-fou prix et marques VERO."""

from __future__ import annotations

from decimal import Decimal

# Marques protégées — publication interdite (politique VERO marketplaces)
VERO_BRANDS: frozenset[str] = frozenset(
    {
        "logitech",
        "nike",
        "apple",
        "adidas",
        "sony",
        "samsung",
        "disney",
        "gucci",
        "louis vuitton",
        "rolex",
        "microsoft",
        "dyson",
        "lego",
        "starbucks",
        "coca-cola",
        "pepsi",
        "amazon",
        "ebay",
    }
)

# Marge minimale : prix vente >= 92 % du coût (8 % marge brute min)
MIN_SELL_RATIO = Decimal("0.92")


class PriceGuardError(Exception):
    """Erreur de validation avant publication."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def normalize_brand(brand: str | None) -> str:
    """Normalise le nom de marque pour comparaison."""
    return (brand or "").strip().lower()


def is_vero_brand(brand: str | None) -> bool:
    """True si la marque est dans la liste VERO."""
    normalized = normalize_brand(brand)
    if not normalized:
        return False
    return normalized in VERO_BRANDS or any(v in normalized for v in VERO_BRANDS)


def validate_publish_prices(
    cost_price: Decimal,
    sell_price: Decimal,
    brand: str | None = None,
) -> None:
    """
    Refuse la publication si :
    - prix vente < 92 % du coût
    - marque dans la liste VERO
    """
    if is_vero_brand(brand):
        raise PriceGuardError(
            "vero_brand",
            f"Publication refusée : marque protégée VERO ({brand}).",
        )

    if cost_price > 0 and sell_price < cost_price * MIN_SELL_RATIO:
        min_price = (cost_price * MIN_SELL_RATIO).quantize(Decimal("0.01"))
        raise PriceGuardError(
            "margin_too_low",
            f"Prix de vente trop bas ({sell_price} €). Minimum requis : {min_price} € "
            f"(92 % du coût {cost_price} €).",
        )
