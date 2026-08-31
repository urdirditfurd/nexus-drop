"""Seed minimal — admin + paramètres uniquement (mode réel, sans démo)."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import AdminUser, Setting
from app.services.auth import hash_password

logger = logging.getLogger(__name__)


async def seed_database(session: AsyncSession) -> None:
    """Insère l'admin et les paramètres par défaut si absents."""
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

    defaults = [
        ("min_margin_ratio", "0.95", "Ratio marge nette minimum (5 %)"),
        ("default_marketplace", "storefront", "Canal de publication par défaut"),
        ("store_name", "NEXUS-DROP", "Nom de la boutique"),
        ("auto_publish_enabled", "false", "Auto-publish activé"),
        ("auto_publish_daily_target", "200", "Objectif publications/jour"),
        ("auto_publish_published_today", "0", "Publications aujourd'hui"),
        ("auto_publish_last_run", "", "Dernière exécution pipeline"),
    ]
    for key, value, desc in defaults:
        existing = await session.execute(select(Setting).where(Setting.key == key))
        if existing.scalar_one_or_none() is None:
            session.add(Setting(key=key, value=value, description=desc))

    await session.commit()
    logger.info("Seed minimal terminé (mode réel — pas de produits démo).")
