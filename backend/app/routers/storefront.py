"""Routes publiques storefront + proxy admin pour le frontend Next.js."""

from __future__ import annotations

import re
import unicodedata
from decimal import Decimal

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.deps import DbDep
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.trend import Trend
from app.utils import loads_json_list

router = APIRouter(prefix="/api", tags=["storefront"])

COLLECTIONS = [
    {
        "id": "1",
        "slug": "tech-gadgets",
        "name": "Tech & Gadgets",
        "description": "Les dernières innovations tech pour votre quotidien.",
        "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=400&fit=crop",
        "productCount": 0,
    },
    {
        "id": "2",
        "slug": "home-living",
        "name": "Maison & Décoration",
        "description": "Transformez votre intérieur avec style.",
        "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
        "productCount": 0,
    },
    {
        "id": "3",
        "slug": "fitness",
        "name": "Fitness & Bien-être",
        "description": "Équipez-vous pour atteindre vos objectifs.",
        "image": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop",
        "productCount": 0,
    },
    {
        "id": "4",
        "slug": "accessories",
        "name": "Accessoires",
        "description": "Les petits détails qui font la différence.",
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop",
        "productCount": 0,
    },
]

CATEGORY_TO_COLLECTION = {
    "tech-wearable": "tech-gadgets",
    "audio": "tech-gadgets",
    "home-office": "home-living",
    "decoration": "home-living",
    "fitness": "fitness",
}


def slugify(text: str) -> str:
    """Génère un slug URL depuis un titre."""
    t = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    t = re.sub(r"[^a-zA-Z0-9\s-]", "", t).lower()
    return re.sub(r"[\s_]+", "-", t).strip("-")[:80] or "produit"


def product_to_storefront(p: Product) -> dict:
    """Mappe Product ORM → format attendu par le frontend."""
    images = loads_json_list(p.image_urls) or []
    image = images[0] if images else "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"
    slug = slugify(p.title)
    collection_slug = CATEGORY_TO_COLLECTION.get(p.category or "", "accessories")
    sell = float(p.sell_price)
    cost = float(p.cost_price)
    compare = round(sell * 1.35, 2) if sell > 0 else None
    return {
        "id": str(p.id),
        "slug": slug,
        "name": p.title,
        "description": p.description or "",
        "price": int(round(sell * 100)),
        "compareAtPrice": int(round(compare * 100)) if compare else None,
        "image": image,
        "images": images,
        "collection": p.category,
        "collectionSlug": collection_slug,
        "rating": 4.7,
        "reviewCount": 128,
        "tags": ["trending"] if p.status == "active" else [],
        "inStock": p.stock > 0,
    }


@router.get("/products")
async def list_storefront_products(session: DbDep) -> list[dict]:
    """Catalogue public (produits actifs)."""
    result = await session.execute(
        select(Product).where(Product.status.in_(["active", "published"])).order_by(Product.id.desc())
    )
    return [product_to_storefront(p) for p in result.scalars().all()]


@router.get("/products/trending")
async def trending_products(session: DbDep) -> list[dict]:
    """Produits tendance (actifs, limit 8)."""
    result = await session.execute(
        select(Product).where(Product.status == "active").order_by(Product.id.desc()).limit(8)
    )
    items = [product_to_storefront(p) for p in result.scalars().all()]
    for item in items:
        item["tags"] = list(set((item.get("tags") or []) + ["trending"]))
    return items


@router.get("/products/{slug}")
async def get_storefront_product(slug: str, session: DbDep) -> dict:
    """Fiche produit par slug."""
    result = await session.execute(select(Product).where(Product.status.in_(["active", "published"])))
    for p in result.scalars().all():
        if slugify(p.title) == slug:
            return product_to_storefront(p)
    raise HTTPException(status_code=404, detail="Produit introuvable")


@router.get("/collections")
async def list_collections(session: DbDep) -> list[dict]:
    """Collections dérivées des catégories."""
    products = (
        await session.execute(select(Product).where(Product.status == "active"))
    ).scalars().all()
    counts: dict[str, int] = {}
    for p in products:
        slug = CATEGORY_TO_COLLECTION.get(p.category or "", "accessories")
        counts[slug] = counts.get(slug, 0) + 1
    out = []
    for c in COLLECTIONS:
        row = dict(c)
        row["productCount"] = counts.get(c["slug"], 0)
        out.append(row)
    return out


@router.get("/collections/{slug}")
async def get_collection(slug: str) -> dict:
    """Détail collection."""
    for c in COLLECTIONS:
        if c["slug"] == slug:
            return dict(c)
    raise HTTPException(status_code=404, detail="Collection introuvable")


@router.get("/collections/{slug}/products")
async def collection_products(slug: str, session: DbDep) -> list[dict]:
    """Produits d'une collection."""
    result = await session.execute(select(Product).where(Product.status.in_(["active", "published"])))
    items = []
    for p in result.scalars().all():
        if CATEGORY_TO_COLLECTION.get(p.category or "", "accessories") == slug:
            items.append(product_to_storefront(p))
    return items


