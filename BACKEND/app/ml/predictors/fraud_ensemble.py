from app.ml.predictors.fraud_model import predict_fraud as predict_logistic
from app.ml.predictors.random_forest_model import predict_fraud_rf
from app.ml.predictors.kmeans_model import predict_kmeans_score
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
    "card_tx_last_24h",
    "qr_tx_last_24h",
]

def predict_fraud_combined(tx_features: dict):

    # Completar campos faltantes con 0 (o valor neutro)
    for key in REQUIRED_FIELDS:
        if key not in tx_features or tx_features[key] is None:
            tx_features[key] = 0

    # Validación defensiva
    validate_required_fields(tx_features, REQUIRED_FIELDS)
    
    # Obtener score KMeans
    kmeans_score = predict_kmeans_score(tx_features)
    tx_features["kmeans_score"] = kmeans_score
    
    #  Modelos supervisados y sus features
    logistic_features = build_logistic_features(tx_features)
    rf_features = build_rf_features(tx_features)

    _, rf_prob = predict_fraud_rf(rf_features)
    _, log_prob = predict_logistic(logistic_features)

    # Ensemble ponderado
    final_score = (
        0.6 * rf_prob + 
        0.25 * log_prob +
        0.15 * kmeans_score
    )
    label = int(final_score >= 0.6)
    
    print(f"Ensemble Prediction - RF: {rf_prob:.4f}, Logistic: {log_prob:.4f}, KMeans: {kmeans_score:.4f} => Final Score: {final_score:.4f}, Label: {label}")

    return {
        "label": label,
        "final_score": round(final_score, 4),
        "rf_probability": rf_prob,
        "logistic_probability": log_prob,
        "kmeans_score": kmeans_score
    }
