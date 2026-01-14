from app.ml.predictors.fraud_model import predict_fraud

def run_tests():
    scenarios = [
        {
            "name": "Usuario normal",
            "features": {
                "amount_vs_avg": 0.9,
                "transactions_last_24h": 1,
                "hour": 11,
                "day_of_week": 3,
                "failed_attempts": 0,
                "is_international": False,
                "risk_score_rule": 0.1
            }
        },
        {
            "name": "Fraude claro",
            "features": {
                "amount_vs_avg": 7.0,
                "transactions_last_24h": 5,
                "hour": 2,
                "day_of_week": 6,
                "failed_attempts": 2,
                "is_international": True,
                "risk_score_rule": 0.9
            }
        }
    ]

    for s in scenarios:
        label, prob = predict_fraud(s["features"])
        print(f"{s['name']}: label={label}, prob={prob:.4f}")

if __name__ == "__main__":
    run_tests()
