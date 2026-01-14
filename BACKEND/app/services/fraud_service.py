from app.ml.predictors.fraud_ensemble import predict_fraud_combined
from app.ml.utils.explainability import explain

def analyze_transaction(transaction_dict):
    result = predict_fraud_combined(transaction_dict)

    explanation = None
    if result["final_score"] > 0.45: # 0.45 para que explique tanto en review como block
        explanation = explain(transaction_dict)

    return {
        "prediction": result["label"],
        "probability": result["final_score"],
        "rf_probability": result["rf_probability"],
        "logistic_probability": result["logistic_probability"],
        "explanation": explanation
    }