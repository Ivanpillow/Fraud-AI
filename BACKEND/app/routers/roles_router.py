from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import re

from app.models.auth_user import  AuthUser as User
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.role import Role

from fastapi import HTTPException


router = APIRouter(prefix="/roles", tags=["Roles"])


class RoleRequest(BaseModel):
    name: str
    is_admin: bool = False


ROLE_NAME_REGEX = re.compile(r"^[A-Za-zÀ-ÿ0-9 _\-]+$")


def _resolve_merchant_scope(current_user: dict, merchant_id: int | None) -> int:
    user_merchant_id = int(current_user["merchant_id"])
    is_superadmin = bool(current_user.get("is_superadmin"))

    if merchant_id is None:
        return user_merchant_id

    if is_superadmin:
        return merchant_id

    if merchant_id != user_merchant_id:
        raise HTTPException(status_code=403, detail="No puedes operar sobre otro comercio")

    return user_merchant_id

@router.get("/")
def list_roles(
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)

    roles = (
        db.query(Role)
        .filter(Role.merchant_id == merchant_scope)
        .order_by(Role.role_id)
        .all()
    )

    return {
        "data": [
            {
                "role_id": role.role_id,
                "name": role.name,
                "is_admin": role.is_admin
            }
            for role in roles
        ]
    }

@router.post("/")
def create_role(
    payload: RoleRequest,
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)
    role_name = _validate_role_name(payload.name)

    existing_role = (
        db.query(Role)
        .filter(Role.merchant_id == merchant_scope, func.lower(Role.name) == role_name.lower())
        .first()
    )

    if existing_role:
        raise HTTPException(status_code=400, detail="Ya existe un rol con ese nombre")

    role = Role(name=role_name, is_admin=payload.is_admin, merchant_id=merchant_scope)

    db.add(role)
    db.commit()
    db.refresh(role)

    return {"data": {"role_id": role.role_id, "name": role.name}}


@router.put("/{role_id}")
def update_role(
    role_id: int,
    payload: RoleRequest,
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)
    is_superadmin = bool(current_user.get("is_superadmin"))
    role_name = _validate_role_name(payload.name)

    role = (
        db.query(Role)
        .filter(Role.role_id == role_id, Role.merchant_id == merchant_scope)
        .first()
    )

    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    if role.is_admin and not is_superadmin:
        raise HTTPException(status_code=400, detail="El rol administrador no se puede modificar")

    duplicate_role = (
        db.query(Role)
        .filter(
            Role.merchant_id == merchant_scope,
            func.lower(Role.name) == role_name.lower(),
            Role.role_id != role_id,
        )
        .first()
    )

    if duplicate_role:
        raise HTTPException(status_code=400, detail="Ya existe un rol con ese nombre")

    role.name = role_name

    db.commit()
    db.refresh(role)

    return {"data": {"role_id": role.role_id, "name": role.name}}



@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)
    is_superadmin = bool(current_user.get("is_superadmin"))
    current_user_id = int(current_user["sub"])

    role = (
        db.query(Role)
        .filter(Role.role_id == role_id, Role.merchant_id == merchant_scope)
        .first()
    )

    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    if role.is_admin and not is_superadmin:
        raise HTTPException(
            status_code=400,
            detail="El rol administrador no se puede eliminar"
        )

    current_db_user = db.query(User).filter(User.id == current_user_id).first()
    if current_db_user and int(current_db_user.role_id) == int(role.role_id):
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar el rol al que perteneces"
        )

    users_using_role = (
        db.query(User)
        .filter(User.role_id == role_id)
        .count()
    )

    if users_using_role > 0:
        raise HTTPException(
            status_code=400,
            detail="El rol tiene usuarios asignados"
        )

    db.delete(role)
    db.commit()

    return {"message": "Rol eliminado"}





def _sanitize_text(value: str) -> str:
    return (
        value.strip()
        .replace("<", "")
        .replace(">", "")
        .replace("javascript:", "")
    )


def _validate_role_name(name: str) -> str:
    clean_name = " ".join(_sanitize_text(name).split())

    if not clean_name:
        raise HTTPException(status_code=400, detail="Nombre del rol es requerido")

    if len(clean_name) < 2:
        raise HTTPException(status_code=400, detail="Nombre del rol demasiado corto")

    if len(clean_name) > 50:
        raise HTTPException(status_code=400, detail="Nombre del rol demasiado largo")

    if not ROLE_NAME_REGEX.match(clean_name):
        raise HTTPException(status_code=400, detail="Nombre del rol inválido")

    return clean_name

