from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.auth import get_current_merchant
from app.schemas.transaction import TransactionCreate,TransactionRawCreate
from app.services.transaction_service import process_transaction, process_transaction_simple
from app.db.session import get_db

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/")
def create_transaction(
    tx: TransactionCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return process_transaction(db, tx.dict(), merchant_id)

@router.post("/simple")
def create_transaction_simple(
    tx: TransactionRawCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return process_transaction_simple(db, tx.dict(), merchant_id)

