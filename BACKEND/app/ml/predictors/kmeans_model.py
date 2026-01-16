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
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international"
]

def predict_kmeans_score(features: dict) -> float:
    """
    Retorna un score de rareza [0,1]
    basado en la distancia al centroide más cercano.
    """

    x = pd.DataFrame([features], columns=FEATURE_ORDER)
    x_scaled = scaler.transform(x)

    # Distancias a centroides
    distances = model.transform(x_scaled)[0]

    min_distance = float(np.min(distances))

    # Normalización conservadora
    score = min(min_distance / 8, 1.0)

    return round(score, 4)

