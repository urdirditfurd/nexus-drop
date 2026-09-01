"""Checkout Stripe (réel ou stub selon configuration)."""

from __future__ import annotations

import json
import logging
import uuid
from decimal import Decimal

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.deps import DbDep
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.checkout import (
    ConfirmCheckoutRequest,
    ConfirmCheckoutResponse,
    CreateIntentRequest,
    CreateIntentResponse,
)
from app.services.stripe_service import create_payment_intent, payment_intent_status, stripe_enabled

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.get("/config")
async def checkout_config() -> dict[str, str | bool]:
    """Expose la clé publique Stripe et le mode (stub vs réel) au frontend."""
    from app.config import settings

    return {
        "stripe_enabled": stripe_enabled(),
        "publishable_key": settings.stripe_publishable_key,
    }


@router.post("/create-intent", response_model=CreateIntentResponse)
async def create_checkout_intent(
    body: CreateIntentRequest,
    session: DbDep,
) -> CreateIntentResponse:
    """Crée un PaymentIntent + commande pending."""
    if not body.items:
        raise HTTPException(status_code=400, detail="Panier vide.")

    total = Decimal("0")
    order_items: list[tuple[Product, int]] = []

    for item in body.items:
        product = await session.get(Product, item.product_id)
        if product is None:
            raise HTTPException(
                status_code=404,
                detail=f"Produit {item.product_id} introuvable.",
            )
        line_total = product.sell_price * item.quantity
        total += line_total
        order_items.append((product, item.quantity))

    order_number = f"NXD-{uuid.uuid4().hex[:8].upper()}"

    result = await session.execute(
        select(Customer).where(Customer.email == body.customer_email)
    )
    customer = result.scalar_one_or_none()
    if customer is None:
        customer = Customer(email=body.customer_email)
        session.add(customer)
        await session.flush()

    shipping_json = (
        json.dumps(body.shipping_address, ensure_ascii=False)
        if body.shipping_address
        else None
    )

    order = Order(
        order_number=order_number,
        customer_id=customer.id,
        status="pending",
        total_amount=total,
        currency=body.currency.upper(),
        stripe_payment_intent=None,
        shipping_address_json=shipping_json,
    )
    session.add(order)
    await session.flush()

    for product, qty in order_items:
        session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=product.sell_price,
                title_snapshot=product.title,
            )
        )

    intent = create_payment_intent(
        total,
        body.currency,
        order_number=order_number,
        customer_email=body.customer_email,
    )
    order.stripe_payment_intent = intent["payment_intent_id"]
    await session.flush()

    return CreateIntentResponse(
        client_secret=intent["client_secret"],
        payment_intent_id=intent["payment_intent_id"],
        amount=total,
        currency=body.currency.upper(),
        publishable_key=intent["publishable_key"],
        order_id=order.id,
        order_number=order.order_number,
        stripe_enabled=stripe_enabled(),
    )


@router.post("/confirm", response_model=ConfirmCheckoutResponse)
async def confirm_checkout(
    body: ConfirmCheckoutRequest,
    session: DbDep,
) -> ConfirmCheckoutResponse:
    """Confirme le paiement après vérification Stripe (ou stub en dev)."""
    result = await session.execute(
        select(Order).where(Order.stripe_payment_intent == body.payment_intent_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Commande introuvable.")

    if order.status == "paid":
        return ConfirmCheckoutResponse(
            order_number=order.order_number,
            status=order.status,
        )

    status = payment_intent_status(body.payment_intent_id)
    if stripe_enabled():
        if status != "succeeded":
            raise HTTPException(
                status_code=402,
                detail=f"Paiement non confirmé (statut: {status or 'inconnu'}).",
            )
    else:
        logger.warning("Confirmation stub — aucune vérification Stripe")

    order.status = "paid"
    await session.flush()
    logger.info("Commande %s payée", order.order_number)

    return ConfirmCheckoutResponse(
        order_number=order.order_number,
        status=order.status,
    )
