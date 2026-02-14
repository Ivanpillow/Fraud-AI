import shap
import pandas as pd
import joblib
import os

BASE_DIR = os.path.dirname(__file__)
PARENT_DIR = os.path.dirname(BASE_DIR)

# Cargar artefactos del modelo logístico
model = None
scaler = None
background = None

try:
    model = joblib.load(os.path.join(PARENT_DIR, "model.pkl"))
    scaler = joblib.load(os.path.join(PARENT_DIR, "scaler.pkl"))
    background = joblib.load(os.path.join(PARENT_DIR, "background.pkl"))
except Exception as e:
    print(f"Warning: Could not load model artifacts: {e}")

# Mismo orden que el modelo de regresión logística
FEATURE_ORDER = [
    "amount",
    "amount_vs_avg",
    "transactions_last_24h",
    "card_tx_last_24h",
    "qr_tx_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international"
]

# Escalar background IGUAL que en entrenamiento - solo si el modelo está disponible
background_scaled = None
explainer = None

if scaler is not None and background is not None:
    try:
        background_scaled = scaler.transform(
            background[FEATURE_ORDER]
        )
        # SHAP explainer para regresión logística
        explainer = shap.LinearExplainer(
            model,
            background_scaled
        )
    except Exception as e:
        print(f"Warning: Could not create SHAP explainer: {e}")



def explain_transaction(features: dict):
    """
    Retorna explicaciones SHAP para la predicción de fraude
    basada en la regresión logística.
    Si el explainer no está disponible, retorna un array vacío.
    """
    
    if explainer is None or scaler is None:
        return []

    try:
        # DataFrame con features en orden correcto
        x_df = pd.DataFrame([features], columns=FEATURE_ORDER)

        # Escalado consistente
        x_scaled = scaler.transform(x_df)

        shap_values = explainer(x_scaled)

        explanations = []

        for i, feature in enumerate(FEATURE_ORDER):
            raw_value = shap_values.values[0][i]

            if raw_value is None or pd.isna(raw_value):
                value = 0.0
            else:
                value = float(raw_value)

            explanations.append({
                "feature_name": feature,
                "contribution_value": round(value, 5),
                "direction": "increase" if value > 0 else "decrease"
            })

        return explanations
    except Exception as e:
        print(f"Error in explain_transaction: {e}")
        return []


def explain(features: dict):
    """Alias"""
    return explain_transaction(features)