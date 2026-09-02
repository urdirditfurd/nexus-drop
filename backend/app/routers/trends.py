"""CRUD tendances + scan live avec fallback réaliste."""

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import AdminDep, DbDep
from app.models.trend import Trend
from app.schemas.trend import TrendCreate, TrendOut, TrendScanResponse, TrendUpdate
from app.services.trend_sync import ensure_trends_seeded, sync_trends_from_scanner

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get("", response_model=list[TrendOut])
async def list_trends(session: DbDep, _admin: AdminDep) -> list[TrendOut]:
    """Liste les tendances scannées — auto-seed si base vide."""
    await ensure_trends_seeded(session, min_count=5)
    result = await session.execute(select(Trend).order_by(Trend.score.desc()))
    return [TrendOut.model_validate(t) for t in result.scalars().all()]


@router.get("/{trend_id}", response_model=TrendOut)
async def get_trend(trend_id: int, session: DbDep, _admin: AdminDep) -> TrendOut:
    """Détail d'une tendance."""
    trend = await session.get(Trend, trend_id)
    if trend is None:
        raise HTTPException(status_code=404, detail="Tendance introuvable.")
    return TrendOut.model_validate(trend)


@router.post("", response_model=TrendOut, status_code=status.HTTP_201_CREATED)
async def create_trend(
    body: TrendCreate,
    session: DbDep,
    _admin: AdminDep,
) -> TrendOut:
    """Crée une tendance manuellement."""
    trend = Trend(**body.model_dump())
    session.add(trend)
    await session.flush()
    await session.refresh(trend)
    return TrendOut.model_validate(trend)


@router.patch("/{trend_id}", response_model=TrendOut)
async def update_trend(
    trend_id: int,
    body: TrendUpdate,
    session: DbDep,
    _admin: AdminDep,
) -> TrendOut:
    """Met à jour une tendance."""
    trend = await session.get(Trend, trend_id)
    if trend is None:
        raise HTTPException(status_code=404, detail="Tendance introuvable.")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(trend, key, value)

    await session.flush()
    await session.refresh(trend)
    return TrendOut.model_validate(trend)


@router.delete("/{trend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trend(
    trend_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> None:
    """Supprime une tendance."""
    trend = await session.get(Trend, trend_id)
    if trend is None:
        raise HTTPException(status_code=404, detail="Tendance introuvable.")
    await session.delete(trend)


@router.post("/scan", response_model=TrendScanResponse)
async def scan_trends(session: DbDep, _admin: AdminDep) -> TrendScanResponse:
    """
    Déclenche un scan live (Playwright) avec fallback réaliste si CAPTCHA.
    Persiste les résultats en base.
    """
    created = await sync_trends_from_scanner(session, limit=10)
    if not created:
        raise HTTPException(
            status_code=503,
            detail="Scan tendances impossible — réessayez dans quelques minutes.",
        )
    return TrendScanResponse(
        scanned=len(created),
        trends=[TrendOut.model_validate(t) for t in created],
    )


@router.post("/bulk", response_model=TrendScanResponse)
async def bulk_trends(body: dict, session: DbDep, _admin: AdminDep) -> TrendScanResponse:
    """Import bulk de trends (admin uniquement)."""
    items = body.get("items") or body.get("trends") or []
    created: list[Trend] = []
    now = datetime.now(timezone.utc)
    for raw in items:
        try:
            trend = Trend(
                keyword=str(raw.get("keyword") or raw.get("title") or "trend")[:256],
                niche=str(raw.get("niche") or "general")[:128],
                platform=str(raw.get("platform") or "amazon")[:64],
                score=float(raw.get("score") or 50),
                search_volume=int(raw.get("search_volume") or 0),
                avg_price=Decimal(str(raw.get("avg_price") or raw.get("price") or "19.99")),
                competition=str(raw.get("competition") or "medium")[:32],
                scanned_at=now,
            )
            session.add(trend)
            created.append(trend)
        except Exception:
            continue
    await session.flush()
    for t in created:
        await session.refresh(t)
    return TrendScanResponse(
        scanned=len(created),
        trends=[TrendOut.model_validate(t) for t in created],
    )
