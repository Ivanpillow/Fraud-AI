from sqlalchemy import (
    Column, BigInteger, Numeric, String,
    Boolean, TIMESTAMP, ForeignKey
)
from sqlalchemy.sql import func
from app.db.base import Base

class FraudPrediction(Base):
    __tablename__ = "fraud_predictions"

    prediction_id = Column(BigInteger, primary_key=True)
    transaction_id = Column(BigInteger, ForeignKey("transactions.transaction_id"))

    model_version = Column(String(20))
    fraud_probability = Column(Numeric(5,4))
    prediction_label = Column(Boolean)
    risk_score_rule = Column(Numeric(5,4))
    decision = Column(String(10))

    created_at = Column(TIMESTAMP, server_default=func.now())