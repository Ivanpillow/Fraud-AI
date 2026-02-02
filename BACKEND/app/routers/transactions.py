from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.transaction import TransactionCreate,TransactionRawCreate
from app.services.transaction_service import process_transaction, process_transaction_simple
from app.db.session import get_db

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/")
def create_transaction(
    tx: TransactionCreate,
    db: Session = Depends(get_db)
):
    return process_transaction(db, tx.dict())

@router.post("/simple")
def create_transaction_simple(
    tx: TransactionRawCreate,
    db: Session = Depends(get_db)
):
    return process_transaction_simple(db, tx.dict())

