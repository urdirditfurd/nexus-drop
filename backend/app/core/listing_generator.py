"""
Génération listing (Ollama) + traitement image + publication storefront.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from decimal import Decimal
from io import BytesIO
from typing import Any

import httpx
from pydantic import BaseModel, Field, ValidationError, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import MEDIA_DIR, settings
from app.core.pipeline_types import ListingCopy
from app.models.product import Product
from app.services.ai_listing import _fallback_aida_copy
from app.utils import dumps_json

logger = logging.getLogger(__name__)

OLLAMA_TIMEOUT_S = 45.0


class OllamaListingOutput(BaseModel):
    """Réponse JSON stricte attendue de Llama 3 via Ollama."""

    seo_title: str = Field(..., max_length=80)
    description_html: str = Field(..., min_length=50)

    @field_validator("seo_title")
    @classmethod
    def truncate_title(cls, value: str) -> str:
        cleaned = value.strip()
        return cleaned[:80] if cleaned else "Produit premium NEXUS-DROP"

    @field_validator("description_html")
    @classmethod
    def ensure_html_structure(cls, value: str) -> str:
        html = value.strip()
        if not re.search(r"<(p|h3|ul|section)", html, re.I):
            html = f"<section><p>{html}</p></section>"
        return html


def _build_ollama_prompt(keyword: str, supplier_data: dict[str, Any]) -> str:
    supplier_name = supplier_data.get("supplier_name", "fournisseur")
    price = supplier_data.get("price", 0)
    shipping = supplier_data.get("shipping_cost", 0)
    sell_price = supplier_data.get("sell_price", price + shipping)

    return f"""Tu es un expert copywriter neuromarketing francophone (framework AIDA).
Produit cible: {keyword}
Fournisseur: {supplier_name}
Prix coût: {price} EUR | Livraison: {shipping} EUR | Prix vente cible: {sell_price} EUR

Génère UNIQUEMENT un objet JSON valide (sans markdown, sans commentaire) avec exactement ces clés:
- "seo_title": string, max 80 caractères, accrocheur, DOIT contenir le mot-clé "{keyword}"
- "description_html": string HTML propre en français, framework AIDA, balises <h3>, <ul>, <p>, ton persuasif

Exemple de structure description_html:
<section>
  <p><em>Accroche attention (AIDA-A)</em></p>
  <h3>Pourquoi vous allez l'adorer</h3>
  <ul><li>Bénéfice 1</li><li>Bénéfice 2</li><li>Bénéfice 3</li></ul>
  <p>Preuve sociale et urgence (AIDA-D)</p>
  <p><strong>Call-to-action clair</strong></p>
