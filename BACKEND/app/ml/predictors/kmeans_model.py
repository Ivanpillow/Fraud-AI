import joblib
import pandas as pd
import numpy as np
import os

BASE_DIR = os.path.dirname(__file__)
PARENT_DIR = os.path.dirname(BASE_DIR)

model = joblib.load(os.path.join(PARENT_DIR, "kmeans_model.pkl"))
scaler = joblib.load(os.path.join(PARENT_DIR, "kmeans_scaler.pkl"))

FEATURE_ORDER = [
    "amount_vs_avg",
    "amount_vs_user_max",
    "amount_vs_user_p95",
    "amount_vs_merchant_avg",
    "amount_vs_user_merchant_avg",
    "transactions_last_24h",
    "card_tx_last_24h",
    "qr_tx_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international",
    "user_history_count",
    "merchant_history_count",
    "user_merchant_history_count"
]

def predict_kmeans_score(features: dict) -> float:
    """
    Retorna un score de rareza [0,1]
    basado en la distancia al centroide más cercano.
    """

    expected = list(getattr(scaler, "feature_names_in_", FEATURE_ORDER))
    # Align to the feature order used at fit time; fill missing with 0.
    x = pd.DataFrame([features]).reindex(columns=expected, fill_value=0)

    x_scaled = scaler.transform(x)

    # Distancias a centroides
    distances = model.transform(x_scaled)[0]

    min_distance = float(np.min(distances))

    # Normalización conservadora
    score = min(min_distance / 8, 1.0)

    return round(score, 4)

