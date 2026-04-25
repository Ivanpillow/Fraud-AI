from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.auth import get_current_merchant
from app.schemas.transaction import TransactionCreate, TransactionRawCreate
from app.services.transaction_service import process_transaction, process_transaction_simple
from app.db.session import get_db

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/")
def create_transaction(
    tx: TransactionCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    try:
        return process_transaction(db, tx.model_dump(), merchant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/simple")
def create_transaction_simple(
    tx: TransactionRawCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    try:
        return process_transaction_simple(db, tx.model_dump(), merchant_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Conflicto al guardar el perfil (tarjeta duplicada o restricción en base de datos).",
        ) from None

