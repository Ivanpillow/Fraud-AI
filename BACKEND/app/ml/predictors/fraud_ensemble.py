from app.ml.predictors.fraud_model import predict_fraud as predict_logistic
from app.ml.predictors.random_forest_model import predict_fraud_rf

def predict_fraud_combined(features):
    # RF usa subset
    rf_features = {
        "amount_vs_avg": features["amount_vs_avg"],
        "transactions_last_24h": features["transactions_last_24h"],
        "hour": features["hour"],
        "day_of_week": features["day_of_week"],
        "failed_attempts": features["failed_attempts"],
        "is_international": features["is_international"],
        "risk_score_rule": features["risk_score_rule"],
    }

    _, rf_prob = predict_fraud_rf(rf_features)
    _, log_prob = predict_logistic(features)

    # Ensemble ponderado
    final_score = (0.6 * rf_prob) + (0.4 * log_prob)
    label = int(final_score >= 0.6)

    return {
        "label": label,
        "final_score": final_score,
        "rf_probability": rf_prob,
        "logistic_probability": log_prob
    }
