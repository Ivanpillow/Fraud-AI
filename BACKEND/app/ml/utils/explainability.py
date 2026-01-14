import shap
import pandas as pd
import joblib
import os

BASE_DIR = os.path.dirname(__file__)
# Subimos un nivel para acceder a los archivos .pkl que están en ml/
PARENT_DIR = os.path.dirname(BASE_DIR)

model = joblib.load(os.path.join(PARENT_DIR, "model.pkl"))
scaler = joblib.load(os.path.join(PARENT_DIR, "scaler.pkl"))
background = joblib.load(os.path.join(PARENT_DIR, "background.pkl"))  # 🔑 CLAVE

FEATURE_ORDER = [
    "amount_vs_avg",
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international",
    "risk_score_rule"
]

# Escalar el background IGUAL que en entrenamiento
background_scaled = scaler.transform(background)

# SHAP Explainer (correcto)
explainer = shap.LinearExplainer(
    model,
    background_scaled
)

def explain_transaction(features: dict):
    # Retorna explicación SHAP por feature de la predicción de fraude

    # DataFrame con las features en el orden correcto 
    x_df = pd.DataFrame([features], columns=FEATURE_ORDER)

    # Escalado usando el scaler entrenado
    x_scaled = scaler.transform(x_df)

    shap_values = explainer(x_scaled)

    explanations = []

    for i, feature in enumerate(FEATURE_ORDER):
        value = float(shap_values.values[0][i])

        explanations.append({
            "feature": feature,
            "contribution": round(value, 5),
            "direction": "increase" if value > 0 else "decrease"
        })

    return explanations

def explain(features: dict):
    """Alias para explain_transaction"""
    return explain_transaction(features)
