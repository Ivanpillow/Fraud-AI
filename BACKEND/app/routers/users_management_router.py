from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.users_management_services import delete_user_service, list_users_by_merchant
from app.core.dependencies import get_current_user
from pydantic import BaseModel


from app.services.users_management_services import (
    list_users_by_merchant,
    create_user_service,
    toggle_user_status_service,
    update_user_service
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


router = APIRouter(prefix="/users", tags=["Users Management"])


@router.get("/")
def get_users(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    
    merchant_id = current_user["merchant_id"]

    users = list_users_by_merchant(db, merchant_id)

    return {
        "data": users
    }



@router.post("/")
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_id = current_user["merchant_id"]

    user = create_user_service(db, payload, merchant_id)

    return {"data": user}


@router.patch("/{user_id}/toggle")
def toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_id = current_user["merchant_id"]

    user = toggle_user_status_service(db, user_id, merchant_id)

    return {"data": user}


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_id = current_user["merchant_id"]

    user = update_user_service(db, user_id, payload, merchant_id)

    return {"data": user}


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    merchant_id = current_user["merchant_id"]

    result = delete_user_service(db, user_id, merchant_id)

    return {"data": result}