</section>
"""


def _parse_ollama_json(raw: str) -> OllamaListingOutput | None:
    """Parse et valide la réponse Ollama via Pydantic."""
    text = raw.strip()
    if not text:
        return None
    try:
        data = json.loads(text)
        return OllamaListingOutput.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("Réponse Ollama JSON invalide: %s", exc)
        # Tentative extraction JSON embarqué
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return OllamaListingOutput.model_validate(json.loads(match.group()))
            except (json.JSONDecodeError, ValidationError):
                pass
        return None


async def generate_with_ollama(keyword: str, supplier_data: dict[str, Any]) -> OllamaListingOutput | None:
    """
    Appelle l'API Ollama locale (/api/generate) avec Llama 3.
    Retourne None si indisponible — le caller doit fallback AIDA.
    """
    url = f"{settings.ollama_url.rstrip('/')}/api/generate"
    prompt = _build_ollama_prompt(keyword, supplier_data)
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
    }

    logger.info(
        "Ollama — génération listing pour « %s » (modèle=%s, url=%s)",
        keyword[:60],
        settings.ollama_model,
        settings.ollama_url,
    )

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT_S) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            body = response.json()
            raw = body.get("response", "")
            parsed = _parse_ollama_json(raw)
            if parsed is None:
                logger.warning("Ollama — JSON non conforme, fallback AIDA")
                return None
            logger.info("Ollama — listing généré avec succès (titre=%d chars)", len(parsed.seo_title))
            return parsed
    except httpx.TimeoutException:
        logger.warning("Ollama timeout (>%.0fs) — fallback AIDA", OLLAMA_TIMEOUT_S)
        return None
    except httpx.ConnectError:
        logger.warning("Ollama non joignable (%s) — fallback AIDA", settings.ollama_url)
        return None
    except Exception as exc:
        logger.warning("Ollama indisponible (%s) — fallback AIDA", exc)
        return None


async def generate_listing(product: Product) -> ListingCopy:
    """Génère titre SEO + description HTML via Ollama prioritaire, sinon fallback AIDA."""
    keyword = (product.keyword or product.title or "produit").strip()
    supplier_data: dict[str, Any] = {
        "supplier_name": getattr(product, "supplier_name", None) or "fournisseur",
        "price": float(product.cost_price or 0),
        "shipping_cost": float(product.shipping_cost or 0),
        "sell_price": float(product.sell_price or 0),
    }

    ollama_result = await generate_with_ollama(keyword, supplier_data)
    if ollama_result is not None:
        return ListingCopy(
            seo_title=ollama_result.seo_title,
            description_html=ollama_result.description_html,
            bullets=[],
            source="ollama",
        )

    logger.warning("Listing — fallback AIDA activé pour « %s »", keyword[:60])
    copy = _fallback_aida_copy(product)
    return ListingCopy(
        seo_title=(copy.get("seo_title") or product.title)[:80],
        description_html=copy.get("description_html") or copy.get("hook", product.description or ""),
        bullets=copy.get("bullets", []),
        source="fallback",
    )


async def process_product_image(image_url: str | None, badge: str = "Promo") -> str | None:
    """
    Télécharge l'image, badge Pillow, sauvegarde dans /media/.
    rembg optionnel — ignoré si non installé.
    """
    if not image_url:
        return None

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    dest = MEDIA_DIR / f"nxd_{uuid.uuid4().hex[:10]}.jpg"

    try:
        from PIL import Image, ImageDraw, ImageFont

        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            raw = response.content

        img = Image.open(BytesIO(raw)).convert("RGBA")

        try:
            import rembg  # type: ignore[import-untyped]

            img = rembg.remove(img)
            logger.info("Image détourée via rembg")
        except ImportError:
            logger.debug("rembg absent — image sans détourage")

        rgb = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "RGBA":
            rgb.paste(img, mask=img.split()[3])
        else:
            rgb = img.convert("RGB")

        draw = ImageDraw.Draw(rgb)
        badge_h = max(28, rgb.height // 14)
        draw.rectangle([10, 10, 10 + badge_h * 4, 10 + badge_h], fill=(0, 128, 96))
        try:
            font = ImageFont.truetype("arial.ttf", badge_h // 2)
        except OSError:
            font = ImageFont.load_default()
        draw.text((18, 14), badge, fill=(255, 255, 255), font=font)

        rgb.save(dest, format="JPEG", quality=90)
        logger.info("Image produit sauvegardée: %s", dest.name)
        return f"/media/{dest.name}"
    except Exception as exc:
        logger.error("Échec traitement image: %s", exc)
        return image_url


async def publish_to_storefront(
    session: AsyncSession,
    product_data: dict[str, Any],
) -> Product:
    """
    Crée ou met à jour un produit en statut « active » (visible boutique).
    """
    sku = product_data.get("sku") or f"NXD-AUTO-{uuid.uuid4().hex[:8].upper()}"
    product = Product(
        sku=sku,
        title=product_data["title"][:512],
        description=product_data.get("description"),
        brand=product_data.get("brand"),
        category=product_data.get("category"),
        cost_price=Decimal(str(product_data.get("cost_price", 0))),
        sell_price=Decimal(str(product_data.get("sell_price", 0))),
        currency=product_data.get("currency", "EUR"),
        stock=product_data.get("stock", 50),
        image_urls=dumps_json(product_data.get("image_urls") or []),
        supplier_id=product_data.get("supplier_id"),
        status="active",
        asin=product_data.get("asin"),
        ean=product_data.get("ean"),
        source_url=product_data.get("source_url"),
        keyword=product_data.get("keyword"),
        velocity_score=product_data.get("velocity_score"),
        margin_calculated=product_data.get("margin_calculated"),
        shipping_cost=Decimal(str(product_data.get("shipping_cost", 0))),
        quarantine_reason=None,
    )
    session.add(product)
    await session.flush()
    await session.refresh(product)
    logger.info("Produit publié storefront id=%s sku=%s", product.id, product.sku)
    return product
