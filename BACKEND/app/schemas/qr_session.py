from typing import Literal
from pydantic import BaseModel, Field


QrSessionStatus = Literal["pending", "cancelled", "completed", "returned"]


class QRSessionCreate(BaseModel):
    transaction_id: int = Field(gt=0)
    status: QrSessionStatus = "pending"


class QRSessionUpdate(BaseModel):
    status: QrSessionStatus
