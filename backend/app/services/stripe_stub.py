"""Stub Stripe PaymentIntent pour tests."""

from __future__ import annotations

import secrets
import uuid
from decimal import Decimal

from app.config import settings


def create_payment_intent_stub(amount: Decimal, currency: str) -> dict[str, str]:
    """
    Simule la création d'un PaymentIntent Stripe en mode test.
    Retourne client_secret et payment_intent_id factices.
    """
    intent_id = f"pi_test_{uuid.uuid4().hex[:24]}"
    secret_suffix = secrets.token_hex(16)
    client_secret = f"{intent_id}_secret_{secret_suffix}"

    return {
        "payment_intent_id": intent_id,
        "client_secret": client_secret,
        "amount": str(amount),
        "currency": currency.lower(),
        "publishable_key": settings.stripe_publishable_key,
        "stripe_mode": "test_stub",
    }
