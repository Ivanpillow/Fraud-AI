import pandas as pd
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import os

BASE_DIR = os.path.dirname(__file__)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "../../utils/fraud_ai_dataset.csv"
)

df = pd.read_csv(DATASET_PATH)

FEATURES = [
    "amount_vs_avg",
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international"
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
