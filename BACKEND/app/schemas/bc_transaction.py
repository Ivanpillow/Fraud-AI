from pydantic import BaseModel
from typing import Optional


class BCTransactionCreate(BaseModel):
    transaction_id: Optional[int] = None
    user_id: int
    amount: float
    hour: int
    day_of_week: int
    merchant_category: str
    country: str
    is_international: bool
    device_type: str
    amount_vs_avg: float


class BCTransactionRawCreate(BaseModel):
    transaction_id: Optional[int] = None
    user_id: int
    amount: float
    merchant_category: str
    country: str
    device_type: str
    hour: Optional[int] = None
    day_of_week: Optional[int] = None
