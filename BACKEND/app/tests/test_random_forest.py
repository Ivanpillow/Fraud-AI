from app.ml.random_forest_model import predict_fraud_rf

def main():
    # EJEMPLO de transacción (ajusta a tu modelo)
    sample_input = {
        "amount": 2500,
        "transaction_type": 1,
        "merchant_category": 3,
        "user_risk_score": 0.72,
        "hour": 23,
        "country_risk": 1
    }

    result = predict_fraud_rf(sample_input)

    print("Resultado del modelo Random Forest:")
    print(result)

if __name__ == "__main__":
    main()