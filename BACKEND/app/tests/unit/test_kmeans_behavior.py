from app.ml.predictors.kmeans_model import predict_kmeans_score

def test_rare_transaction_has_higher_score():
    normal = {
        "amount_vs_avg": 1.1,
        "transactions_last_24h": 2,
        "hour": 13,
        "day_of_week": 2,
        "failed_attempts": 0,
        "is_international": False
    }

    rare = {
        "amount_vs_avg": 7.5,
        "transactions_last_24h": 14,
        "hour": 3,
        "day_of_week": 6,
        "failed_attempts": 3,
        "is_international": True
    }

    assert predict_kmeans_score(rare) > predict_kmeans_score(normal)
