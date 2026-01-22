from app.ml.predictors.kmeans_model import predict_kmeans_score

def test_kmeans_score_range():
    features = {
        "amount_vs_avg": 1.5,
        "transactions_last_24h": 3,
        "hour": 14,
        "day_of_week": 2,
        "failed_attempts": 0,
        "is_international": False
    }

    score = predict_kmeans_score(features)

    assert 0.0 <= score <= 1.0
