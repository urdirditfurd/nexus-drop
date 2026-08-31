"""Schémas fournisseur."""

from datetime import datetime

from pydantic import BaseModel, Field


class SupplierBase(BaseModel):
    name: str = Field(max_length=255)
    platform: str | None = None
    contact_email: str | None = None
    api_url: str | None = None
    notes: str | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    is_active: bool = True


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    platform: str | None = None
    contact_email: str | None = None
    api_url: str | None = None
    notes: str | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    is_active: bool | None = None


class SupplierOut(SupplierBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
