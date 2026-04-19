from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.auth import get_current_merchant
from app.schemas.bc_transaction import BCTransactionCreate, BCTransactionRawCreate
from app.services.bc_transaction_service import process_bc_transaction, process_bc_transaction_simple
from app.db.session import get_db

router = APIRouter(prefix="/bc-transactions", tags=["Blockchain Transactions"])


@router.post("/")
def create_bc_transaction(
    tx: BCTransactionCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    return process_bc_transaction(db, tx.dict(), merchant_id)


@router.post("/simple")
def create_bc_transaction_simple(
    tx: BCTransactionRawCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db),
):
    return process_bc_transaction_simple(db, tx.dict(), merchant_id)
