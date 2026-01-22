from app.ml.predictors.fraud_ensemble import predict_fraud_combined

def test_ensemble_returns_kmeans_score():
    tx = {
        "amount": 2000,
        "amount_vs_avg": 4.0,
        "transactions_last_24h": 2,
        "hour": 1,
        "day_of_week": 5,
        "failed_attempts": 0,
        "is_international": True,
        "risk_score_rule": 0.4
    }

    result = predict_fraud_combined(tx)

    assert "kmeans_score" in result
    assert 0.0 <= result["kmeans_score"] <= 1.0
