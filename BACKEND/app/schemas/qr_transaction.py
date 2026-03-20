from pydantic import BaseModel, Field, field_validator
from typing import Optional


class QRTransactionCreate(BaseModel):
    transaction_id: Optional[int] = None
    user_id: int = Field(gt=0)
    amount: float = Field(gt=0)

    merchant_id: int = Field(gt=0)

    country: str = Field(min_length=2, max_length=2)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    hour: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)

    device_change_flag: Optional[bool] = False

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.upper().strip()


class QRTransactionRawCreate(BaseModel):
    transaction_id: Optional[int] = None
    user_id: int = Field(gt=0)
    amount: float = Field(gt=0)

    merchant_id: int = Field(gt=0)
    country: str = Field(min_length=2, max_length=2)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    device_change_flag: Optional[bool] = False
    hour: Optional[int] = Field(default=None, ge=0, le=23)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.upper().strip()
