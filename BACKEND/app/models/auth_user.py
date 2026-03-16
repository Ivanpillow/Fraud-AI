from sqlalchemy import (
    Column, BigInteger, String, Text,
    Boolean, TIMESTAMP, ForeignKey, func
)
from sqlalchemy.orm import relationship
from app.db.base import Base

class AuthUser(Base):
    __tablename__ = "auth_users"

    id = Column(BigInteger, primary_key=True)

    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    full_name = Column(String(150), nullable=False)

    role_id = Column(
        BigInteger,
        ForeignKey("roles.role_id"),
        nullable=False
    )

    merchant_id = Column(
        BigInteger,
        ForeignKey("merchants.merchant_id"),
        nullable=False,
        index=True
    )

    is_active = Column(Boolean, default=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    role = relationship("Role", back_populates="users")
    merchant = relationship("Merchant", back_populates="users")