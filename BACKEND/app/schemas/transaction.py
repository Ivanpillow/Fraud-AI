from pydantic import BaseModel, Field, field_validator
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
    shipping_country: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    shipping_street: Optional[str] = None
    shipping_reference: Optional[str] = None
    shipping_full_name: Optional[str] = None
    shipping_phone: Optional[str] = None

class TransactionResponse(TransactionCreate):
    is_fraud: bool


class TransactionRawCreate(BaseModel):
    transaction_id: Optional[int] = None
    card_number: str = Field(..., description="PAN solo dígitos o con espacios; identifica al titular en users")
    amount: float
    merchant_category: str
    country: str
    device_type: str
    hour: Optional[int] = None
    day_of_week: Optional[int] = None
    shipping_country: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    shipping_street: Optional[str] = None
    shipping_reference: Optional[str] = None
    shipping_full_name: Optional[str] = None
    shipping_phone: Optional[str] = None

    @field_validator("card_number", mode="before")
    @classmethod
    def digits_only_card(cls, v: object) -> str:
        s = "".join(c for c in str(v or "") if c.isdigit())
        return s

    @field_validator("card_number")
    @classmethod
    def card_length(cls, v: str) -> str:
        if len(v) < 13 or len(v) > 19:
            raise ValueError("El número de tarjeta debe tener entre 13 y 19 dígitos")
        return v