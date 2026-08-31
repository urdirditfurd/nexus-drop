"""Schémas commandes."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class OrderItemBase(BaseModel):
    product_id: int | None = None
    quantity: int = Field(ge=1, default=1)
    unit_price: Decimal = Field(ge=0, decimal_places=2)
    title_snapshot: str | None = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemOut(OrderItemBase):
    id: int

    model_config = {"from_attributes": True}


class OrderBase(BaseModel):
    customer_id: int | None = None
    status: str = "pending"
    total_amount: Decimal = Field(ge=0, decimal_places=2)
    currency: str = "EUR"
    stripe_payment_intent: str | None = None
    shipping_address_json: str | None = None
    notes: str | None = None


class OrderCreate(OrderBase):
    items: list[OrderItemCreate] = Field(default_factory=list)


class OrderUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None
    shipping_address_json: str | None = None


class OrderOut(OrderBase):
    id: int
    order_number: str
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut] = Field(default_factory=list)
    customer_email: str | None = None

    model_config = {"from_attributes": True}


class FulfillResponse(BaseModel):
    """Réponse fulfillment — Celery ou mock synchrone."""

    order_id: int
    queued: bool
    task_id: str | None = None
    message: str
