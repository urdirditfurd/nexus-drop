"""CRUD produits."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import AdminDep, DbDep
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.utils import dumps_json, loads_json_list

router = APIRouter(prefix="/products", tags=["products"])


def _product_to_out(p: Product) -> ProductOut:
    """Convertit le modèle ORM en schéma avec image_urls désérialisé."""
    return ProductOut.model_validate(
        {
            "id": p.id,
            "sku": p.sku,
            "title": p.title,
            "description": p.description,
            "brand": p.brand,
            "category": p.category,
            "cost_price": p.cost_price,
            "sell_price": p.sell_price,
            "currency": p.currency,
            "stock": p.stock,
            "image_urls": loads_json_list(p.image_urls),
            "supplier_id": p.supplier_id,
            "status": p.status,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
    )


@router.get("", response_model=list[ProductOut])
async def list_products(session: DbDep, _admin: AdminDep) -> list[ProductOut]:
    """Liste tous les produits."""
    result = await session.execute(select(Product).order_by(Product.id.desc()))
    return [_product_to_out(p) for p in result.scalars().all()]


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, session: DbDep, _admin: AdminDep) -> ProductOut:
    """Détail d'un produit."""
    product = await session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produit introuvable.")
    return _product_to_out(product)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    session: DbDep,
    _admin: AdminDep,
) -> ProductOut:
    """Crée un produit."""
    product = Product(
        **body.model_dump(exclude={"image_urls"}),
        image_urls=dumps_json(body.image_urls),
    )
    session.add(product)
    await session.flush()
    await session.refresh(product)
    return _product_to_out(product)


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    body: ProductUpdate,
    session: DbDep,
    _admin: AdminDep,
) -> ProductOut:
    """Met à jour un produit."""
    product = await session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produit introuvable.")

    updates = body.model_dump(exclude_unset=True)
    if "image_urls" in updates:
        product.image_urls = dumps_json(updates.pop("image_urls"))

    for key, value in updates.items():
        setattr(product, key, value)

    await session.flush()
    await session.refresh(product)
    return _product_to_out(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> None:
    """Supprime un produit."""
    product = await session.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produit introuvable.")
    await session.delete(product)
