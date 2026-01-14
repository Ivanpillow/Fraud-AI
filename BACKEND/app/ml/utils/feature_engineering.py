def build_logistic_features(tx: dict) -> dict:
    """
    Features para el modelo de regresión logística.
    Incluye señales graduales y heurísticas (risk_score_rule).
    """
    return {
        "amount": tx["amount"],
        "amount_vs_avg": tx["amount_vs_avg"],
        "transactions_last_24h": tx["transactions_last_24h"],
        "hour": tx["hour"],
        "day_of_week": tx["day_of_week"],
        "failed_attempts": tx["failed_attempts"],
        "is_international": tx["is_international"],
        "risk_score_rule": tx["risk_score_rule"],
    }


def build_rf_features(tx: dict) -> dict:
    """
    Features para el Random Forest.
    SOLO comportamiento fuerte (sin reglas heurísticas).
    """
    return {
        "amount_vs_avg": tx["amount_vs_avg"],
        "transactions_last_24h": tx["transactions_last_24h"],
        "hour": tx["hour"],
        "day_of_week": tx["day_of_week"],
        "failed_attempts": tx["failed_attempts"],
        "is_international": tx["is_international"],
    }


def validate_required_fields(tx: dict, required_fields: list):
    """
    Validación defensiva para evitar errores silenciosos.
    """
    missing = [f for f in required_fields if f not in tx]
    if missing:
        raise ValueError(f"Faltan campos requeridos para ML: {missing}")