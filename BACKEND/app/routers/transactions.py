from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.transaction import TransactionCreate
from app.services.transaction_service import process_transaction
from app.db.session import get_db

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/")
def create_transaction(tx: TransactionCreate, db: Session = Depends(get_db)):
    return process_transaction(db, tx.dict())