from fastapi import Cookie, Header, HTTPException, Depends
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.api_keys import APIKey
from app.core.config import settings
from app.core.security import verify_access_token
import hashlib

def get_current_merchant(
    x_api_key: str = Header(...),
    db: Session = Depends(get_db)
):

    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()

    api_key = (
        db.query(APIKey)
        .filter(APIKey.key_hash == key_hash)
        .filter(APIKey.status == "active")
        .first()
    )

    if not api_key:
        raise HTTPException(status_code=401, detail="Comercio No Validado")

    return api_key.merchant_id

def get_current_user(
    accessToken: str = Cookie(None)
):

    if not accessToken:
        raise HTTPException(status_code=401, detail="No autenticado")

    payload = verify_access_token(accessToken)

    return payload
    

def get_current_merchant_from_user(
    user: dict = Depends(get_current_user)
):
    return user["merchant_id"]