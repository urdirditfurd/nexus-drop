"""Produit catalogue dropshipping."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    """Article source avant publication sur marketplace."""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    sell_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    stock: Mapped[int] = mapped_column(default=0)
    image_urls: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON sérialisé
    supplier_id: Mapped[int | None] = mapped_column(
        ForeignKey("suppliers.id"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(32), default="draft")
    quarantine_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    margin_calculated: Mapped[float | None] = mapped_column(nullable=True)
    asin: Mapped[str | None] = mapped_column(String(32), nullable=True)
    ean: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    keyword: Mapped[str | None] = mapped_column(String(255), nullable=True)
    velocity_score: Mapped[float | None] = mapped_column(nullable=True)
    shipping_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    supplier: Mapped["Supplier | None"] = relationship(back_populates="products")
    listings: Mapped[list["Listing"]] = relationship(back_populates="product")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")


from app.models.listing import Listing  # noqa: E402
from app.models.order import OrderItem  # noqa: E402
from app.models.supplier import Supplier  # noqa: E402
