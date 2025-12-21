from sqlalchemy import Column, Integer, Float, String, Boolean
from app.db.base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)

    amount = Column(Float)
    hour = Column(Integer)
    day_of_week = Column(Integer)

    merchant_category = Column(String)
    country = Column(String)
    is_international = Column(Boolean)

    device_type = Column(String)

    transactions_last_24h = Column(Integer)
    avg_amount_user = Column(Float)
    amount_vs_avg = Column(Float)

    failed_attempts = Column(Integer)
    risk_score_rule = Column(Float)

    is_fraud = Column(Boolean)