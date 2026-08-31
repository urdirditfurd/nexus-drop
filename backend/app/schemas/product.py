"""Schémas produit."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    sku: str = Field(max_length=64)
    title: str = Field(max_length=512)
    description: str | None = None
    brand: str | None = None
    category: str | None = None
    cost_price: Decimal = Field(ge=0, decimal_places=2)
    sell_price: Decimal = Field(ge=0, decimal_places=2)
    currency: str = "EUR"
    stock: int = Field(ge=0, default=0)
    image_urls: list[str] | None = None
    supplier_id: int | None = None
    status: str = "draft"
    quarantine_reason: str | None = None
    margin_calculated: float | None = None
    asin: str | None = None
    ean: str | None = None
    source_url: str | None = None
    keyword: str | None = None
    velocity_score: float | None = None
    shipping_cost: Decimal | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: str | None = None
    title: str | None = None
    description: str | None = None
    brand: str | None = None
    category: str | None = None
    cost_price: Decimal | None = None
    sell_price: Decimal | None = None
    currency: str | None = None
    stock: int | None = None
    image_urls: list[str] | None = None
    supplier_id: int | None = None
    status: str | None = None
    quarantine_reason: str | None = None
    margin_calculated: float | None = None
    asin: str | None = None
    ean: str | None = None
    source_url: str | None = None
    keyword: str | None = None
    velocity_score: float | None = None
    shipping_cost: Decimal | None = None


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
