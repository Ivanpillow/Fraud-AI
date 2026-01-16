from sqlalchemy import (
    Column,
    BigInteger,
    Boolean,
    String,
    TIMESTAMP,
    ForeignKey
)
from sqlalchemy.sql import func
from app.db.base import Base

class FraudFeedback(Base):
    __tablename__ = "fraud_feedback"

    feedback_id = Column(BigInteger, primary_key=True, index=True)
    prediction_id = Column(
        BigInteger,
        ForeignKey("fraud_predictions.prediction_id", ondelete="CASCADE"),
        nullable=False
    )

    final_label = Column(Boolean, nullable=False)
    source = Column(String(20), nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now())
