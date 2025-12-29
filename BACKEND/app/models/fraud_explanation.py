from sqlalchemy import Column, BigInteger, Numeric, String, ForeignKey
from app.db.base import Base

class FraudExplanation(Base):
    __tablename__ = "fraud_explanations"

    explanation_id = Column(BigInteger, primary_key=True)
    prediction_id = Column(BigInteger, ForeignKey("fraud_predictions.prediction_id"))

    feature_name = Column(String(50))
    contribution_value = Column(Numeric(8,5))
    direction = Column(String(10))