"""Tests moteur de prix anti-catastrophe."""

from app.core.pricing_engine import calculate_safe_price


def test_guard0_logitech_missing_competitor_data():
    """Dry-run Logitech : pas de prix concurrent → quarantaine immédiate."""
    result = calculate_safe_price(
        supplier_cost=2.69,
        shipping=2.99,
        competitor_min=0.0,
        historical_avg=None,
        keyword="logitech mx master 3",
    )
    assert result["status"] == "QUARANTINE"
    assert result["guard_failed"] == "missing_competitor_data_brand"
    assert "Données concurrentes manquantes pour un produit de marque" in result["reason"]


def test_guard0_brand_missing_historical_only():
    result = calculate_safe_price(
        supplier_cost=15.0,
        shipping=3.0,
        competitor_min=45.0,
        historical_avg=None,
        keyword="casque sony wh-1000",
    )
    assert result["status"] == "QUARANTINE"
    assert result["guard_failed"] == "missing_competitor_data_brand"


def test_guard1_parsing_electronics():
    result = calculate_safe_price(
        supplier_cost=3.0,
        shipping=2.0,
        competitor_min=50.0,
        historical_avg=40.0,
        keyword="montre connectée sport",
    )
    assert result["status"] == "QUARANTINE"
    assert result["guard_failed"] == "parsing"


def test_guard2_historical_drop():
    result = calculate_safe_price(
        supplier_cost=12.0,
        shipping=2.0,
        competitor_min=80.0,
        historical_avg=87.0,
        keyword="casque audio",
    )
    assert result["status"] == "QUARANTINE"
    assert result["guard_failed"] == "historical"
    assert "87" in result["reason"]


def test_guard4_not_competitive():
    result = calculate_safe_price(
        supplier_cost=40.0,
        shipping=5.0,
        competitor_min=45.0,
        historical_avg=50.0,
        keyword="organisateur bureau",
    )
    assert result["status"] == "QUARANTINE"
    assert result["guard_failed"] == "competitive"


def test_generic_product_missing_data_can_approve():
    """Produit générique sans données marché — warning seulement, peut approuver."""
    result = calculate_safe_price(
        supplier_cost=8.0,
        shipping=2.0,
        competitor_min=0.0,
        historical_avg=None,
        keyword="tapis de yoga premium",
    )
    assert result["status"] == "APPROVED"
    assert result["price"] is not None


def test_approved_price():
    result = calculate_safe_price(
        supplier_cost=10.0,
        shipping=3.0,
        competitor_min=35.0,
        historical_avg=15.0,
        keyword="support laptop",
    )
    assert result["status"] == "APPROVED"
    assert result["price"] is not None
    assert result["margin_pct"] is not None
    assert result["price"] <= 35.0 * 0.98 + 0.01
