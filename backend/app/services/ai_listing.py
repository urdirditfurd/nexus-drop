"""Génération listing IA — Ollama ou fallback AIDA français."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config import settings
from app.models.product import Product

logger = logging.getLogger(__name__)


def _fallback_aida_copy(product: Product) -> dict[str, Any]:
    """
    Copy neuromarketing déterministe en français (AIDA).
    Utilisé quand Ollama est indisponible.
    """
    title = product.title
    category = product.category or "lifestyle"
    brand_part = f" {product.brand}" if product.brand else ""

    titles = [
        f"Transformez votre quotidien — {title[:40]}",
        f"Exclusif : l'accessoire{brand_part} que tout le monde s'arrache",
        f"Offre limitée — {title[:45]} livraison rapide",
    ]
    seo_title = titles[0][:80]

    hook = (
        f"Vous en avez assez des produits {category} médiocres qui ne tiennent pas leurs promesses ? "
        f"Découvrez {title} — la solution pensée pour vous simplifier la vie dès aujourd'hui."
    )

    bullets = [
        f"<strong>Qualité premium</strong> — Matériaux sélectionnés pour une durabilité exceptionnelle.",
        f"<strong>Confort immédiat</strong> — Ressentez la différence dès la première utilisation.",
        f"<strong>Design élégant</strong> — S'intègre parfaitement à votre style de vie {category}.",
    ]

    reassurance = (
        "Achetez en toute sérénité : satisfaction garantie 30 jours ou remboursement intégral. "
        "Support client réactif 7j/7."
    )

    cta_primary = "Je veux en profiter maintenant"
    cta_secondary = "Découvrir les avantages"

    storytelling = (
        "Imaginez l'instant où vous ouvrez le colis : la texture, le design, "
        "cette sensation de « enfin le bon choix »."
    )

    description_html = f"""
<section>
  <p><em>{hook}</em></p>
  <ul>
    {''.join(f'<li>{b}</li>' for b in bullets)}
  </ul>
  <p>{reassurance}</p>
  <p><strong>{storytelling}</strong></p>
</section>
""".strip()

    return {
        "source": "fallback",
        "titles": titles,
        "seo_title": seo_title,
        "hook": hook,
        "bullets": bullets,
        "reassurance": reassurance,
        "cta_primary": cta_primary,
        "cta_secondary": cta_secondary,
        "storytelling": storytelling,
        "description_html": description_html,
    }


async def _call_ollama(product: Product, marketplace: str) -> dict[str, Any] | None:
    """Tente la génération via Ollama /api/generate."""
    prompt = f"""Tu es un expert copywriter neuromarketing (AIDA) en français.
Produit: {product.title}
Description: {product.description or 'N/A'}
Catégorie: {product.category or 'general'}
Marque: {product.brand or 'générique'}
Marketplace: {marketplace}
Prix: {product.sell_price} {product.currency}

Génère UNIQUEMENT un JSON valide avec ces clés:
titles (3 titres max 60 car), seo_title, hook, bullets (3 strings HTML),
reassurance, cta_primary, cta_secondary, storytelling, description_html
"""

    url = f"{settings.ollama_url.rstrip('/')}/api/generate"
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            raw = data.get("response", "")
            parsed = json.loads(raw)
            parsed["source"] = "ollama"
            return parsed
    except Exception as exc:
        logger.warning("Ollama indisponible (%s), fallback AIDA", exc)
        return None


async def generate_listing_from_prompt(prompt: str) -> dict[str, Any]:
    """Génère un listing depuis un prompt libre (admin storefront)."""
    class _P:
        title = prompt[:120]
        description = prompt
        category = "general"
        brand = None
        sell_price = 49.99
        currency = "EUR"

    return _fallback_aida_copy(_P())  # type: ignore[arg-type]


async def generate_listing_copy(
    product: Product,
    marketplace: str = "ebay",
) -> dict[str, Any]:
    """Génère le copy listing — Ollama prioritaire, sinon fallback AIDA."""
    ollama_result = await _call_ollama(product, marketplace)
    if ollama_result is not None:
        return ollama_result
    return _fallback_aida_copy(product)
