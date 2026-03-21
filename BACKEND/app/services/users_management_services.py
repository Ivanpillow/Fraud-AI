from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from argon2 import PasswordHasher
import re
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

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")



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
    email = _validate_email(payload.email)
    full_name = _validate_full_name(payload.full_name)
    role_name = _validate_role(payload.role)
    password = _validate_password(payload.password)

    # Validación de rol
    role = get_role_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=400, detail="Rol inválido")

    # Validar que email no exista ya para el mismo merchant
    existing_user = db.query(AuthUser).filter(
        func.lower(AuthUser.email) == email,
        AuthUser.merchant_id == merchant_id
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Correo electrónico ya existente.")

    # Hash de password
    password_hash = ph.hash(password)

    user = create_user_db(
        db,
        email=email,
        full_name=full_name,
        password_hash=password_hash,
        role_id=role.role_id,
        merchant_id=merchant_id
    )

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": role_name,
        "merchant": user.merchant_id,
        "is_active": user.is_active
    }


# ============================
# Cambiar estado activo/inactivo
# ============================
def toggle_user_status_service(db: Session, user_id: int, merchant_id: int, current_user: dict):
    user = get_user_by_id(db, user_id)
    actor = get_user_by_id(db, int(current_user["sub"]))

    if user is None or getattr(user, "merchant_id") != merchant_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if actor is None:
        raise HTTPException(status_code=401, detail="El usuario actual no fue encontrado")

    # Solo superadmins permitidos pueden modificar admins
    if bool(getattr(user.role, "is_admin")) and not is_superadmin_email(getattr(actor, "email", None)):
        raise HTTPException(status_code=403, detail="Solo superadmins pueden modificar el estado de un usuario admin")

    if getattr(actor, "id") == getattr(user, "id"):
        raise HTTPException(status_code=403, detail="No puedes cambiar tu propio estado de activo")

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
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    email = _validate_email(payload.email)
    full_name = _validate_full_name(payload.full_name)
    role_name = _validate_role(payload.role)

    # No permitir cambiar correo de usuario existente
    if email != str(user.email).lower():
        raise HTTPException(status_code=403, detail="No puedes cambiar el correo de un usuario existente")

    role = get_role_by_name(db, role_name)
    if not role:
        raise HTTPException(status_code=400, detail="Rol inválido")

    user = update_user_db(
        db,
        user,
        email,  # aunque no cambia, se mantiene
        full_name,
        getattr(role, "role_id")
    )

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": role_name,
        "is_active": user.is_active
    }


# ============================
# Eliminar usuario
# ============================
def delete_user_service(db: Session, user_id: int, merchant_id: int, current_user: dict):
    user = get_user_by_id(db, user_id)
    actor = get_user_by_id(db, int(current_user["sub"]))

    if user is None or getattr(user, "merchant_id") != merchant_id:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if actor is None:
        raise HTTPException(status_code=401, detail="Usuario actual no encontrado")

    if getattr(actor, "id") == getattr(user, "id"):
        raise HTTPException(status_code=403, detail="No puedes eliminar tu propio usuario")

    # Solo superadmins permitidos pueden eliminar admins
    if bool(getattr(user.role, "is_admin")) and not is_superadmin_email(getattr(actor, "email", None)):
        raise HTTPException(status_code=403, detail="Solo los superadmins pueden eliminar un usuario administrador")

    delete_user_db(db, user)

    return {"deleted": True}










def _sanitize_text(value: str) -> str:
    return (
        value.strip()
        .replace("<", "")
        .replace(">", "")
        .replace("javascript:", "")
    )


def _normalize_email(email: str) -> str:
    return _sanitize_text(email).lower()


def _validate_email(email: str) -> str:
    normalized_email = _normalize_email(email)

    if not normalized_email:
        raise HTTPException(status_code=400, detail="Correo electrónico es requerido")

    if len(normalized_email) > 254:
        raise HTTPException(status_code=400, detail="Correo electrónico demasiado largo")

    if not EMAIL_REGEX.match(normalized_email):
        raise HTTPException(status_code=400, detail="Correo electrónico inválido")

    return normalized_email


def _validate_full_name(full_name: str) -> str:
    clean_name = " ".join(_sanitize_text(full_name).split())

    if not clean_name:
        raise HTTPException(status_code=400, detail="Nombre completo es requerido")

    if len(clean_name) < 2:
        raise HTTPException(status_code=400, detail="Nombre completo demasiado corto")

    if len(clean_name) > 120:
        raise HTTPException(status_code=400, detail="Nombre completo demasiado largo")

    return clean_name


def _validate_role(role: str) -> str:
    clean_role = _sanitize_text(role)

    if not clean_role:
        raise HTTPException(status_code=400, detail="Rol es requerido")

    if len(clean_role) > 50:
        raise HTTPException(status_code=400, detail="Rol inválido")

    return clean_role


def _validate_password(password: str) -> str:
    if not password:
        raise HTTPException(status_code=400, detail="Contraseña es requerida")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Se necesitan al menos 8 caracteres")

    if len(password) > 72:
        raise HTTPException(status_code=400, detail="Contraseña demasiado larga")

    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Debe contener al menos un número")

    if not re.search(r"[a-zA-Z]", password):
        raise HTTPException(status_code=400, detail="Debe contener al menos una letra")

    return password
