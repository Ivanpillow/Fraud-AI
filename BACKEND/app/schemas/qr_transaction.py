from pydantic import BaseModel
from typing import Optional


class QRTransactionCreate(BaseModel):
    transaction_id: int
    user_id: int
    amount: float

    merchant_id: int

    country: str
    latitude: float
    longitude: float

    hour: int
    day_of_week: int

    device_change_flag: Optional[bool] = False


class QRTransactionRawCreate(BaseModel):
    transaction_id: int
    user_id: int
    amount: float

    merchant_id: int
    country: str
    latitude: float
    longitude: float

    device_change_flag: Optional[bool] = False
    hour: Optional[int] = None
    day_of_week: Optional[int] = None
