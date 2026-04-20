from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    Numeric,
    String,
    TIMESTAMP,
    ForeignKey,
    JSON,
)
from sqlalchemy.sql import func

from app.db.base import Base


class BCTransaction(Base):
    __tablename__ = "bc_transactions"

    payment_id = Column(BigInteger, primary_key=True)
    merchant_id = Column(
        BigInteger,
        ForeignKey("merchants.merchant_id"),
        nullable=False,
        index=True,
    )
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)

    amount = Column(Numeric(14, 2), nullable=False)
    fiat_currency = Column(String(5), nullable=False, default="MXN")

    asset_symbol = Column(String(12), nullable=False)
    network = Column(String(32), nullable=False)
    wallet_address = Column(String(160), nullable=True)

    provider = Column(String(64), nullable=False)
    provider_reference = Column(String(128), nullable=False, unique=True, index=True)

    status = Column(String(20), nullable=False, index=True, default="pending")
    status_reason = Column(String(120), nullable=True)

    tx_hash = Column(String(80), nullable=True)
    confirmations = Column(Integer, nullable=False, default=0)
    required_confirmations = Column(Integer, nullable=False, default=2)

    fraud_transaction_id = Column(BigInteger, nullable=True)
    fraud_decision = Column(String(20), nullable=True)
    fraud_probability = Column(Numeric(8, 6), nullable=True)

    request_payload = Column(JSON, nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    confirmed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    failed_at = Column(TIMESTAMP(timezone=True), nullable=True)
