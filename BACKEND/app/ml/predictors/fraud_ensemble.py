from app.ml.predictors.fraud_model import predict_fraud as predict_logistic
from app.ml.predictors.random_forest_model import predict_fraud_rf
from app.ml.utils.feature_engineering import (
    build_logistic_features,
    build_rf_features,
    validate_required_fields,
)

REQUIRED_FIELDS = [
    "amount",
    "amount_vs_avg",
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international",
    "risk_score_rule",
]

def predict_fraud_combined(tx_features: dict):
    # Validación defensiva
    validate_required_fields(tx_features, REQUIRED_FIELDS)
    
    
    # Construcción de features por modelo
    logistic_features = build_logistic_features(tx_features)
    rf_features = build_rf_features(tx_features)

    _, rf_prob = predict_fraud_rf(rf_features)
    _, log_prob = predict_logistic(logistic_features)

    # Ensemble ponderado
    final_score = (0.7 * rf_prob) + (0.3 * log_prob)
    label = int(final_score >= 0.6)

    return {
        "label": label,
        "final_score": final_score,
        "rf_probability": rf_prob,
        "logistic_probability": log_prob
    }
