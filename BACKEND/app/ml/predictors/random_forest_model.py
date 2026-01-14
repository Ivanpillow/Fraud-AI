import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(__file__)
# Subimos un nivel para acceder a los archivos .pkl que están en ml/
PARENT_DIR = os.path.dirname(BASE_DIR)

model = joblib.load(os.path.join(PARENT_DIR, "rf_model.pkl"))
scaler = joblib.load(os.path.join(PARENT_DIR, "rf_scaler.pkl"))

FEATURE_ORDER = [
    "amount_vs_avg",
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international"
]

def predict_fraud_rf(features: dict):
    # va a retonar un label (0/1)
    # y la probabilidad de fraude


    x_df = pd.DataFrame([features], columns=FEATURE_ORDER)
    x_scaled = scaler.transform(x_df)

    prob = model.predict_proba(x_scaled)[0][1]
    label = int(prob >= 0.4)

    return label, float(prob)
