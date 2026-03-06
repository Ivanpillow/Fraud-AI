from sqlalchemy import Column, BigInteger, String, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.db.base import Base


class APIKey(Base):
    __tablename__ = "api_keys"

    api_key_id = Column(BigInteger, primary_key=True)

    merchant_id = Column(
        BigInteger,
        ForeignKey("merchants.merchant_id"),
        nullable=False,
        index=True
    )

    key_hash = Column(String(255), nullable=False)

    label = Column(String(100))

    status = Column(String(20), default="active")

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())