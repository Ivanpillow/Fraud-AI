from sqlalchemy import Column, BigInteger, String, ForeignKey, Boolean
from app.db.base import Base
from sqlalchemy.orm import relationship

class Role(Base):
    __tablename__ = "roles"

    role_id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    is_admin = Column(Boolean, default=False)
    merchant_id = Column(BigInteger, ForeignKey("merchants.merchant_id"), nullable=False)

    users = relationship("AuthUser", back_populates="role")
    merchant = relationship("Merchant", back_populates="roles")