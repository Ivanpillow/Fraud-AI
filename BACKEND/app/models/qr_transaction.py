from sqlalchemy import (
    Column,
    BigInteger,
    Numeric,
    String,
    Boolean,
    Float,
    TIMESTAMP,
    ForeignKey
)
from sqlalchemy.sql import func
from app.db.base import Base


class QRTransaction(Base):
    __tablename__ = "qr_transactions"

    transaction_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    merchant_id = Column(BigInteger, nullable=False)

    amount = Column(Numeric(14, 2))
    country = Column(String(5))

    latitude = Column(Float)
    longitude = Column(Float)

    hour = Column(BigInteger)
    day_of_week = Column(BigInteger)

    device_change_flag = Column(Boolean, default=False)
    qr_scans_last_24h = Column(BigInteger, default=0)
    failed_attempts = Column(BigInteger, default=0)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
