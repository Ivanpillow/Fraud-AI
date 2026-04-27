from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.core.auth import get_current_merchant
from app.schemas.qr_transaction import QRTransactionCreate, QRTransactionRawCreate
from app.services.qr_transaction_service import process_qr_transaction, process_qr_transaction_simple
from app.db.session import get_db
from app.models.qr_transaction import QRTransaction
from app.models.fraud_prediction import FraudPrediction

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

@router.get("/{transaction_id}")
def get_qr_transaction_result(
    transaction_id: int,
    merchant_id: int = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Obtiene el resultado de una transacción QR por su ID.
    Retorna el resultado de la predicción de fraude.
    """
    qr_tx = db.query(QRTransaction).filter(
        and_(
            QRTransaction.transaction_id == transaction_id,
            QRTransaction.merchant_id == merchant_id
        )
    ).first()
    
    if not qr_tx:
        raise HTTPException(status_code=404, detail="Transacción QR no encontrada")
    
    fraud_pred = db.query(FraudPrediction).filter(
        FraudPrediction.transaction_id == transaction_id
    ).first()
    
    if not fraud_pred:
        raise HTTPException(status_code=404, detail="Predicción de fraude no encontrada")
    
    return {
        "transaction_id": qr_tx.transaction_id,
        "fraud_probability": float(fraud_pred.fraud_probability),
        "decision": fraud_pred.decision,
        "model_scores": {
            "random_forest": float(fraud_pred.rf_probability),
            "logistic_regression": float(fraud_pred.logistic_probability),
            "kmeans_anomaly": float(fraud_pred.kmeans_score)
        },
        "created_at": qr_tx.created_at
    }
