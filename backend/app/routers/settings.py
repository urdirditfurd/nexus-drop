"""CRUD paramètres applicatifs."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.deps import AdminDep, DbDep
from app.models.setting import Setting
from app.schemas.setting import SettingCreate, SettingOut, SettingUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=list[SettingOut])
async def list_settings(session: DbDep, _admin: AdminDep) -> list[SettingOut]:
    """Liste tous les paramètres."""
    result = await session.execute(select(Setting).order_by(Setting.key))
    return [SettingOut.model_validate(s) for s in result.scalars().all()]


@router.get("/{setting_id}", response_model=SettingOut)
async def get_setting(
    setting_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> SettingOut:
    """Détail d'un paramètre."""
    setting = await session.get(Setting, setting_id)
    if setting is None:
        raise HTTPException(status_code=404, detail="Paramètre introuvable.")
    return SettingOut.model_validate(setting)


@router.get("/key/{key}", response_model=SettingOut)
async def get_setting_by_key(key: str, session: DbDep, _admin: AdminDep) -> SettingOut:
    """Récupère un paramètre par clé."""
    result = await session.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    if setting is None:
        raise HTTPException(status_code=404, detail="Paramètre introuvable.")
    return SettingOut.model_validate(setting)


@router.post("", response_model=SettingOut, status_code=status.HTTP_201_CREATED)
async def create_setting(
    body: SettingCreate,
    session: DbDep,
    _admin: AdminDep,
) -> SettingOut:
    """Crée un paramètre."""
    existing = await session.execute(select(Setting).where(Setting.key == body.key))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Clé déjà existante.")

    setting = Setting(**body.model_dump())
    session.add(setting)
    await session.flush()
    await session.refresh(setting)
    return SettingOut.model_validate(setting)


@router.patch("/{setting_id}", response_model=SettingOut)
async def update_setting(
    setting_id: int,
    body: SettingUpdate,
    session: DbDep,
    _admin: AdminDep,
) -> SettingOut:
    """Met à jour un paramètre."""
    setting = await session.get(Setting, setting_id)
    if setting is None:
        raise HTTPException(status_code=404, detail="Paramètre introuvable.")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(setting, key, value)

    await session.flush()
    await session.refresh(setting)
    return SettingOut.model_validate(setting)


@router.delete("/{setting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_setting(
    setting_id: int,
    session: DbDep,
    _admin: AdminDep,
) -> None:
    """Supprime un paramètre."""
    setting = await session.get(Setting, setting_id)
    if setting is None:
        raise HTTPException(status_code=404, detail="Paramètre introuvable.")
    await session.delete(setting)
