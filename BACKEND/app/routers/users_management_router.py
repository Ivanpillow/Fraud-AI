from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.users_management_services import delete_user_service, list_users_by_merchant
from app.core.dependencies import get_current_user
from pydantic import BaseModel


from app.services.users_management_services import (
    list_users_by_merchant,
    create_user_service,
    toggle_user_status_service,
    update_user_service,
    reset_user_password_service,
)


class CreateUserRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str


class UpdateUserRequest(BaseModel):
    email: str
    full_name: str
    role: str


class ResetPasswordRequest(BaseModel):
    new_password: str


router = APIRouter(prefix="/users", tags=["Users Management"])


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
def get_users(
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)

    users = list_users_by_merchant(db, merchant_scope)

    return {
        "data": users
    }



@router.post("")
def create_user(
    payload: CreateUserRequest,
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)

    user = create_user_service(db, payload, merchant_scope)

    return {"data": user}


@router.patch("/{user_id}/toggle")
def toggle_user(
    user_id: int,
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)

    user = toggle_user_status_service(db, user_id, merchant_scope, current_user)

    return {"data": user}


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UpdateUserRequest,
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)

    user = update_user_service(db, user_id, payload, merchant_scope)

    return {"data": user}


@router.patch("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    payload: ResetPasswordRequest,
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)

    result = reset_user_password_service(
        db,
        user_id,
        payload.new_password,
        merchant_scope,
        current_user,
    )

    return {"data": result}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    merchant_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_scope = _resolve_merchant_scope(current_user, merchant_id)

    result = delete_user_service(db, user_id, merchant_scope, current_user)

    return {"data": result}


