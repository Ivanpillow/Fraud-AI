import os
import numpy as np
import joblib

from app.ml.predictors.fraud_model import predict_fraud as predict_logistic
from app.ml.predictors.random_forest_model import predict_fraud_rf
from app.ml.predictors.kmeans_model import predict_kmeans_score
from app.ml.utils.feature_engineering import (
    build_logistic_features,
    build_rf_features,
)
from app.core.config import settings

BASE_DIR = os.path.dirname(__file__)
PARENT_DIR = os.path.dirname(BASE_DIR)

meta_model = joblib.load(os.path.join(PARENT_DIR, "stacking_model.pkl"))

# Empirical boost to emphasize international risk in outputs.
_INTERNATIONAL_BOOSTS = {
    "logistic": 0.40,
    "random_forest": 0.35,
    "kmeans": 0.12,
    "stacking": 0.45,
}

_AMOUNT_BOOSTS = {
    "logistic": 0.35,
    "random_forest": 0.35,
    "kmeans": 0.18,
    "stacking": 0.40,
}

def _apply_international_boost(prob: float, boost: float, is_international: bool) -> float:
    if not is_international:
        return float(prob)
    clamped = max(0.0, min(float(prob), 1.0))
    return min(1.0, clamped + boost * (1.0 - clamped))

def _amount_avg_multiplier(amount_vs_avg: float) -> float:
    if amount_vs_avg >= 4.0:
        return 1.0
    if amount_vs_avg >= 3.0:
        return 0.7
    if amount_vs_avg >= 2.0:
        return 0.4
    return 0.0

def _apply_amount_boost(prob: float, boost: float, amount_vs_avg: float) -> float:
    multiplier = _amount_avg_multiplier(amount_vs_avg)
    if multiplier <= 0:
        return float(prob)
    clamped = max(0.0, min(float(prob), 1.0))
    return min(1.0, clamped + (boost * multiplier) * (1.0 - clamped))

def predict_stacking_from_scores(log_prob: float, rf_prob: float, kmeans_score: float) -> float:
    X_meta = np.array([[float(log_prob), float(rf_prob), float(kmeans_score)]])
    return float(meta_model.predict_proba(X_meta)[0][1])

def predict_fraud_combined(tx_features):

    logistic_features = build_logistic_features(tx_features)
    rf_features = build_rf_features(tx_features)

    # Obtener probabilidades base
    log_prob = predict_logistic(logistic_features)
    rf_prob = predict_fraud_rf(rf_features)
    kmeans_score = predict_kmeans_score(tx_features)

    is_international = bool(tx_features.get("is_international"))
    amount_vs_avg = float(tx_features.get("amount_vs_avg") or 0)
    log_prob = _apply_international_boost(log_prob, _INTERNATIONAL_BOOSTS["logistic"], is_international)
    rf_prob = _apply_international_boost(rf_prob, _INTERNATIONAL_BOOSTS["random_forest"], is_international)
    kmeans_score = _apply_international_boost(kmeans_score, _INTERNATIONAL_BOOSTS["kmeans"], is_international)

    log_prob = _apply_amount_boost(log_prob, _AMOUNT_BOOSTS["logistic"], amount_vs_avg)
    rf_prob = _apply_amount_boost(rf_prob, _AMOUNT_BOOSTS["random_forest"], amount_vs_avg)
    kmeans_score = _apply_amount_boost(kmeans_score, _AMOUNT_BOOSTS["kmeans"], amount_vs_avg)

    # Meta input
    final_prob = predict_stacking_from_scores(log_prob, rf_prob, kmeans_score)
    final_prob = _apply_international_boost(final_prob, _INTERNATIONAL_BOOSTS["stacking"], is_international)
    final_prob = _apply_amount_boost(final_prob, _AMOUNT_BOOSTS["stacking"], amount_vs_avg)
    label = int(final_prob >= 0.5)

    if settings.FRAUD_LOG_DEBUG:
        print(
            f"FraudScores log={log_prob:.4f} rf={rf_prob:.4f} kmeans={kmeans_score:.4f} final={final_prob:.4f}"
        )

    return {
        "label": label,
        "final_score": float(final_prob),
        "rf_probability": rf_prob,
        "logistic_probability": log_prob,
        "kmeans_score": kmeans_score
    }


# from app.ml.predictors.fraud_model import predict_fraud as predict_logistic
# from app.ml.predictors.random_forest_model import predict_fraud_rf
# from app.ml.predictors.kmeans_model import predict_kmeans_score
# from app.ml.utils.feature_engineering import (
#     build_logistic_features,
#     build_rf_features,
#     validate_required_fields,
# )

# REQUIRED_FIELDS = [
#     "amount",
#     "amount_vs_avg",
#     "transactions_last_24h",
#     "hour",
#     "day_of_week",
#     "failed_attempts", 
#     "is_international",
#     "risk_score_rule",
#     "card_tx_last_24h",
#     "qr_tx_last_24h",
# ]

# def predict_fraud_combined(tx_features: dict):

#     # Completar campos faltantes con 0 (o valor neutro)
#     for key in REQUIRED_FIELDS:
#         if key not in tx_features or tx_features[key] is None:
#             tx_features[key] = 0

#     # Validación defensiva
#     validate_required_fields(tx_features, REQUIRED_FIELDS)
    
#     # Obtener score KMeans
#     kmeans_score = predict_kmeans_score(tx_features)
#     tx_features["kmeans_score"] = kmeans_score
    
#     #  Modelos supervisados y sus features
#     logistic_features = build_logistic_features(tx_features)
#     rf_features = build_rf_features(tx_features)

#     _, rf_prob = predict_fraud_rf(rf_features)
#     _, log_prob = predict_logistic(logistic_features)

#     # Ensemble ponderado
#     final_score = (
#         0.6 * rf_prob + 
#         0.25 * log_prob +
#         0.15 * kmeans_score
#     )
#     label = int(final_score >= 0.6)
    
#     print(f"Ensemble Prediction - RF: {rf_prob:.4f}, Logistic: {log_prob:.4f}, KMeans: {kmeans_score:.4f} => Final Score: {final_score:.4f}, Label: {label}")

#     return {
#         "label": label,
#         "final_score": round(final_score, 4),
#         "rf_probability": rf_prob,
#         "logistic_probability": log_prob,
#         "kmeans_score": kmeans_score
#     }
