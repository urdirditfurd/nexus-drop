"""Checkout Stripe stub (mode test)."""

import json
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
from app.services.stripe_stub import create_payment_intent_stub

router = APIRouter(prefix="/checkout", tags=["checkout"])


@router.post("/create-intent", response_model=CreateIntentResponse)
async def create_checkout_intent(
    body: CreateIntentRequest,
    session: DbDep,
) -> CreateIntentResponse:
    """
    Crée un PaymentIntent Stripe stub + commande pending.
    Endpoint public (pas d'auth admin) pour le tunnel checkout frontend.
    """
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

    stub = create_payment_intent_stub(total, body.currency)

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
        order_number=f"NXD-{uuid.uuid4().hex[:8].upper()}",
        customer_id=customer.id,
        status="pending",
        total_amount=total,
        currency=body.currency.upper(),
        stripe_payment_intent=stub["payment_intent_id"],
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

    return CreateIntentResponse(
        client_secret=stub["client_secret"],
        payment_intent_id=stub["payment_intent_id"],
        amount=total,
        currency=body.currency.upper(),
        publishable_key=stub["publishable_key"],
        order_id=order.id,
        order_number=order.order_number,
    )


@router.post("/confirm", response_model=ConfirmCheckoutResponse)
async def confirm_checkout(
    body: ConfirmCheckoutRequest,
    session: DbDep,
) -> ConfirmCheckoutResponse:
    """Confirme le paiement (mode stub — marque la commande comme payée)."""
    result = await session.execute(
        select(Order).where(Order.stripe_payment_intent == body.payment_intent_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Commande introuvable.")

    order.status = "paid"
    await session.flush()

    return ConfirmCheckoutResponse(
        order_number=order.order_number,
        status=order.status,
    )
