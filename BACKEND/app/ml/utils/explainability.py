import shap
import pandas as pd
import joblib
import os

BASE_DIR = os.path.dirname(__file__)
PARENT_DIR = os.path.dirname(BASE_DIR)

# Cargar artefactos del modelo logístico
model = joblib.load(os.path.join(PARENT_DIR, "model.pkl"))
scaler = joblib.load(os.path.join(PARENT_DIR, "scaler.pkl"))
background = joblib.load(os.path.join(PARENT_DIR, "background.pkl"))

# Mismo orden que el modelo de regresión logística
FEATURE_ORDER = [
    "amount",
    "amount_vs_avg",
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international",
    "risk_score_rule"
]

# Escalar background IGUAL que en entrenamiento
background_scaled = scaler.transform(
    background[FEATURE_ORDER]
)

# SHAP explainer para regresión logística
explainer = shap.LinearExplainer(
    model,
    background_scaled
)


def explain_transaction(features: dict):
    """
    Retorna explicaciones SHAP para la predicción de fraude
    basada en la regresión logística.
    """

    # DataFrame con features en orden correcto
    x_df = pd.DataFrame([features], columns=FEATURE_ORDER)

    # Escalado consistente
    x_scaled = scaler.transform(x_df)

    shap_values = explainer(x_scaled)

    explanations = []

    for i, feature in enumerate(FEATURE_ORDER):
        value = float(shap_values.values[0][i])

        explanations.append({
            "feature_name": feature,
            "contribution_value": round(value, 5),
            "direction": "increase" if value > 0 else "decrease"
        })

    return explanations


def explain(features: dict):
    """Alias"""
    return explain_transaction(features)