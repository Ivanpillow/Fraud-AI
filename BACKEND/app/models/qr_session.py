from sqlalchemy import Column, BigInteger, String, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base


class QRSession(Base):
    __tablename__ = "qr_sessions"

    transaction_id = Column(BigInteger, primary_key=True)
    merchant_id = Column(
        BigInteger,
        ForeignKey("merchants.merchant_id"),
        nullable=False,
        index=True,
    )
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
