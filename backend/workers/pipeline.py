"""
Worker Celery — pipeline auto-publish NEXUS-DROP.
"""

from __future__ import annotations

import asyncio
import logging
import os

from celery import Celery
from sqlalchemy import select

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
BROKER = os.getenv("CELERY_BROKER_URL", REDIS_URL)

app = Celery("nexus_drop_pipeline", broker=BROKER, backend=BROKER)
app.conf.task_soft_time_limit = 120
app.conf.task_time_limit = 180

MAX_PRODUCTS_PER_RUN = int(os.getenv("AUTO_PUBLISH_MAX_PRODUCTS", "10"))


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _get_setting(session, key: str, default: str = "") -> str:
    from app.models.setting import Setting

    row = await session.execute(select(Setting).where(Setting.key == key))
    setting = row.scalar_one_or_none()
    return setting.value if setting else default


async def _set_setting(session, key: str, value: str, description: str = "") -> None:
    from app.models.setting import Setting

    row = await session.execute(select(Setting).where(Setting.key == key))
    setting = row.scalar_one_or_none()
    if setting is None:
        session.add(Setting(key=key, value=value, description=description))
    else:
        setting.value = value


async def _is_auto_publish_enabled(session) -> bool:
    return (await _get_setting(session, "auto_publish_enabled", "false")).lower() == "true"


@app.task(name="pipeline.run_full_automation_pipeline", bind=True)
def run_full_automation_pipeline_task(self, product_seed: dict | None = None) -> dict:
    from app.database import AsyncSessionLocal
    from app.services.auto_publish import run_full_automation_pipeline

    async def _inner() -> dict:
        async with AsyncSessionLocal() as session:
            try:
                result = await run_full_automation_pipeline(session, product_seed)
                await session.commit()
                if result.success:
                    logger.info(
                        "✅ Produit publié et commité en DB avec succès id=%s",
                        result.product_id,
                    )
                else:
                    logger.warning(
                        "Pipeline terminé en quarantaine id=%s — %s",
                        result.product_id,
                        result.reason,
                    )
                return result.model_dump()
            except Exception as exc:
                await session.rollback()
                logger.error("Pipeline Celery échec critique: %s", exc, exc_info=True)
                return {
                    "success": False,
                    "product_id": None,
                    "status": "error",
                    "reason": str(exc),
                    "steps": ["celery_error"],
                }

    logger.info("Celery pipeline démarré task_id=%s", self.request.id)
    return _run_async(_inner())


@app.task(name="pipeline.run_scheduled_batch", bind=True)
def run_scheduled_batch(self, max_products: int | None = None) -> dict:
    from app.database import AsyncSessionLocal
    from app.services.auto_publish import run_full_automation_pipeline

    limit = max_products or MAX_PRODUCTS_PER_RUN

    async def _inner() -> dict:
        async with AsyncSessionLocal() as session:
            if not await _is_auto_publish_enabled(session):
                logger.info("Auto-publish désactivé (toggle OFF) — batch ignoré")
                return {
                    "skipped": True,
                    "reason": "auto_publish_enabled=false",
                    "processed": 0,
                    "results": [],
                }

            daily_target = int(await _get_setting(session, "auto_publish_daily_target", "200"))
            pub_today = int(await _get_setting(session, "auto_publish_published_today", "0"))
            remaining = daily_target - pub_today
            if remaining <= 0:
                logger.info("Quota journalier atteint (%d/%d) — batch ignoré", pub_today, daily_target)
                return {
                    "skipped": True,
                    "reason": "daily_target_reached",
                    "processed": 0,
                    "results": [],
                }

            batch_limit = min(limit, remaining)
            logger.info("Batch planifié — max %d produits (quota restant: %d)", batch_limit, remaining)
            out: list[dict] = []

            for i in range(batch_limit):
                logger.info("Scheduled batch — produit %d/%d", i + 1, batch_limit)
                try:
                    result = await run_full_automation_pipeline(session, None)
                    await session.commit()
                    out.append(result.model_dump())
                    if result.success:
                        pub_today += 1
                        await _set_setting(
                            session,
                            "auto_publish_published_today",
                            str(pub_today),
                            "Publications aujourd'hui",
                        )
                        await session.commit()
                        logger.info("✅ Produit publié et commité en DB avec succès id=%s", result.product_id)
                    else:
                        logger.warning("Batch arrêté à %d — quarantaine/échec", i + 1)
                        break
                except Exception as exc:
                    await session.rollback()
                    logger.error("Erreur batch produit %d: %s", i + 1, exc, exc_info=True)
                    out.append({"success": False, "status": "error", "reason": str(exc), "steps": []})
                    break

            from datetime import datetime, timezone

            await _set_setting(
                session,
                "auto_publish_last_run",
                datetime.now(timezone.utc).isoformat(),
                "Dernière exécution auto-publish",
            )
            await session.commit()
            return {"task_id": self.request.id, "processed": len(out), "results": out}

    logger.info("Celery scheduled batch démarré — max %d produits", limit)
    return _run_async(_inner())
