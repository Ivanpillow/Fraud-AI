from pydantic import BaseModel
from typing import Optional


class TransactionCreate(BaseModel):
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

class TransactionResponse(TransactionCreate):
    is_fraud: bool


class TransactionRawCreate(BaseModel):
    transaction_id: Optional[int] = None
    user_id: int
    amount: float
    merchant_category: str
    country: str
    device_type: str
    hour: Optional[int] = None
    day_of_week: Optional[int] = None