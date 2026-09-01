"""Webhooks externes (Stripe)."""

from __future__ import annotations

import logging

import stripe
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from app.deps import DbDep
from app.models.order import Order
from app.services.stripe_service import stripe_enabled, verify_webhook_payload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/stripe")
async def stripe_webhook(request: Request, session: DbDep) -> dict[str, str]:
    """
    Confirme les paiements via webhook Stripe (source de vérité en production).
    Endpoint public — sécurisé par signature STRIPE_WEBHOOK_SECRET.
    """
    if not stripe_enabled():
        raise HTTPException(status_code=503, detail="Stripe non configuré.")

    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    if not signature:
        raise HTTPException(status_code=400, detail="Signature Stripe manquante.")

    try:
        event = verify_webhook_payload(payload, signature)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except stripe.StripeError as exc:
        raise HTTPException(status_code=400, detail="Signature webhook invalide.") from exc

    if event.type == "payment_intent.succeeded":
        intent = event.data.object
        payment_intent_id = intent.get("id") if isinstance(intent, dict) else intent.id
        result = await session.execute(
            select(Order).where(Order.stripe_payment_intent == payment_intent_id)
        )
        order = result.scalar_one_or_none()
        if order is not None and order.status == "pending":
            order.status = "paid"
            await session.flush()
            logger.info("Webhook: commande %s marquée payée", order.order_number)

    return {"status": "ok"}
