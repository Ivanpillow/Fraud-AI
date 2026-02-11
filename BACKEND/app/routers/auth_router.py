from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.auth_service import login_user
from app.core.dependencies import get_current_user
from app.schemas.auth import LoginRequest

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
def me(user=Depends(get_current_user)):
    return {
        "userData": {
            "id": user["sub"],
            "role": user["role"]
        },
        "userAbilityRules": [
            {"action": "manage", "subject": "all"}
        ]
    }