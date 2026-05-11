def build_logistic_features(tx: dict) -> dict:
    """
    Features para el modelo de regresión logística.
    Incluye señales graduales y heurísticas (risk_score_rule).
    """
    return {
        "amount": tx["amount"],
        "amount_vs_avg": tx["amount_vs_avg"],
        "amount_vs_user_max": tx.get("amount_vs_user_max", 0),
        "amount_vs_user_p95": tx.get("amount_vs_user_p95", 0),
        "amount_vs_merchant_avg": tx.get("amount_vs_merchant_avg", 0),
        "amount_vs_user_merchant_avg": tx.get("amount_vs_user_merchant_avg", 0),
        "transactions_last_24h": tx["transactions_last_24h"],
        "card_tx_last_24h": tx.get("card_tx_last_24h", 0),
        "qr_tx_last_24h": tx.get("qr_tx_last_24h", 0),
        "hour": tx["hour"],
        "day_of_week": tx["day_of_week"],
        "failed_attempts": tx["failed_attempts"],
        "is_international": tx["is_international"],
        "user_history_count": tx.get("user_history_count", 0),
        "merchant_history_count": tx.get("merchant_history_count", 0),
        "user_merchant_history_count": tx.get("user_merchant_history_count", 0),
    }


def build_rf_features(tx: dict) -> dict:
    """
    Features para el Random Forest.
    SOLO comportamiento fuerte (sin reglas heurísticas).
    """
    return {
        "amount_vs_avg": tx["amount_vs_avg"],
        "transactions_last_24h": tx["transactions_last_24h"],
        "amount_vs_user_max": tx.get("amount_vs_user_max", 0),
        "amount_vs_user_p95": tx.get("amount_vs_user_p95", 0),
        "amount_vs_merchant_avg": tx.get("amount_vs_merchant_avg", 0),
        "amount_vs_user_merchant_avg": tx.get("amount_vs_user_merchant_avg", 0),
        "card_tx_last_24h": tx.get("card_tx_last_24h", 0),
        "qr_tx_last_24h": tx.get("qr_tx_last_24h", 0),
        "hour": tx["hour"],
        "day_of_week": tx["day_of_week"],
        "failed_attempts": tx["failed_attempts"],
        "is_international": tx["is_international"],
        "user_history_count": tx.get("user_history_count", 0),
        "merchant_history_count": tx.get("merchant_history_count", 0),
        "user_merchant_history_count": tx.get("user_merchant_history_count", 0),
    }


def validate_required_fields(tx: dict, required_fields: list):
    """
    Validación defensiva para evitar errores silenciosos.
    """
    missing = [f for f in required_fields if f not in tx]
    if missing:
        raise ValueError(f"Faltan campos requeridos para ML: {missing}")