"""Schémas annonces marketplace."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ListingBase(BaseModel):
    product_id: int
    marketplace: str = "ebay"
    title: str = Field(max_length=512)
    subtitle: str | None = None
    description_html: str | None = None
    seo_title: str | None = None
    price: Decimal = Field(ge=0, decimal_places=2)
    currency: str = "EUR"
    status: str = "draft"
    ai_payload_json: str | None = None
    external_id: str | None = None


class ListingCreate(ListingBase):
    pass


class ListingUpdate(BaseModel):
    marketplace: str | None = None
    title: str | None = None
    subtitle: str | None = None
    description_html: str | None = None
    seo_title: str | None = None
    price: Decimal | None = None
    currency: str | None = None
    status: str | None = None
    ai_payload_json: str | None = None
    external_id: str | None = None


class ListingOut(ListingBase):
    id: int
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ListingPublishRequest(BaseModel):
    """Demande de publication avec garde-fou prix / VERO."""

    listing_id: int | None = None
