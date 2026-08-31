"""CRUD commandes + fulfillment Celery stub."""

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.deps import AdminDep, DbDep
from app.models.order import Order, OrderItem
from app.schemas.order import FulfillResponse, OrderCreate, OrderOut, OrderUpdate
from app.services.celery_tasks import queue_fulfill_order

router = APIRouter(prefix="/orders", tags=["orders"])


def _order_to_out(order: Order) -> OrderOut:
    out = OrderOut.model_validate(order)
    if order.customer is not None:
        out = out.model_copy(update={"customer_email": order.customer.email})
    return out


@router.get("", response_model=list[OrderOut])
async def list_orders(session: DbDep, _admin: AdminDep) -> list[OrderOut]:
    """Liste les commandes."""
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.customer))
        .order_by(Order.created_at.desc())
    )
    return [_order_to_out(o) for o in result.scalars().unique().all()]


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, session: DbDep, _admin: AdminDep) -> OrderOut:
    """Détail commande."""
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items), selectinload(Order.customer))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Commande introuvable.")
    return _order_to_out(order)


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreate,
    session: DbDep,
    _admin: AdminDep,
) -> OrderOut:
    """Crée une commande avec lignes."""
    order_number = f"NXD-{uuid.uuid4().hex[:8].upper()}"
    order = Order(
        order_number=order_number,
        customer_id=body.customer_id,
        status=body.status,
        total_amount=body.total_amount,
        currency=body.currency,
        stripe_payment_intent=body.stripe_payment_intent,
        shipping_address_json=body.shipping_address_json,
        notes=body.notes,
    )
    session.add(order)
    await session.flush()

    for item in body.items:
        session.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                title_snapshot=item.title_snapshot,
            )
        )

    await session.flush()
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )
    order = result.scalar_one()
    return _order_to_out(order)


@router.patch("/{order_id}", response_model=OrderOut)
async def update_order(
    order_id: int,
    body: OrderUpdate,
    session: DbDep,
    _admin: AdminDep,
) -> OrderOut:
    """Met à jour le statut / notes d'une commande."""
    result = await session.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Commande introuvable.")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(order, key, value)

    await session.flush()
    await session.refresh(order)
    return _order_to_out(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> None:
    """Supprime une commande."""
    order = await session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Commande introuvable.")
    await session.delete(order)


@router.post("/{order_id}/fulfill", response_model=FulfillResponse)
async def fulfill_order(
    order_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> FulfillResponse:
    """
    Enfile le fulfillment via Celery/Redis si disponible,
    sinon exécution mock synchrone.
    """
    order = await session.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Commande introuvable.")

    queued, task_id, message = queue_fulfill_order(order_id)

    if not queued:
        order.status = "fulfilled"
        order.notes = (order.notes or "") + "\n[Fulfillment mock sync]"

    return FulfillResponse(
        order_id=order_id,
        queued=queued,
        task_id=task_id,
        message=message,
    )
