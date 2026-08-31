"""Schémas tendances."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class TrendBase(BaseModel):
    keyword: str = Field(max_length=255)
    niche: str | None = None
    platform: str | None = None
    score: float = 0.0
    search_volume: int | None = None
    avg_price: Decimal | None = None
    competition: str | None = None
    metadata_json: str | None = None


class TrendCreate(TrendBase):
    pass


class TrendUpdate(BaseModel):
    keyword: str | None = None
    niche: str | None = None
    platform: str | None = None
    score: float | None = None
    search_volume: int | None = None
    avg_price: Decimal | None = None
    competition: str | None = None
    metadata_json: str | None = None


class TrendOut(TrendBase):
    id: int
    scanned_at: datetime

    model_config = {"from_attributes": True}


class TrendScanResponse(BaseModel):
    """Réponse du scan démo de tendances."""

    scanned: int
    trends: list[TrendOut]
