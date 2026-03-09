from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.auth import get_current_merchant
from app.schemas.qr_transaction import QRTransactionCreate, QRTransactionRawCreate
from app.services.qr_transaction_service import process_qr_transaction, process_qr_transaction_simple
from app.db.session import get_db

router = APIRouter (prefix="/qr-transactions", tags=["QR Transactions"])

@router.post("/")
def create_qr_transaction(
    tx: QRTransactionCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return process_qr_transaction(db, tx.dict(), merchant_id)

@router.post("/simple")
def create_qr_transaction_simple(
    tx: QRTransactionRawCreate,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return process_qr_transaction_simple(db, tx.dict(), merchant_id)
