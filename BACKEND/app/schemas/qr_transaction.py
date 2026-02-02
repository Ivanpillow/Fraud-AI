from pydantic import BaseModel
from typing import Optional


class QRTransactionCreate(BaseModel):
    transaction_id: int
    user_id: int
    amount: float

    hour: int
    day_of_week: int

    merchant_id: int
    merchant_qr_risk: float   # score [0,1] externo o interno

    country: str
    latitude: float
    longitude: float

    qr_scans_last_24h: int
    device_change_flag: bool
    failed_attempts: int

    avg_amount_user: float
    amount_vs_avg: float

    risk_score_rule: float


class QRTransactionRawCreate(BaseModel):
    transaction_id: int
    user_id: int
    amount: float

    merchant_id: int
    country: str
    latitude: float
    longitude: float

    hour: Optional[int] = None
    day_of_week: Optional[int] = None
