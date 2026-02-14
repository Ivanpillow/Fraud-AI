from sqlalchemy import (
    Column, BigInteger, Numeric, String,
    Boolean, TIMESTAMP
)
from sqlalchemy.sql import func
from app.db.base import Base

class FraudPrediction(Base):
    __tablename__ = "fraud_predictions"

    prediction_id = Column(BigInteger, primary_key=True)
    transaction_id = Column(BigInteger, nullable=False)  # ID de transacción (card o QR)
    channel = Column(String(10), nullable=False)  # "card" o "qr" - indica de cuál tabla es

    model_version = Column(String(20))
    fraud_probability = Column(Numeric(5,4))
    prediction_label = Column(Boolean)
    risk_score_rule = Column(Numeric(5,4))
    decision = Column(String(10))

    created_at = Column(TIMESTAMP, server_default=func.now())

    rf_probability = Column(Numeric(6,5))
    logistic_probability = Column(Numeric(6,5))
    kmeans_score = Column(Numeric(6,5))
    
    # NOTA: No hay FK directa porque puede apuntar a transactions o qr_transactions
    # El campo 'channel' especifica a cuál tabla pertenece el transaction_id