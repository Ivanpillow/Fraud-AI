from sqlalchemy import Column, BigInteger, ForeignKey, Numeric, JSON
from app.db.base import Base


class MerchantConfig(Base):
    __tablename__ = "merchant_config"

    merchant_id = Column(
        BigInteger,
        ForeignKey("merchants.merchant_id"),
        primary_key=True
    )

    allow_threshold = Column(Numeric(5,4), default=0.40)

    review_threshold = Column(Numeric(5,4), default=0.65)

    block_threshold = Column(Numeric(5,4), default=0.85)

    rules_config = Column(JSON)