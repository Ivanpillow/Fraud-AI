from sqlalchemy.orm import Session
from fastapi import HTTPException
from argon2 import PasswordHasher
from app.models import AuthUser

from app.queries.users_management_queries import (
    get_users_by_merchant,
    get_user_by_id,
    get_role_by_name,
    create_user_db,
    update_user_db,
    delete_user_db
)

ph = PasswordHasher()


# ============================
# Listar usuarios
# ============================
def list_users_by_merchant(db: Session, merchant_id: int):
    users = get_users_by_merchant(db, merchant_id)

    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.name,
            "merchant": u.merchant.name,
            "is_active": u.is_active,
            "is_admin": u.role.is_admin
        }
        for u in users
]


# ============================
# Crear usuario
# ============================
def create_user_service(db: Session, payload, merchant_id: int):
    # Validación de rol
    role = get_role_by_name(db, payload.role)
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Validar que email no exista ya para el mismo merchant
    existing_user = db.query(AuthUser).filter(
        AuthUser.email == payload.email,
        AuthUser.merchant_id == merchant_id
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email ya existente.")

    # Hash de password
    password_hash = ph.hash(payload.password)

    user = create_user_db(
        db,
        email=payload.email,
        full_name=payload.full_name,
        password_hash=password_hash,
        role_id=role.role_id,
        merchant_id=merchant_id
    )

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": payload.role,
        "merchant": user.merchant_id,
        "is_active": user.is_active
    }


# ============================
# Toggle activo/inactivo
# ============================
def toggle_user_status_service(db: Session, user_id: int, merchant_id: int):
    user = get_user_by_id(db, user_id)

    if not user or user.merchant_id != merchant_id:
        raise HTTPException(status_code=404, detail="User not found")

    # No permitir desactivar un admin
    if getattr(user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Cannot deactivate an admin user")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "is_active": user.is_active
    }


# ============================
# Editar usuario
# ============================
def update_user_service(db: Session, user_id: int, payload, merchant_id: int):
    user = get_user_by_id(db, user_id)

    if not user or user.merchant_id != merchant_id:
        raise HTTPException(status_code=404, detail="User not found")

    # No permitir cambiar correo de usuario existente
    if payload.email != user.email:
        raise HTTPException(status_code=403, detail="Cannot change email of existing user")

    role = get_role_by_name(db, payload.role)
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = update_user_db(
        db,
        user,
        payload.email,  # aunque no cambia, se mantiene
        payload.full_name,
        role.role_id
    )

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": payload.role,
        "is_active": user.is_active
    }


# ============================
# Eliminar usuario
# ============================
def delete_user_service(db: Session, user_id: int, merchant_id: int):
    user = get_user_by_id(db, user_id)

    if not user or user.merchant_id != merchant_id:
        raise HTTPException(status_code=404, detail="User not found")

    # No permitir eliminar admins
    if getattr(user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Cannot delete an admin user")

    delete_user_db(db, user)

    return {"deleted": True}