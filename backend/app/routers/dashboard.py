"""KPIs tableau de bord admin."""

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter
from sqlalchemy import func, select

from app.deps import AdminDep, DbDep
from app.models.listing import Listing
from app.models.order import Order
from app.models.product import Product
from app.models.trend import Trend
from app.schemas.dashboard import DashboardKPIs

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=DashboardKPIs)
async def get_kpis(session: DbDep, _admin: AdminDep) -> DashboardKPIs:
    """Indicateurs clés pour le dashboard NEXUS-DROP."""
    total_products = (
        await session.execute(select(func.count()).select_from(Product))
    ).scalar() or 0

    active_listings = (
        await session.execute(
            select(func.count())
            .select_from(Listing)
            .where(Listing.status == "published")
        )
    ).scalar() or 0

    pending_orders = (
        await session.execute(
            select(func.count())
            .select_from(Order)
            .where(Order.status.in_(["pending", "paid"]))
        )
    ).scalar() or 0

    month_start = datetime.now(timezone.utc).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    revenue_month = (
        await session.execute(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.created_at >= month_start,
                Order.status.in_(["paid", "fulfilled", "shipped"]),
            )
        )
    ).scalar() or Decimal("0")

    # Marge moyenne sur produits actifs
    products = (
        await session.execute(
            select(Product).where(Product.cost_price > 0, Product.sell_price > 0)
        )
    ).scalars().all()

    margins: list[float] = []
    for p in products:
        margin = float((p.sell_price - p.cost_price) / p.sell_price * 100)
        margins.append(margin)
    avg_margin_pct = sum(margins) / len(margins) if margins else 0.0

    top_trend = (
        await session.execute(select(Trend).order_by(Trend.score.desc()).limit(1))
    ).scalar_one_or_none()

    return DashboardKPIs(
        total_products=total_products,
        active_listings=active_listings,
        pending_orders=pending_orders,
        revenue_month=Decimal(str(revenue_month)),
        avg_margin_pct=round(avg_margin_pct, 2),
        top_trend_keyword=top_trend.keyword if top_trend else None,
    )
