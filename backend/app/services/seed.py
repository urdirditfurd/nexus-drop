"""Données de démo au démarrage."""

from __future__ import annotations

import json
import logging
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import AdminUser, Product, Setting, Supplier, Trend
from app.services.auth import hash_password

logger = logging.getLogger(__name__)

# Images placeholder Unsplash
DEMO_IMAGES = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    "https://images.unsplash.com/photo-1572635196233-14b40f7fdc98?w=800",
]

DEMO_TRENDS = [
    {
        "keyword": "montre connectée fitness",
        "niche": "tech-wearable",
        "platform": "ebay",
        "score": 87.5,
        "search_volume": 12400,
        "avg_price": Decimal("49.99"),
        "competition": "medium",
    },
    {
        "keyword": "organisateur bureau minimaliste",
        "niche": "home-office",
        "platform": "etsy",
        "score": 72.0,
        "search_volume": 8300,
        "avg_price": Decimal("29.50"),
        "competition": "low",
    },
    {
        "keyword": "lampe LED ambiance",
        "niche": "decoration",
        "platform": "ebay",
        "score": 65.3,
        "search_volume": 5600,
        "avg_price": Decimal("34.00"),
        "competition": "high",
    },
]


async def seed_database(session: AsyncSession) -> None:
    """Insère admin, fournisseur, produits et tendances si base vide."""
    # Admin depuis env
    admin_result = await session.execute(
        select(AdminUser).where(AdminUser.email == settings.admin_email)
    )
    if admin_result.scalar_one_or_none() is None:
        session.add(
            AdminUser(
                email=settings.admin_email,
                hashed_password=hash_password(settings.admin_password),
                full_name="Administrateur NEXUS-DROP",
                is_active=True,
            )
        )
        logger.info("Admin créé : %s", settings.admin_email)

    # Fournisseur démo
    supplier_result = await session.execute(select(func.count()).select_from(Supplier))
    if (supplier_result.scalar() or 0) == 0:
        supplier = Supplier(
            name="AliExpress Premium Sourcing",
            platform="aliexpress",
            contact_email="sourcing@nexus-drop.local",
            rating=4.6,
            notes="Fournisseur démo pour tests NEXUS-DROP.",
            is_active=True,
        )
        session.add(supplier)
        await session.flush()

        product = Product(
            sku="NXD-DEMO-001",
            title="Montre Connectée Sport Pro — Suivi santé & notifications",
            description=(
                "Montre intelligente avec capteur cardiaque, GPS, étanchéité IP68. "
                "Autonomie 7 jours, compatible iOS et Android."
            ),
            brand="NexusFit",
            category="tech-wearable",
            cost_price=Decimal("18.50"),
            sell_price=Decimal("49.99"),
            currency="EUR",
            stock=150,
            image_urls=json.dumps(DEMO_IMAGES),
            supplier_id=supplier.id,
            status="active",
        )
        session.add(product)

        product2 = Product(
            sku="NXD-DEMO-002",
            title="Casque Bluetooth ANC — Réduction de bruit active",
            description="Casque over-ear avec 40h d'autonomie et micro intégré.",
            brand="SoundWave",
            category="audio",
            cost_price=Decimal("22.00"),
            sell_price=Decimal("59.99"),
            currency="EUR",
            stock=80,
            image_urls=json.dumps(DEMO_IMAGES[1:]),
            supplier_id=supplier.id,
            status="active",
        )
        session.add(product2)
        logger.info("Produits démo créés avec images Unsplash.")

    # Tendances démo
    trend_result = await session.execute(select(func.count()).select_from(Trend))
    if (trend_result.scalar() or 0) == 0:
        for t in DEMO_TRENDS:
            session.add(Trend(**t))
        logger.info("%d tendances démo insérées.", len(DEMO_TRENDS))

    # Paramètres par défaut
    defaults = [
        ("min_margin_ratio", "0.92", "Ratio prix vente / coût minimum"),
        ("default_marketplace", "ebay", "Marketplace par défaut"),
        ("store_name", "NEXUS-DROP", "Nom de la boutique"),
    ]
    for key, value, desc in defaults:
        existing = await session.execute(select(Setting).where(Setting.key == key))
        if existing.scalar_one_or_none() is None:
            session.add(Setting(key=key, value=value, description=desc))

    await session.commit()
