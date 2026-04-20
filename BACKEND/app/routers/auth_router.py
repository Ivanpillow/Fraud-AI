from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.auth_service import login_user, update_user_profile, change_user_password
from app.core.dependencies import get_current_user
from app.schemas.auth import LoginRequest, UpdateProfileRequest, ChangePasswordRequest
from app.queries.auth_queries import get_auth_user_by_id
from app.core.security import verify_access_token
from app.core.authorization import is_superadmin_email
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    result = login_user(db, payload.email, payload.password)

    cookie_domain = settings.COOKIE_DOMAIN.strip() or None
    samesite_value = (settings.COOKIE_SAMESITE or "lax").lower().strip()
    if samesite_value not in {"lax", "strict", "none"}:
        samesite_value = "lax"

    response.set_cookie(
        key="accessToken",
        value=result["accessToken"],
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=samesite_value,
        path="/",
        domain=cookie_domain,
    )

    return {
        "userData": result["userData"]
    }


@router.post("/logout")
def logout(response: Response):
    cookie_domain = settings.COOKIE_DOMAIN.strip() or None

    response.delete_cookie(
        key="accessToken",
        path="/",
        domain=cookie_domain,
    )
    return {"ok": True}


@router.get("/me")
def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")

    if not token:
        raise HTTPException(status_code=401)

    payload = verify_access_token(token) 

    user = get_auth_user_by_id(db, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401)

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.name,
        "is_admin": bool(user.role.is_admin),
        "is_superadmin": is_superadmin_email(user.email),
        "merchant_name": user.merchant.name,
    }


@router.put("/profile")
def update_profile(payload: UpdateProfileRequest, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")

    if not token:
        raise HTTPException(status_code=401)

    payload_data = verify_access_token(token) 
    user_id = int(payload_data["sub"])

    user = get_auth_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401)

    try:
        updated_user = update_user_profile(db, user_id, payload.full_name)
        return {
            "id": updated_user.id,
            "email": updated_user.email,
            "full_name": updated_user.full_name,
            "role": updated_user.role.name,
            "is_admin": bool(updated_user.role.is_admin),
            "is_superadmin": is_superadmin_email(updated_user.email),
            "merchant_name": updated_user.merchant.name,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("accessToken")

    if not token:
        raise HTTPException(status_code=401)

    payload_data = verify_access_token(token) 
    user_id = int(payload_data["sub"])

    user = get_auth_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401)

    try:
        change_user_password(db, user_id, payload.current_password, payload.new_password)
        return {"message": "Contraseña actualizada exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al cambiar la contraseña")