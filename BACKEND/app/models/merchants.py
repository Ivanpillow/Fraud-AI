from sqlalchemy import Column, BigInteger, String, TIMESTAMP
from sqlalchemy.sql import func
from app.db.base import Base


class Merchant(Base):
    __tablename__ = "merchants"

    merchant_id = Column(BigInteger, primary_key=True)

    name = Column(String(120), nullable=False)

    status = Column(String(20), default="active")

    plan_type = Column(String(20), default="basic")

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())