from sqlalchemy import (
    Column, BigInteger, Numeric, String,
    Boolean, SmallInteger, TIMESTAMP, ForeignKey
)
from app.db.base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"))
    merchant_id = Column(BigInteger)

    amount = Column(Numeric(14,2))
    currency = Column(String(5))
    timestamp = Column(TIMESTAMP)

    hour = Column(SmallInteger)
    day_of_week = Column(SmallInteger)

    country = Column(String(5))
    is_international = Column(Boolean)
    device_type = Column(String(10))