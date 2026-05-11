import pandas as pd
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import os

BASE_DIR = os.path.dirname(__file__)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "../../utils/fraud_ai_dataset_v4.csv"
)

df = pd.read_csv(DATASET_PATH)

FEATURES = [
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

X = df[FEATURES]

# Escalado
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# K-Means
kmeans = KMeans(
    n_clusters=6,        # Un punto incial razonable
    random_state=42,
    n_init=20
)

kmeans.fit(X_scaled)

# Guardar artefactos
parent_dir = os.path.dirname(BASE_DIR)
joblib.dump(kmeans, os.path.join(parent_dir, "kmeans_model.pkl"))
joblib.dump(scaler, os.path.join(parent_dir, "kmeans_scaler.pkl"))

print("KMeans entrenado y guardado correctamente")
