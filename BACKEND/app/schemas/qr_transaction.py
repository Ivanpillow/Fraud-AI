from pydantic import BaseModel, Field, field_validator
from typing import Optional


class QRTransactionCreate(BaseModel):
    transaction_id: Optional[int] = None
    user_id: Optional[int] = Field(default=None, gt=0)
    card_number: Optional[str] = Field(default=None, description="PAN solo dígitos o con espacios; identifica al titular en users")
    amount: float = Field(gt=0)

    country: str = Field(min_length=2, max_length=2)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    hour: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=1, le=7)

    device_change_flag: Optional[bool] = False
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
    def digits_only_card(cls, value: object) -> Optional[str]:
        if value is None:
            return None
        digits = "".join(char for char in str(value) if char.isdigit())
        return digits or None

    @field_validator("card_number")
    @classmethod
    def card_length(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        if len(value) < 13 or len(value) > 19:
            raise ValueError("El número de tarjeta debe tener entre 13 y 19 dígitos")
        return value

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.upper().strip()


class QRTransactionRawCreate(BaseModel):
    transaction_id: Optional[int] = None
    user_id: Optional[int] = Field(default=None, gt=0)
    card_number: Optional[str] = Field(default=None, description="PAN solo dígitos o con espacios; identifica al titular en users")
    amount: float = Field(gt=0)

    country: str = Field(min_length=2, max_length=2)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    device_change_flag: Optional[bool] = False
    hour: Optional[int] = Field(default=None, ge=0, le=23)
    day_of_week: Optional[int] = Field(default=None, ge=1, le=7)
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
    def digits_only_card(cls, value: object) -> Optional[str]:
        if value is None:
            return None
        digits = "".join(char for char in str(value) if char.isdigit())
        return digits or None

    @field_validator("card_number")
    @classmethod
    def card_length(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        if len(value) < 13 or len(value) > 19:
            raise ValueError("El número de tarjeta debe tener entre 13 y 19 dígitos")
        return value

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str) -> str:
        return value.upper().strip()
