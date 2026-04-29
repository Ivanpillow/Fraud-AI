from sqlalchemy import Column, BigInteger, String, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class UserTransactionDetails(Base):
    __tablename__ = "user_transaction_details"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False,
        index=True
    )

    transaction_id = Column(BigInteger, nullable=False, index=True)
    channel = Column(String(10), nullable=False)

    country = Column(String(100))
    state = Column(String(100))
    city = Column(String(100))
    postal_code = Column(String(20))
    street = Column(String(150))
    reference = Column(String(150))
    full_name = Column(String(150))
    phone = Column(String(20))

    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User")