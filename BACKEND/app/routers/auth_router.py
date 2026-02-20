from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.auth_service import login_user
from app.core.dependencies import get_current_user
from app.schemas.auth import LoginRequest
from app.queries.auth_queries import get_auth_user_by_id
from app.core.security import verify_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    result = login_user(db, payload.email, payload.password)

    response.set_cookie(
        key="accessToken",
        value=result["accessToken"],
        httponly=True,
        secure=False,      # True en produccion con HTTPS
        samesite="lax",
        path="/"
    )

    return {
        "userData": result["userData"]
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="accessToken",
        path="/"
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
        "role": user.role.name
    }