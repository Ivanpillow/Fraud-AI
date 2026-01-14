from app.ml.predictors.random_forest_model import predict_fraud_rf

def main():
    test_cases = [
        # {
        #     "name": "Riesgo medio",
        #     "input": {
        #         "amount_vs_avg": 1.9,
        #         "transactions_last_24h": 3,
        #         "hour": 21,
        #         "day_of_week": 4,
        #         "failed_attempts": 1,
        #         "is_international": 0,
        #         "risk_score_rule": 0.35
        #     }
        # },
        # {
        #     "name": "Anómala conductual",
        #     "input": {
        #         "amount_vs_avg": 1.1,
        #         "transactions_last_24h": 10,
        #         "hour": 2,
        #         "day_of_week": 6,
        #         "failed_attempts": 3,
        #         "is_international": 0,
        #         "risk_score_rule": 0.6
        #     }
        # },
        # {
        #     "name": "Internacional sensible",
        #     "input": {
        #         "amount_vs_avg": 1.3,
        #         "transactions_last_24h": 1,
        #         "hour": 23,
        #         "day_of_week": 5,
        #         "failed_attempts": 0,
        #         "is_international": 1,
        #         "risk_score_rule": 0.7
        #     }
        # },
        {
            "name": "Fraude disimulado",
            "input": {
                "amount_vs_avg": 1.2,              # monto casi normal
                "transactions_last_24h": 8,         # actividad inusual
                "hour": 1,                          # madrugada
                "day_of_week": 2,                   # día laboral
                "failed_attempts": 1,               # casi nada
                "is_international": 0,
                "risk_score_rule": 0.55             # reglas sospechan
            }
        },
        {
            "name": "Fraude camuflado",
            "input": {
                "amount_vs_avg": 0.95,
                "transactions_last_24h": 2,
                "hour": 23,
                "day_of_week": 6,
                "failed_attempts": 0,
                "is_international": 0,
                "risk_score_rule": 0.48
            }
        },
        {
            "name": "Falso positivo potencial",
            "input": {
                "amount_vs_avg": 2.0,               # compra grande justificada
                "transactions_last_24h": 1,
                "hour": 20,
                "day_of_week": 5,
                "failed_attempts": 0,
                "is_international": 1,              # viaje real
                "risk_score_rule": 0.25
            }
        },
    ]


    for case in test_cases:
        result = predict_fraud_rf(case["input"])
        print(f"\n{case['name']}")
        print("Input:", case["input"])
        print("Output:", result)

if __name__ == "__main__":
    main()
