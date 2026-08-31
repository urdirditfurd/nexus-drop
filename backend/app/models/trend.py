"""Tendances marché détectées par le scanner."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Trend(Base):
    """Signal tendance (niche, volume, score)."""

    __tablename__ = "trends"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    keyword: Mapped[str] = mapped_column(String(255), index=True)
    niche: Mapped[str | None] = mapped_column(String(128), nullable=True)
    platform: Mapped[str | None] = mapped_column(String(64), nullable=True)
    score: Mapped[float] = mapped_column(default=0.0)
    search_volume: Mapped[int | None] = mapped_column(nullable=True)
    avg_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    competition: Mapped[str | None] = mapped_column(String(32), nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    scanned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
