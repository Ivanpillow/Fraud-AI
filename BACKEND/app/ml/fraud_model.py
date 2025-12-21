def predict_fraud(transaction: dict):
    """
    Stub temporal del modelo de fraude.
    Luego aquí irá Regresión Logística / Random Forest.
    """

    # Simulación básica
    probability = transaction.get("risk_score_rule", 0.0)

    prediction = 1 if probability > 0.7 else 0

    return prediction, probability