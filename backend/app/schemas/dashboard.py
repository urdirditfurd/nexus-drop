"""KPIs tableau de bord."""

from decimal import Decimal

from pydantic import BaseModel


class DashboardKPIs(BaseModel):
    total_products: int
    active_listings: int
    pending_orders: int
    revenue_month: Decimal
    avg_margin_pct: float
    top_trend_keyword: str | None = None