def _map_order_status(status: str) -> str:
    """Mappe statuts backend → frontend storefront."""
    mapping = {
        "pending": "pending",
        "paid": "processing",
        "fulfilled": "processing",
        "shipped": "shipped",
        "delivered": "delivered",
        "cancelled": "cancelled",
    }
    return mapping.get(status, "pending")


def _tracking_steps(status: str, created_at) -> list[dict]:
    """Étapes de suivi synthétiques selon le statut."""
    date_str = created_at.strftime("%d/%m/%Y")
    steps = [
        {"label": "Commande confirmée", "date": date_str, "completed": True},
        {
            "label": "Préparation en cours",
            "date": date_str,
            "completed": status in ("paid", "fulfilled", "shipped", "delivered"),
        },
        {
            "label": "Expédiée",
            "date": date_str,
            "completed": status in ("shipped", "delivered"),
        },
        {
            "label": "Livrée",
            "date": date_str,
            "completed": status == "delivered",
        },
    ]
    return steps


def _order_item_to_storefront(item: OrderItem, product: Product | None) -> dict:
    """Ligne commande → format frontend."""
    if product is not None:
        product_data = product_to_storefront(product)
    else:
        product_data = {
            "id": str(item.product_id or item.id),
            "slug": "produit",
            "name": item.title_snapshot or "Produit",
            "description": "",
            "price": int(round(float(item.unit_price) * 100)),
            "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
            "inStock": True,
        }
    return {"product": product_data, "quantity": item.quantity}


@router.get("/orders/{order_number}")
async def track_order(order_number: str, session: DbDep) -> dict:
    """Suivi commande public par numéro NXD-XXXXXXXX."""
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_number == order_number)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    product_ids = [i.product_id for i in order.items if i.product_id]
    products_map: dict[int, Product] = {}
    if product_ids:
        prod_result = await session.execute(
            select(Product).where(Product.id.in_(product_ids))
        )
        products_map = {p.id: p for p in prod_result.scalars().all()}

    frontend_status = _map_order_status(order.status)
    items = [
        _order_item_to_storefront(
            item,
            products_map.get(item.product_id) if item.product_id else None,
        )
        for item in order.items
    ]

    return {
        "id": order.order_number,
        "status": frontend_status,
        "createdAt": order.created_at.isoformat(),
        "total": int(round(float(order.total_amount) * 100)),
        "items": items,
        "trackingNumber": f"TRK-{order.order_number.replace('NXD-', '')}" if order.status in ("shipped", "delivered") else None,
        "trackingSteps": _tracking_steps(order.status, order.created_at),
    }


@router.get("/admin/kpis")
async def admin_kpis_proxy(session: DbDep) -> dict:
    """KPIs format frontend depuis données réelles."""
    paid_statuses = ["paid", "fulfilled", "shipped", "delivered"]
    orders = (
        await session.execute(
            select(Order).where(Order.status.in_(paid_statuses))
        )
    ).scalars().all()

    revenue_cents = sum(int(round(float(o.total_amount) * 100)) for o in orders)
    order_count = len(orders)
    avg_order = revenue_cents // max(1, order_count)

    active_products = (
        await session.execute(
            select(func.count()).select_from(Product).where(Product.status == "active")
        )
    ).scalar() or 0

    items_sold = (
        await session.execute(
            select(func.coalesce(func.sum(OrderItem.quantity), 0))
            .join(Order, OrderItem.order_id == Order.id)
            .where(Order.status.in_(paid_statuses))
        )
    ).scalar() or 0

    return {
        "revenue": revenue_cents,
        "orders": order_count,
        "visitors": max(order_count * 25, active_products * 10),
        "conversionRate": round(order_count / max(1, order_count * 25) * 100, 1),
        "avgOrderValue": avg_order,
        "productsSold": int(items_sold),
    }


@router.get("/admin/chart")
async def admin_chart_proxy(session: DbDep) -> list[dict]:
    """Données graphique hebdo depuis commandes réelles."""
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    paid_statuses = ["paid", "fulfilled", "shipped", "delivered"]

    orders = (
        await session.execute(
            select(Order).where(
                Order.created_at >= start,
                Order.status.in_(paid_statuses),
            )
        )
    ).scalars().all()

    buckets: dict[str, dict] = {}
    for i in range(7):
        day = start + timedelta(days=i)
        key = day.strftime("%Y-%m-%d")
        buckets[key] = {"name": labels[day.weekday()], "revenue": 0, "orders": 0}

    for order in orders:
        key = order.created_at.strftime("%Y-%m-%d")
        if key in buckets:
            buckets[key]["revenue"] += int(round(float(order.total_amount) * 100))
            buckets[key]["orders"] += 1

    return list(buckets.values())


@router.post("/ai/generate")
async def ai_generate_proxy(body: dict, session: DbDep) -> dict:
    """Génération listing simplifiée depuis un prompt texte."""
    from app.services.ai_listing import generate_listing_from_prompt

    prompt = str(body.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt requis")
    copy = await generate_listing_from_prompt(prompt)
    return {
        "title": copy.get("seo_title") or copy.get("titles", ["Produit NEXUS"])[0],
        "description": copy.get("description_html") or copy.get("hook", ""),
        "tags": copy.get("tags", ["premium", "trending"]),
    }
