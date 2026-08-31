"""Routes publiques storefront + proxy admin pour le frontend Next.js."""

from __future__ import annotations

import re
import unicodedata
from decimal import Decimal

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.deps import DbDep
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
        select(Product).where(Product.status == "active").order_by(Product.id.desc())
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
    result = await session.execute(select(Product).where(Product.status == "active"))
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
    result = await session.execute(select(Product).where(Product.status == "active"))
    items = []
    for p in result.scalars().all():
        if CATEGORY_TO_COLLECTION.get(p.category or "", "accessories") == slug:
            items.append(product_to_storefront(p))
    return items


@router.get("/admin/kpis")
async def admin_kpis_proxy(session: DbDep) -> dict:
    """KPIs format frontend (sans auth pour démo locale — sécuriser en prod)."""
    products = (
        await session.execute(select(Product).where(Product.status == "active"))
    ).scalars().all()
    revenue = sum(float(p.sell_price) * 10 for p in products)
    return {
        "revenue": int(revenue * 100),
        "orders": 42,
        "visitors": 1280,
        "conversionRate": 3.2,
        "avgOrderValue": int(revenue * 100 / max(1, len(products))),
        "productsSold": len(products) * 8,
    }


@router.get("/admin/chart")
async def admin_chart_proxy() -> list[dict]:
    """Données graphique hebdo démo."""
    return [
        {"name": "Lun", "revenue": 4200, "orders": 12},
        {"name": "Mar", "revenue": 5800, "orders": 18},
        {"name": "Mer", "revenue": 3900, "orders": 10},
        {"name": "Jeu", "revenue": 7100, "orders": 22},
        {"name": "Ven", "revenue": 8900, "orders": 28},
        {"name": "Sam", "revenue": 6200, "orders": 19},
        {"name": "Dim", "revenue": 4800, "orders": 14},
    ]


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
