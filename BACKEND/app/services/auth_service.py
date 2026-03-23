from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import HTTPException, status

from app.queries.auth_queries import get_auth_user_by_email, get_auth_user_by_id
from app.core.security import create_access_token
from app.core.authorization import is_superadmin_email

ph = PasswordHasher()

def login_user(db, email: str, password: str):
    user = get_auth_user_by_email(db, email)

    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Solo bloquear cuando esté explícitamente desactivado.
    if user.is_active is False:
        raise HTTPException(status_code=403, detail="Tu usuario está desactivado")

    try:
        ph.verify(user.password_hash, password)
    except VerifyMismatchError:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role.name,
        "merchant_id": user.merchant_id,
        "is_admin": bool(user.role.is_admin),
        "is_superadmin": is_superadmin_email(user.email),
    })

    return {
        "accessToken": token,
        "userData": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.name,
            "merchant_id": user.merchant_id,
            "merchant_name": user.merchant.name,
            "is_admin": bool(user.role.is_admin),
            "is_superadmin": is_superadmin_email(user.email),
        }
    }


def update_user_profile(db, user_id: int, full_name: str):
    user = get_auth_user_by_id(db, user_id)
    
    if not user:
        raise ValueError("Usuario no encontrado")
    
    if not full_name or len(full_name.strip()) == 0:
        raise ValueError("El nombre completo no puede estar vacío")
    
    user.full_name = full_name.strip()
    db.commit()
    db.refresh(user)
    
    return user


def change_user_password(db, user_id: int, current_password: str, new_password: str):
    user = get_auth_user_by_id(db, user_id)
    
    if not user:
        raise ValueError("Usuario no encontrado")
    
    # Verificar contraseña actual
    try:
        ph.verify(user.password_hash, current_password)
    except VerifyMismatchError:
        raise ValueError("La contraseña actual es incorrecta")
    
    # Validar nueva contraseña
    if not new_password or len(new_password) < 8:
        raise ValueError("La nueva contraseña debe tener al menos 8 caracteres")
    
    if current_password == new_password:
        raise ValueError("La nueva contraseña debe ser diferente a la contraseña actual")
    
    # Hash la nueva contraseña
    user.password_hash = ph.hash(new_password)
    db.commit()
    db.refresh(user)
    
    return user