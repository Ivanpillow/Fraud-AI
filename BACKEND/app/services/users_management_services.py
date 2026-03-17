from sqlalchemy.orm import Session
from fastapi import HTTPException
from argon2 import PasswordHasher
from app.models import AuthUser
from app.core.authorization import is_superadmin_email

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
            "id": getattr(u, "id"),
            "email": getattr(u, "email"),
            "full_name": getattr(u, "full_name"),
            "role": getattr(u.role, "name"),
            "merchant": getattr(u.merchant, "name"),
            "is_active": bool(getattr(u, "is_active")),
            "is_admin": bool(getattr(u.role, "is_admin")),
            "is_superadmin": is_superadmin_email(getattr(u, "email", None))
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
def toggle_user_status_service(db: Session, user_id: int, merchant_id: int, current_user: dict):
    user = get_user_by_id(db, user_id)
    actor = get_user_by_id(db, int(current_user["sub"]))

    if user is None or getattr(user, "merchant_id") != merchant_id:
        raise HTTPException(status_code=404, detail="User not found")

    if actor is None:
        raise HTTPException(status_code=401, detail="Current user not found")

    # Solo superadmins permitidos pueden modificar admins
    if bool(getattr(user.role, "is_admin")) and not is_superadmin_email(getattr(actor, "email", None)):
        raise HTTPException(status_code=403, detail="Only superadmins can deactivate an admin user")

    if getattr(actor, "id") == getattr(user, "id"):
        raise HTTPException(status_code=403, detail="Cannot change your own active status")

    setattr(user, "is_active", not bool(getattr(user, "is_active")))
    db.commit()
    db.refresh(user)

    return {
        "id": getattr(user, "id"),
        "is_active": bool(getattr(user, "is_active"))
    }


# ============================
# Editar usuario
# ============================
def update_user_service(db: Session, user_id: int, payload, merchant_id: int):
    user = get_user_by_id(db, user_id)

    if user is None or getattr(user, "merchant_id") != merchant_id:
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
        getattr(role, "role_id")
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
def delete_user_service(db: Session, user_id: int, merchant_id: int, current_user: dict):
    user = get_user_by_id(db, user_id)
    actor = get_user_by_id(db, int(current_user["sub"]))

    if user is None or getattr(user, "merchant_id") != merchant_id:
        raise HTTPException(status_code=404, detail="User not found")

    if actor is None:
        raise HTTPException(status_code=401, detail="Current user not found")

    if getattr(actor, "id") == getattr(user, "id"):
        raise HTTPException(status_code=403, detail="Cannot delete your own user")

    # Solo superadmins permitidos pueden eliminar admins
    if bool(getattr(user.role, "is_admin")) and not is_superadmin_email(getattr(actor, "email", None)):
        raise HTTPException(status_code=403, detail="Only superadmins can delete an admin user")

    delete_user_db(db, user)

    return {"deleted": True}