"""Types Pydantic pour le pipeline d'automatisation NEXUS-DROP."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class PricingStatus(str, Enum):
    APPROVED = "APPROVED"
    QUARANTINE = "QUARANTINE"


class TrendItem(BaseModel):
    title: str
    asin: str | None = None
    ean: str | None = None
    price: float = Field(ge=0)
    review_count: int = Field(ge=0, default=0)
    rank: int | None = None
    source: str
    url: str | None = None
    velocity_score: float = Field(ge=0, default=0.0)
    keyword: str | None = None


class SupplierOffer(BaseModel):
    supplier_name: str
    price: float = Field(ge=0)
    shipping_cost: float = Field(ge=0, default=0.0)
    shipping_days: int = Field(ge=0, default=7)
    seller_rating: float = Field(ge=0, le=1.0, default=0.95)
    url: str | None = None
    rejected: bool = False
    reject_reason: str | None = None


class MarketPrices(BaseModel):
    min_price: float = Field(ge=0, default=0.0)
    avg_price: float = Field(ge=0, default=0.0)
    max_price: float = Field(ge=0, default=0.0)
    source: str = "unknown"


class PricingResult(BaseModel):
    status: Literal["APPROVED", "QUARANTINE"]
    reason: str | None = None
    price: float | None = None
    margin_pct: float | None = None
    min_selling_price: float | None = None
    competitor_min: float | None = None
    guard_failed: str | None = None


class ListingCopy(BaseModel):
    seo_title: str
    description_html: str
    bullets: list[str] = Field(default_factory=list)
    source: str = "fallback"


class PipelineSeed(BaseModel):
    keyword: str | None = None
    title: str | None = None
    asin: str | None = None
    ean: str | None = None
    source_url: str | None = None


class PipelineResult(BaseModel):
    success: bool
    product_id: int | None = None
    status: str
    reason: str | None = None
    steps: list[str] = Field(default_factory=list)


class AutoPublishLogEntry(BaseModel):
    id: int
    action: str
    product_id: int | None = None
    title: str | None = None
    status: str
    reason: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
