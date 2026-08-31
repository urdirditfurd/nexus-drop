"""CRUD annonces + garde-fou publication."""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import AdminDep, DbDep
from app.models.listing import Listing
from app.models.product import Product
from app.schemas.listing import ListingCreate, ListingOut, ListingUpdate
from app.services.price_guard import PriceGuardError, validate_publish_prices

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=list[ListingOut])
async def list_listings(session: DbDep, _admin: AdminDep) -> list[ListingOut]:
    """Liste les annonces."""
    result = await session.execute(select(Listing).order_by(Listing.created_at.desc()))
    return [ListingOut.model_validate(l) for l in result.scalars().all()]


@router.get("/{listing_id}", response_model=ListingOut)
async def get_listing(
    listing_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> ListingOut:
    """Détail annonce."""
    listing = await session.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Annonce introuvable.")
    return ListingOut.model_validate(listing)


@router.post("", response_model=ListingOut, status_code=status.HTTP_201_CREATED)
async def create_listing(
    body: ListingCreate,
    session: DbDep,
    _admin: AdminDep,
) -> ListingOut:
    """Crée une annonce brouillon."""
    product = await session.get(Product, body.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produit introuvable.")

    listing = Listing(**body.model_dump())
    session.add(listing)
    await session.flush()
    await session.refresh(listing)
    return ListingOut.model_validate(listing)


@router.patch("/{listing_id}", response_model=ListingOut)
async def update_listing(
    listing_id: int,
    body: ListingUpdate,
    session: DbDep,
    _admin: AdminDep,
) -> ListingOut:
    """Met à jour une annonce."""
    listing = await session.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Annonce introuvable.")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(listing, key, value)

    await session.flush()
    await session.refresh(listing)
    return ListingOut.model_validate(listing)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> None:
    """Supprime une annonce."""
    listing = await session.get(Listing, listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Annonce introuvable.")
    await session.delete(listing)


@router.post("/{listing_id}/publish", response_model=ListingOut)
async def publish_listing(
    listing_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> ListingOut:
    """
    Publie une annonce après validation price guard :
    - marge >= 8 %
    - marque hors liste VERO
    """
    result = await session.execute(
        select(Listing)
        .options(selectinload(Listing.product))
        .where(Listing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        raise HTTPException(status_code=404, detail="Annonce introuvable.")

    product = listing.product
    if product is None:
        raise HTTPException(status_code=400, detail="Produit associé manquant.")

    try:
        validate_publish_prices(
            cost_price=product.cost_price,
            sell_price=listing.price,
            brand=product.brand,
        )
    except PriceGuardError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": exc.code, "message": exc.message},
        ) from exc

    listing.status = "published"
    listing.published_at = datetime.now(timezone.utc)
    product.status = "listed"

    await session.flush()
    await session.refresh(listing)
    return ListingOut.model_validate(listing)
