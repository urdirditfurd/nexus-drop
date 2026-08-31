"""Schémas paramètres."""

from datetime import datetime

from pydantic import BaseModel, Field


class SettingBase(BaseModel):
    key: str = Field(max_length=128)
    value: str | None = None
    description: str | None = None


class SettingCreate(SettingBase):
    pass


class SettingUpdate(BaseModel):
    value: str | None = None
    description: str | None = None


class SettingOut(SettingBase):
    id: int
    updated_at: datetime

    model_config = {"from_attributes": True}
