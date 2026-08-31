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


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
