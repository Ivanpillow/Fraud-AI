from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import re

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.merchants import Merchant
from app.models.api_keys import APIKey
from fastapi import HTTPException


router = APIRouter(prefix="/merchants", tags=["Merchants"])

MERCHANT_NAME_REGEX = re.compile(r"^[A-Za-zÀ-ÿ0-9 _\-\.]+$")
PLAN_TYPES = ["basic", "standard", "premium"]
MERCHANT_STATUSES = ["active", "inactive", "suspended"]


class MerchantRequest(BaseModel):
    name: str
    plan_type: str = "basic"


class MerchantStatusRequest(BaseModel):
    status: str


class APIKeyResponse(BaseModel):
    api_key_id: int
    key_hash: str
    label: str | None
    status: str
    created_at: str


class MerchantDetailResponse(BaseModel):
    merchant_id: int
    name: str
    status: str
    plan_type: str
    created_at: str
    api_keys: list[APIKeyResponse]


def _sanitize_text(value: str) -> str:
    return (
        value.strip()
        .replace("<", "")
        .replace(">", "")
        .replace("javascript:", "")
    )


def _validate_merchant_name(name: str) -> str:
    clean_name = " ".join(_sanitize_text(name).split())

    if not clean_name:
        raise HTTPException(status_code=400, detail="Nombre del comercio es requerido")

    if len(clean_name) < 2:
        raise HTTPException(status_code=400, detail="Nombre del comercio demasiado corto")

    if len(clean_name) > 120:
        raise HTTPException(status_code=400, detail="Nombre del comercio demasiado largo")

    if not MERCHANT_NAME_REGEX.match(clean_name):
        raise HTTPException(status_code=400, detail="Nombre del comercio inválido")

    return clean_name


def _validate_plan_type(plan_type: str) -> str:
    clean_plan = _sanitize_text(plan_type).lower()

    if clean_plan not in PLAN_TYPES:
        raise HTTPException(status_code=400, detail=f"Plan inválido. Debe ser uno de: {', '.join(PLAN_TYPES)}")

    return clean_plan


def _validate_status(status: str) -> str:
    clean_status = _sanitize_text(status).lower()

    if clean_status not in MERCHANT_STATUSES:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {', '.join(MERCHANT_STATUSES)}")

    return clean_status


@router.get("/")
def list_merchants(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """List all merchants with their API keys"""
    
    merchants = db.query(Merchant).order_by(Merchant.merchant_id).all()

    result = []
    for merchant in merchants:
        api_keys = db.query(APIKey).filter(APIKey.merchant_id == merchant.merchant_id).all()
        
        result.append({
            "merchant_id": merchant.merchant_id,
            "name": merchant.name,
            "status": merchant.status,
            "plan_type": merchant.plan_type,
            "created_at": merchant.created_at.isoformat() if merchant.created_at else None,
            "api_keys": [
                {
                    "api_key_id": key.api_key_id,
                    "key_hash": key.key_hash,
                    "label": key.label,
                    "status": key.status,
                    "created_at": key.created_at.isoformat() if key.created_at else None,
                }
                for key in api_keys
            ]
        })

    return {"data": result}


@router.post("/")
def create_merchant(
    payload: MerchantRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create a new merchant"""
    
    # Verify current user is superadmin
    if not current_user.get("is_superadmin"):
        raise HTTPException(status_code=403, detail="Only superadmins can create merchants")

    merchant_name = _validate_merchant_name(payload.name)
    plan_type = _validate_plan_type(payload.plan_type)

    # Check for duplicate merchant name
    existing = db.query(Merchant).filter(Merchant.name.ilike(merchant_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un comercio con ese nombre")

    merchant = Merchant(name=merchant_name, plan_type=plan_type, status="active")
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    return {
        "data": {
            "merchant_id": merchant.merchant_id,
            "name": merchant.name,
            "status": merchant.status,
            "plan_type": merchant.plan_type,
            "created_at": merchant.created_at.isoformat() if merchant.created_at else None,
        }
    }


@router.get("/{merchant_id}")
def get_merchant(
    merchant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get merchant details with API keys"""
    
    merchant = db.query(Merchant).filter(Merchant.merchant_id == merchant_id).first()

    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    api_keys = db.query(APIKey).filter(APIKey.merchant_id == merchant_id).all()

    return {
        "data": {
            "merchant_id": merchant.merchant_id,
            "name": merchant.name,
            "status": merchant.status,
            "plan_type": merchant.plan_type,
            "created_at": merchant.created_at.isoformat() if merchant.created_at else None,
            "api_keys": [
                {
                    "api_key_id": key.api_key_id,
                    "key_hash": key.key_hash,
                    "label": key.label,
                    "status": key.status,
                    "created_at": key.created_at.isoformat() if key.created_at else None,
                }
                for key in api_keys
            ]
        }
    }


@router.put("/{merchant_id}")
def update_merchant(
    merchant_id: int,
    payload: MerchantRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update merchant information"""
    
    if not current_user.get("is_superadmin"):
        raise HTTPException(status_code=403, detail="Only superadmins can update merchants")

    merchant = db.query(Merchant).filter(Merchant.merchant_id == merchant_id).first()

    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    merchant_name = _validate_merchant_name(payload.name)
    plan_type = _validate_plan_type(payload.plan_type)

    # Check for duplicate (excluding current merchant)
    existing = (
        db.query(Merchant)
        .filter(
            Merchant.name.ilike(merchant_name),
            Merchant.merchant_id != merchant_id
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe otro comercio con ese nombre")

    merchant.name = merchant_name
    merchant.plan_type = plan_type
    db.commit()
    db.refresh(merchant)

    return {
        "data": {
            "merchant_id": merchant.merchant_id,
            "name": merchant.name,
            "status": merchant.status,
            "plan_type": merchant.plan_type,
            "created_at": merchant.created_at.isoformat() if merchant.created_at else None,
        }
    }


@router.patch("/{merchant_id}/status")
def update_merchant_status(
    merchant_id: int,
    payload: MerchantStatusRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update merchant status (activate/deactivate/suspend)"""
    
    if not current_user.get("is_superadmin"):
        raise HTTPException(status_code=403, detail="Only superadmins can change merchant status")

    merchant = db.query(Merchant).filter(Merchant.merchant_id == merchant_id).first()

    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    new_status = _validate_status(payload.status)

    merchant.status = new_status
    db.commit()
    db.refresh(merchant)

    return {
        "data": {
            "merchant_id": merchant.merchant_id,
            "status": merchant.status,
        }
    }


@router.delete("/{merchant_id}")
def delete_merchant(
    merchant_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete merchant and all associated data"""
    
    if not current_user.get("is_superadmin"):
        raise HTTPException(status_code=403, detail="Only superadmins can delete merchants")

    merchant = db.query(Merchant).filter(Merchant.merchant_id == merchant_id).first()

    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    # Check if merchant has users
    from app.models.auth_user import AuthUser
    user_count = db.query(AuthUser).filter(AuthUser.merchant_id == merchant_id).count()
    
    if user_count > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un comercio que tiene usuarios asignados"
        )

    # Delete API keys first
    db.query(APIKey).filter(APIKey.merchant_id == merchant_id).delete()

    # Delete merchant
    db.delete(merchant)
    db.commit()

    return {"message": "Comercio eliminado exitosamente"}
