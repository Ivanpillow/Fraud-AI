from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class BCTransactionCreate(BaseModel):
    transaction_id: Optional[int] = None
    user_id: int = Field(gt=0)
    amount: float = Field(gt=0)
    hour: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=1, le=7)
    merchant_category: str
    country: str = Field(min_length=2, max_length=2)
    is_international: bool
    device_type: str
    amount_vs_avg: float = Field(gt=0)
    asset_symbol: str = Field(default="BTC", min_length=2, max_length=12)
    network: str = Field(default="Bitcoin", min_length=2, max_length=32)
    wallet_address: Optional[str] = Field(default=None, max_length=160)
    shipping_country: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    shipping_street: Optional[str] = None
    shipping_reference: Optional[str] = None
    shipping_full_name: Optional[str] = None
    shipping_phone: Optional[str] = None

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.upper().strip()


class BCTransactionRawCreate(BaseModel):
    transaction_id: Optional[int] = None
    user_id: int = Field(gt=0)
    amount: float = Field(gt=0)
    merchant_category: str
    country: str = Field(min_length=2, max_length=2)
    device_type: str
    hour: Optional[int] = Field(default=None, ge=0, le=23)
    day_of_week: Optional[int] = Field(default=None, ge=1, le=7)
    asset_symbol: str = Field(default="BTC", min_length=2, max_length=12)
    network: str = Field(default="Bitcoin", min_length=2, max_length=32)
    wallet_address: Optional[str] = Field(default=None, max_length=160)
    shipping_country: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    shipping_street: Optional[str] = None
    shipping_reference: Optional[str] = None
    shipping_full_name: Optional[str] = None
    shipping_phone: Optional[str] = None

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.upper().strip()


class BCFraudResult(BaseModel):
    transaction_id: int
    fraud_probability: float
    decision: str
    model_scores: dict[str, float]
    explanations: Optional[Any] = None


class BCPaymentStatusResponse(BaseModel):
    payment_id: int
    provider: str
    provider_reference: str
    status: str
    status_reason: Optional[str] = None
    amount: float
    fiat_currency: str
    asset_symbol: str
    network: str
    tx_hash: Optional[str] = None
    confirmations: int
    required_confirmations: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    fraud_result: Optional[BCFraudResult] = None


class BCWebhookFraudResult(BaseModel):
    transaction_id: int
    fraud_probability: float
    decision: str
    model_scores: dict[str, float]
    explanations: Optional[Any] = None


class BCWebhookEvent(BaseModel):
    event_type: str
    payment_id: int
    provider: str
    provider_reference: str
    status: str
    status_reason: Optional[str] = None
    tx_hash: Optional[str] = None
    confirmations: Optional[int] = None
    required_confirmations: Optional[int] = None
    fraud_result: Optional[BCWebhookFraudResult] = None
