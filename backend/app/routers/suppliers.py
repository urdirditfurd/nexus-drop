"""CRUD fournisseurs."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import AdminDep, DbDep
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierOut, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=list[SupplierOut])
async def list_suppliers(session: DbDep, _admin: AdminDep) -> list[SupplierOut]:
    """Liste les fournisseurs."""
    result = await session.execute(select(Supplier).order_by(Supplier.name))
    return [SupplierOut.model_validate(s) for s in result.scalars().all()]


@router.get("/{supplier_id}", response_model=SupplierOut)
async def get_supplier(
    supplier_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> SupplierOut:
    """Détail fournisseur."""
    supplier = await session.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Fournisseur introuvable.")
    return SupplierOut.model_validate(supplier)


@router.post("", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    body: SupplierCreate,
    session: DbDep,
    _admin: AdminDep,
) -> SupplierOut:
    """Crée un fournisseur."""
    supplier = Supplier(**body.model_dump())
    session.add(supplier)
    await session.flush()
    await session.refresh(supplier)
    return SupplierOut.model_validate(supplier)


@router.patch("/{supplier_id}", response_model=SupplierOut)
async def update_supplier(
    supplier_id: int,
    body: SupplierUpdate,
    session: DbDep,
    _admin: AdminDep,
) -> SupplierOut:
    """Met à jour un fournisseur."""
    supplier = await session.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Fournisseur introuvable.")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(supplier, key, value)

    await session.flush()
    await session.refresh(supplier)
    return SupplierOut.model_validate(supplier)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(
    supplier_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> None:
    """Supprime un fournisseur."""
    supplier = await session.get(Supplier, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail="Fournisseur introuvable.")
    await session.delete(supplier)
