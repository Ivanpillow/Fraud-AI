from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import HTTPException, status

from app.queries.auth_queries import get_auth_user_by_email
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
            "is_admin": bool(user.role.is_admin),
            "is_superadmin": is_superadmin_email(user.email),
        }
    }