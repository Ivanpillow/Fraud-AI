import joblib
import pandas as pd
import os

BASE_DIR = os.path.dirname(__file__)

model = joblib.load(os.path.join(BASE_DIR, "model.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.pkl"))

FEATURE_ORDER = [
    "amount_vs_avg",
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international",
    "risk_score_rule"
] # Orden de las features que el modelo espera recibir

def predict_fraud(features: dict):
    # Retorna en label 0 o 1 (no fraude o fraude) y la probabilidad de fraude

    x = pd.DataFrame([features], columns=FEATURE_ORDER) # Crear DataFrame con las features en el orden correcto
    x_scaled = scaler.transform(x) # Escalar usando el scaler entrenado, sin tener que entrenar de nuevo

    prob = model.predict_proba(x_scaled)[0][1] # Probabilidad de la clase 1 (fraude) [Probabilidad NO fraude, Probabilidad fraude]
    label = int(prob >= 0.7)

    return label, float(prob)