"""Génération IA de fiches produit."""

from fastapi import APIRouter, HTTPException

from app.deps import AdminDep, DbDep
from app.models.product import Product
from app.schemas.ai import GenerateListingRequest, GenerateListingResponse
from app.services.ai_listing import generate_listing_copy

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/generate-listing", response_model=GenerateListingResponse)
async def generate_listing(
    body: GenerateListingRequest,
    session: DbDep,
    _admin: AdminDep,
) -> GenerateListingResponse:
    """
    Génère un copy neuromarketing (AIDA) pour un produit.
    Essaie Ollama, sinon fallback déterministe en français.
    """
    product = await session.get(Product, body.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produit introuvable.")

    copy = await generate_listing_copy(product, marketplace=body.marketplace)

    return GenerateListingResponse(
        product_id=product.id,
        source=copy.get("source", "fallback"),
        titles=copy.get("titles", []),
        seo_title=copy.get("seo_title", product.title),
        hook=copy.get("hook", ""),
        bullets=copy.get("bullets", []),
        reassurance=copy.get("reassurance", ""),
        cta_primary=copy.get("cta_primary", ""),
        cta_secondary=copy.get("cta_secondary", ""),
        storytelling=copy.get("storytelling", ""),
        description_html=copy.get("description_html", ""),
    )
