from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import re

from app.queries.merchants_management_queries import (
    get_api_keys_by_merchant,
    get_merchants_with_keys,
    create_merchant_db,
    create_api_key_db,
    get_merchant_by_id,
    update_merchant_db,
    get_api_key_by_merchant,
    update_api_key_db,
    update_merchant_status_db,
    update_api_keys_status_db,
    count_users_by_merchant,
    delete_api_keys_by_merchant,
    delete_merchant_db
)


# ============================
# Listar merchants
# ============================
def list_merchants_service(db):

    merchants = get_merchants_with_keys(db)

    return [
        {
            "merchant_id": m["merchant_id"],
            "name": m["name"],
            "status": m["status"],
            "plan_type": m["plan_type"],
            "created_at": m["created_at"],
            "api_keys": [
                {
                    "api_key_id": k.api_key_id,
                    "label": k.label,
                    "status": k.status,
                    "created_at": k.created_at
                }
                for k in m["api_keys"]
            ]
        }
        for m in merchants
    ]



# ============================
# Crear merchant + API key
# ============================
def create_merchant_service(db: Session, payload):

    name = _validate_name(payload.name)
    status = _validate_status(payload.status)
    plan_type = _validate_plan(payload.plan_type)
    key = _validate_key(payload.key)

    # 🔐 hash
    key_hash = _hash_key(key)

    # 1. Crear merchant
    merchant = create_merchant_db(
        db,
        name=name,
        status=status,
        plan_type=plan_type
    )

    # 2. Crear API key
    api_key = create_api_key_db(
        db,
        merchant_id=merchant.merchant_id,
        key_hash=key_hash,
        label=key  
    )

    return {
        "merchant_id": merchant.merchant_id,
        "name": merchant.name,
        "status": merchant.status,
        "plan_type": merchant.plan_type,
        "created_at": merchant.created_at,
        "api_key": {
            "api_key_id": api_key.api_key_id,
            "label": api_key.label
        }
    }



# ============================
# Actualizar merchant
# ============================
def update_merchant_service(db: Session, merchant_id: int, payload):

    merchant = get_merchant_by_id(db, merchant_id)

    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")

    name = _validate_name(payload.name)

    updated_merchant = update_merchant_db(db, merchant, name)

    updated_api_key = None

    # 🔐 Si viene label → actualizar API key
    if payload.label:

        label = _validate_key(payload.label)
        key_hash = _hash_key(label)

        api_key = get_api_key_by_merchant(db, merchant_id)

        if not api_key:
            raise HTTPException(status_code=404, detail="API key no encontrada")

        updated_api_key = update_api_key_db(
            db,
            api_key,
            label,
            key_hash
        )

    return {
        "merchant_id": updated_merchant.merchant_id,
        "name": updated_merchant.name,
        "status": updated_merchant.status,
        "created_at": updated_merchant.created_at,
        "api_key": {
            "label": updated_api_key.label if updated_api_key else None
        }
    }


def toggle_merchant_status_service(db: Session, merchant_id: int, status: str):

    merchant = get_merchant_by_id(db, merchant_id)

    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")

    if status not in ["active", "inactive"]:
        raise HTTPException(status_code=400, detail="Status inválido")

    # actualizar en memoria
    update_merchant_status_db(db, merchant, status)

    api_keys = get_api_keys_by_merchant(db, merchant_id)
    update_api_keys_status_db(db, api_keys, status)

    db.commit()
    db.refresh(merchant)

    return {
        "merchant_id": merchant.merchant_id,
        "status": merchant.status
    }


def delete_merchant_service(db: Session, merchant_id: int):

    merchant = get_merchant_by_id(db, merchant_id)

    if not merchant:
        raise HTTPException(status_code=404, detail="Comercio no encontrado")

    if merchant.status == "active":
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un comercio activo. Desactivalo primero."
        )

    active_users = count_users_by_merchant(db, merchant_id, active_only=True)
    if active_users > 0:
        plural = "usuarios activos" if active_users > 1 else "usuario activo"
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar el comercio porque tiene {active_users} {plural}."
        )

    total_users = count_users_by_merchant(db, merchant_id, active_only=False)
    if total_users > 0:
        plural = "usuarios asignados" if total_users > 1 else "usuario asignado"
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar el comercio porque todavia tiene {total_users} {plural}."
        )

    delete_api_keys_by_merchant(db, merchant_id)
    delete_merchant_db(db, merchant)
    db.commit()

    return {
        "merchant_id": merchant_id,
        "message": "Comercio eliminado exitosamente"
    }






# ============================
# VALIDACIONES
# ============================

def _sanitize(value: str) -> str:
    return (
        value.strip()
        .replace("<", "")
        .replace(">", "")
        .replace("javascript:", "")
    )


def _validate_name(name: str) -> str:
    clean = " ".join(_sanitize(name).split())

    if not clean:
        raise HTTPException(status_code=400, detail="Nombre requerido")

    if len(clean) < 2:
        raise HTTPException(status_code=400, detail="Nombre muy corto")

    return clean


def _validate_status(status: str) -> str:
    if status not in ["active", "inactive"]:
        raise HTTPException(status_code=400, detail="Status inválido")

    return status


def _validate_plan(plan: str) -> str:
    if not plan:
        return "basic"

    return _sanitize(plan)


def _validate_key(key: str) -> str:
    if not key:
        raise HTTPException(status_code=400, detail="API key requerida")

    if len(key) < 6:
        raise HTTPException(status_code=400, detail="API key muy corta")

    if re.search(r"\s", key):
        raise HTTPException(status_code=400, detail="API key inválida")

    return key


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()





