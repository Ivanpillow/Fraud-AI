from sqlalchemy import Column, BigInteger, Float, String, TIMESTAMP, Numeric
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True)
    country = Column(String(5))
    avg_amount_user = Column(Numeric(12,2))
    risk_profile = Column(String(10))
    created_at = Column(TIMESTAMP, server_default=func.now())