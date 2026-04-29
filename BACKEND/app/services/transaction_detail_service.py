from sqlalchemy.orm import Session

from app.models.user_transaction_details import UserTransactionDetails


def _first_non_empty(*values: object) -> str | None:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return None


def save_user_transaction_details(
    db: Session,
    tx_data: dict,
    transaction_id: int,
    user_id: int,
    channel: str,
) -> None:
    shipping_details = {
        "country": _first_non_empty(
            tx_data.get("shipping_country"),
            tx_data.get("shippingCountry"),
            tx_data.get("country"),
        ),
        "state": _first_non_empty(
            tx_data.get("shipping_state"),
            tx_data.get("shippingState"),
        ),
        "city": _first_non_empty(
            tx_data.get("shipping_city"),
            tx_data.get("shippingCity"),
        ),
        "postal_code": _first_non_empty(
            tx_data.get("shipping_postal_code"),
            tx_data.get("shippingZip"),
            tx_data.get("shipping_zip"),
        ),
        "street": _first_non_empty(
            tx_data.get("shipping_street"),
            tx_data.get("shippingStreet"),
            tx_data.get("shipping_address"),
            tx_data.get("shippingAddress"),
        ),
        "reference": _first_non_empty(
            tx_data.get("shipping_reference"),
            tx_data.get("shippingReference"),
        ),
        "full_name": _first_non_empty(
            tx_data.get("shipping_full_name"),
            tx_data.get("shippingName"),
        ),
        "phone": _first_non_empty(
            tx_data.get("shipping_phone"),
            tx_data.get("shippingPhone"),
        ),
    }

    has_data = any(value is not None for value in shipping_details.values())
    if not has_data:
        return

    existing = (
        db.query(UserTransactionDetails)
        .filter(UserTransactionDetails.transaction_id == transaction_id)
        .filter(UserTransactionDetails.channel == channel)
        .first()
    )

    if existing:
        for field_name, value in shipping_details.items():
            if value is not None:
                setattr(existing, field_name, value)
        db.flush()
        return

    db.add(
        UserTransactionDetails(
            user_id=user_id,
            transaction_id=transaction_id,
            channel=channel,
            **shipping_details,
        )
    )
    db.flush()
