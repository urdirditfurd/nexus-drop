"""Migration légère SQLite — ajoute colonnes manquantes au démarrage."""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

logger = logging.getLogger(__name__)

PRODUCT_COLUMNS: list[tuple[str, str]] = [
    ("quarantine_reason", "TEXT"),
    ("margin_calculated", "REAL"),
    ("asin", "VARCHAR(32)"),
    ("ean", "VARCHAR(32)"),
    ("source_url", "TEXT"),
    ("keyword", "VARCHAR(255)"),
    ("velocity_score", "REAL"),
    ("shipping_cost", "REAL DEFAULT 0"),
]


async def ensure_product_columns(engine: AsyncEngine) -> None:
    """ALTER TABLE products si colonnes pipeline absentes (SQLite dev)."""
    if "sqlite" not in str(engine.url):
        return

    async with engine.begin() as conn:
        result = await conn.execute(text("PRAGMA table_info(products)"))
        existing = {row[1] for row in result.fetchall()}

        for name, col_type in PRODUCT_COLUMNS:
            if name not in existing:
                await conn.execute(
                    text(f"ALTER TABLE products ADD COLUMN {name} {col_type}")
                )
                logger.info("Migration: products.%s ajouté", name)
