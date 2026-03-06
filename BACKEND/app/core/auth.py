from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.api_keys import APIKey
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