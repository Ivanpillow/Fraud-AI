from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.services.merchants_management_services import (
    create_merchant_service,
    list_merchants_service,
    toggle_merchant_status_service,
    update_merchant_service,
    delete_merchant_service,
)
from app.models import Merchant, APIKey


router = APIRouter(prefix="/merchants", tags=["Merchants Management"])

class UpdateMerchantRequest(BaseModel):
    name: str
    label: str | None = None


class ToggleStatusRequest(BaseModel):
    status: str

# ============================
# REQUEST MODEL
# ============================

class CreateMerchantRequest(BaseModel):
    name: str
    status: str
    plan_type: str
    key: str



@router.get("/")
def get_merchants(db: Session = Depends(get_db)):

    merchants = list_merchants_service(db)

    return {
        "data": merchants
    }


# ============================
# CREATE MERCHANT
# ============================

@router.post("/")
def create_merchant(
    payload: CreateMerchantRequest,
    db: Session = Depends(get_db)
):
    merchant = create_merchant_service(db, payload)

    return {
        "data": merchant
    }



@router.put("/{merchant_id}")
def update_merchant(
    merchant_id: int,
    payload: UpdateMerchantRequest,
    db: Session = Depends(get_db)
):

    merchant = update_merchant_service(db, merchant_id, payload)

    return {
        "data": merchant
    }




@router.patch("/{merchant_id}/status")
def toggle_merchant_status(
    merchant_id: int,
    payload: ToggleStatusRequest,
    db: Session = Depends(get_db)
):

    merchant = toggle_merchant_status_service(db, merchant_id, payload.status)

    return {
        "data": merchant
    }


@router.delete("/{merchant_id}")
def delete_merchant(
    merchant_id: int,
    db: Session = Depends(get_db)
):

    result = delete_merchant_service(db, merchant_id)

    return {
        "data": result
    }