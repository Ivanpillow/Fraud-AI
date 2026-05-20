from typing import List, Literal
from pydantic import BaseModel, Field

QrSessionStatus = Literal["pending", "cancelled", "completed", "returned"]


class QRSessionCard(BaseModel):
    id: str
    label: str
    card_number: str
    display_number: str
    created_at: str


class QRSessionCardCreate(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    card_number: str = Field(min_length=12, max_length=19)


class QRSessionCreate(BaseModel):
    transaction_id: int = Field(gt=0)
    status: QrSessionStatus = "pending"
    cards: List[QRSessionCard] = Field(default_factory=list)


class QRSessionUpdate(BaseModel):
    status: QrSessionStatus
