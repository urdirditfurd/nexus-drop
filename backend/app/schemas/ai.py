"""Schémas génération IA listing."""

from pydantic import BaseModel, Field


class GenerateListingRequest(BaseModel):
    product_id: int
    marketplace: str = "ebay"
    tone: str = "conversion"


class GenerateListingResponse(BaseModel):
    product_id: int
    source: str  # "ollama" | "fallback"
    titles: list[str]
    seo_title: str
    hook: str
    bullets: list[str]
    reassurance: str
    cta_primary: str
    cta_secondary: str
    storytelling: str
    description_html: str
