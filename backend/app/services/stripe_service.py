"""Intégration Stripe PaymentIntent (production) avec fallback stub dev."""

from __future__ import annotations

import logging
from decimal import Decimal

import stripe

from app.config import settings
from app.services.stripe_stub import create_payment_intent_stub

logger = logging.getLogger(__name__)


def stripe_enabled() -> bool:
    """True si des clés Stripe réelles sont configurées."""
    key = settings.stripe_secret_key.strip()
    return key.startswith("sk_") and "replace_me" not in key


def _configure_stripe() -> None:
    stripe.api_key = settings.stripe_secret_key.strip()


def amount_to_cents(amount: Decimal) -> int:
    """Convertit un montant EUR en centimes Stripe."""
    return int((amount * 100).quantize(Decimal("1")))


def create_payment_intent(
    amount: Decimal,
    currency: str,
    *,
    order_number: str,
    customer_email: str,
) -> dict[str, str]:
    """
    Crée un PaymentIntent Stripe ou retourne un stub en mode dev.
    """
    if not stripe_enabled():
        logger.warning("Stripe non configuré — mode stub (aucun débit réel)")
        stub = create_payment_intent_stub(amount, currency)
        return stub

    _configure_stripe()
    cents = amount_to_cents(amount)
    intent = stripe.PaymentIntent.create(
        amount=cents,
        currency=currency.lower(),
        automatic_payment_methods={"enabled": True},
        receipt_email=customer_email,
        metadata={
            "order_number": order_number,
            "customer_email": customer_email,
        },
    )
    mode = "live" if intent.livemode else "test"
    logger.info("PaymentIntent Stripe créé %s (%s, %s centimes)", intent.id, mode, cents)
    return {
        "payment_intent_id": intent.id,
        "client_secret": intent.client_secret or "",
        "amount": str(amount),
        "currency": currency.lower(),
        "publishable_key": settings.stripe_publishable_key,
        "stripe_mode": mode,
    }


def payment_intent_status(payment_intent_id: str) -> str | None:
    """Retourne le statut Stripe du PaymentIntent, ou None si stub/introuvable."""
    if not stripe_enabled():
        return "succeeded"

    _configure_stripe()
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return intent.status
    except stripe.StripeError as exc:
        logger.error("Stripe retrieve échoué pour %s: %s", payment_intent_id, exc)
        return None


def verify_webhook_payload(payload: bytes, signature: str) -> stripe.Event:
    """Vérifie et parse un événement webhook Stripe."""
    secret = settings.stripe_webhook_secret.strip()
    if not secret:
        raise ValueError("STRIPE_WEBHOOK_SECRET non configuré")
    return stripe.Webhook.construct_event(payload, signature, secret)
