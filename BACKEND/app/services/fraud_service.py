from app.ml.fraud_model import predict_fraud
from app.ml.explainability import explain

def analyze_transaction(transaction_dict):
    prediction, prob = predict_fraud(transaction_dict)

    explanation = None
    if prob > 0.7:
        explanation = explain(transaction_dict)

    return {
        "prediction": prediction,
        "probability": prob,
        "explanation": explanation
    }