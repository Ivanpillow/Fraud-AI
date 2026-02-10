from sqlalchemy import Column, BigInteger, String
from app.db.base import Base

class Role(Base):
    __tablename__ = "roles"

    role_id = Column(BigInteger, primary_key=True)
    name = Column(String(50), nullable=False)