"""API Auto-Publish — toggle, cycle manuel, historique, quarantaine."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from app.deps import AdminDep, DbDep
from app.models.auto_publish_log import AutoPublishLog
from app.models.product import Product
from app.models.setting import Setting
from app.schemas.auto_publish import (
    AutoPublishRunRequest,
    AutoPublishRunResponse,
    AutoPublishSettings,
    AutoPublishSettingsUpdate,
    AutoPublishStatus,
    DryRunReport,
    DryRunRequest,
    QuarantineProductOut,
)
from app.services.auto_publish import revive_from_quarantine, run_full_automation_pipeline
from app.services.dry_run import run_dry_run_pipeline

router = APIRouter(prefix="/auto-publish", tags=["auto-publish"])

SETTINGS_KEYS = (
    "auto_publish_enabled",
    "auto_publish_daily_target",
    "auto_publish_published_today",
    "auto_publish_last_run",
)


async def _get_setting(session, key: str, default: str = "") -> str:
    row = await session.execute(select(Setting).where(Setting.key == key))
    setting = row.scalar_one_or_none()
    return setting.value if setting else default


async def _set_setting(session, key: str, value: str, description: str = "") -> None:
    row = await session.execute(select(Setting).where(Setting.key == key))
    setting = row.scalar_one_or_none()
    if setting is None:
        session.add(Setting(key=key, value=value, description=description))
    else:
        setting.value = value


@router.get("/status", response_model=AutoPublishStatus)
async def get_status(session: DbDep, _admin: AdminDep) -> AutoPublishStatus:
    """État auto-publish + compteurs."""
    enabled = (await _get_setting(session, "auto_publish_enabled", "false")).lower() == "true"
    target = int(await _get_setting(session, "auto_publish_daily_target", "200"))
    published_today = int(await _get_setting(session, "auto_publish_published_today", "0"))
    last_run = await _get_setting(session, "auto_publish_last_run", "")

    queue = (
        await session.execute(
            select(func.count()).select_from(Product).where(Product.status == "draft")
        )
    ).scalar() or 0

    quarantine_count = (
        await session.execute(
            select(func.count()).select_from(Product).where(Product.status == "quarantine")
        )
    ).scalar() or 0

    published_count = (
        await session.execute(
            select(func.count()).select_from(Product).where(
                Product.status.in_(["published", "active"])
            )
        )
    ).scalar() or 0

    return AutoPublishStatus(
        enabled=enabled,
        daily_target=target,
        published_today=published_today,
        queue_count=queue,
        quarantine_count=quarantine_count,
        published_total=published_count,
        last_run=last_run or None,
    )


@router.get("/settings", response_model=AutoPublishSettings)
async def get_settings(session: DbDep, _admin: AdminDep) -> AutoPublishSettings:
    return AutoPublishSettings(
        enabled=(await _get_setting(session, "auto_publish_enabled", "false")).lower() == "true",
        daily_target=int(await _get_setting(session, "auto_publish_daily_target", "200")),
    )


@router.post("/settings", response_model=AutoPublishSettings)
async def update_settings(
    body: AutoPublishSettingsUpdate,
    session: DbDep,
    _admin: AdminDep,
) -> AutoPublishSettings:
    if body.enabled is not None:
        await _set_setting(session, "auto_publish_enabled", str(body.enabled).lower(), "Auto-publish ON/OFF")
    if body.daily_target is not None:
        await _set_setting(session, "auto_publish_daily_target", str(body.daily_target), "Objectif publications/jour")
    await session.flush()
    return await get_settings(session, _admin)


@router.post("/run", response_model=AutoPublishRunResponse)
async def run_cycle(
    session: DbDep,
    _admin: AdminDep,
    body: AutoPublishRunRequest | None = None,
) -> AutoPublishRunResponse:
    """Lance un cycle pipeline (sync — sans Redis requis)."""
    seed = body.seed if body else None
    result = await run_full_automation_pipeline(session, seed)

    now = datetime.now(timezone.utc).isoformat()
    await _set_setting(session, "auto_publish_last_run", now)

    if result.success:
        pub_today = int(await _get_setting(session, "auto_publish_published_today", "0"))
        await _set_setting(session, "auto_publish_published_today", str(pub_today + 1))

    return AutoPublishRunResponse(
        success=result.success,
        product_id=result.product_id,
        status=result.status,
        reason=result.reason,
        steps=result.steps,
    )


@router.post("/dry-run", response_model=DryRunReport)
async def dry_run_pipeline(
    body: DryRunRequest,
    session: DbDep,
    _admin: AdminDep,
) -> DryRunReport:
    """
    Test à blanc — exécute le pipeline sans publier ni quarantaine en DB.
    Retourne un rapport détaillé par étape pour validation manuelle.
    """
    return await run_dry_run_pipeline(session, body)


@router.get("/history")
async def get_history(session: DbDep, _admin: AdminDep, limit: int = 50) -> list[dict]:
    rows = (
        await session.execute(
            select(AutoPublishLog).order_by(AutoPublishLog.created_at.desc()).limit(limit)
        )
    ).scalars().all()
    return [
        {
            "id": r.id,
            "action": r.action,
            "product_id": r.product_id,
            "title": r.title,
            "status": r.status,
            "reason": r.reason,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/quarantine", response_model=list[QuarantineProductOut])
async def list_quarantine(session: DbDep, _admin: AdminDep) -> list[QuarantineProductOut]:
    rows = (
        await session.execute(
            select(Product).where(Product.status == "quarantine").order_by(Product.created_at.desc())
        )
    ).scalars().all()
    return [
        QuarantineProductOut(
            id=p.id,
            sku=p.sku,
            title=p.title,
            cost_price=float(p.cost_price),
            quarantine_reason=p.quarantine_reason,
            keyword=p.keyword,
            created_at=p.created_at,
        )
        for p in rows
    ]


@router.post("/quarantine/{product_id}/revive")
async def revive_quarantine(
    product_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> dict:
    try:
        product = await revive_from_quarantine(session, product_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"id": product.id, "status": product.status}
