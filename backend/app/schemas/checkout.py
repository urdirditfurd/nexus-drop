"""Schémas checkout Stripe stub."""

from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, default=1)


class CreateIntentRequest(BaseModel):
    items: list[CheckoutItem]
    customer_email: str = Field(min_length=3, max_length=255)
    currency: str = "EUR"
    shipping_address: dict[str, Any] | None = None


class CreateIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: Decimal
    currency: str
    publishable_key: str
    order_id: int
    order_number: str


class ConfirmCheckoutRequest(BaseModel):
    payment_intent_id: str


class ConfirmCheckoutResponse(BaseModel):
    order_number: str
    status: str
