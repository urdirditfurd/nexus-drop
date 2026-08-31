"""Schémas checkout Stripe stub."""

from decimal import Decimal

from pydantic import BaseModel, Field


class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, default=1)


class CreateIntentRequest(BaseModel):
    items: list[CheckoutItem]
    customer_email: str = Field(min_length=3, max_length=255)
    currency: str = "EUR"


class CreateIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: Decimal
    currency: str
    publishable_key: str
