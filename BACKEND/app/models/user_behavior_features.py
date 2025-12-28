from sqlalchemy import Column, BigInteger, Integer, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class UserBehaviorFeatures(Base):
    __tablename__ = "user_behavior_features"

    user_id = Column(BigInteger, ForeignKey("users.user_id"), primary_key=True)

    transactions_last_24h = Column(Integer)
    failed_attempts = Column(Integer)
    amount_vs_avg = Column(Numeric(6,2))

    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())