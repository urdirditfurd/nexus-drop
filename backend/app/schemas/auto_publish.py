"""Schémas API auto-publish."""

from datetime import datetime

from pydantic import BaseModel, Field


class AutoPublishSettings(BaseModel):
    enabled: bool = False
    daily_target: int = Field(default=200, ge=1, le=500)


class AutoPublishSettingsUpdate(BaseModel):
    enabled: bool | None = None
    daily_target: int | None = Field(default=None, ge=1, le=500)


class AutoPublishStatus(BaseModel):
    enabled: bool
    daily_target: int
    published_today: int
    queue_count: int
    quarantine_count: int
    published_total: int
    last_run: str | None = None


class AutoPublishRunResponse(BaseModel):
    success: bool
    product_id: int | None = None
    status: str
    reason: str | None = None
    steps: list[str] = Field(default_factory=list)


class AutoPublishRunRequest(BaseModel):
    seed: dict | None = None


class QuarantineProductOut(BaseModel):
    id: int
    sku: str
    title: str
    cost_price: float
    quarantine_reason: str | None
    keyword: str | None
    created_at: datetime


class DryRunRequest(BaseModel):
    keyword: str = Field(min_length=2, max_length=255)
    ean: str | None = Field(default=None, max_length=32)
    asin: str | None = Field(default=None, max_length=32)
    title: str | None = None
    source_url: str | None = None


class DryRunStepResult(BaseModel):
    success: bool
    data: dict = Field(default_factory=dict)
    error: str | None = None


class DryRunPricingStep(BaseModel):
    status: str
    reason: str | None = None
    calculated_price: float | None = None
    margin: float | None = None
    guard_failed: str | None = None
    min_selling_price: float | None = None
    competitor_min: float | None = None
    historical_avg: float | None = None
    pricing_engine_version: str | None = None


class DryRunReport(BaseModel):
    dry_run: bool = True
    keyword: str
    ean: str | None = None
    asin: str | None = None
    overall_would_publish: bool
    step_1_trend: DryRunStepResult
    step_2_supplier: DryRunStepResult
    step_3_competitor: DryRunStepResult
    step_4_pricing: DryRunPricingStep
    step_5_listing: DryRunStepResult
