import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(__file__)

model = joblib.load(os.path.join(BASE_DIR, "rf_model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "rf_scaler.pkl"))

FEATURE_ORDER = [
    "amount_vs_avg",
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international",
    "risk_score_rule"
]

def predict_fraud_rf(features: dict):
    """
    Retorna:
    - label (0/1)
    - probabilidad de fraude
    """

    x_df = pd.DataFrame([features], columns=FEATURE_ORDER)
    x_scaled = scaler.transform(x_df)

    prob = model.predict_proba(x_scaled)[0][1]
    label = int(prob >= 0.7)

    return label, float(prob)
