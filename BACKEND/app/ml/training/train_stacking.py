import pandas as pd
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
import os

# Cargar dataset
BASE_DIR = os.path.dirname(__file__)
DATASET_PATH = os.path.join(BASE_DIR, "../../utils/fraud_ai_dataset_v3.csv")

df = pd.read_csv(DATASET_PATH)

# === FEATURES para modelos base ===
log_features = [
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

rf_features = [
    "amount_vs_avg",
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international"
]

kmeans_features = [
    "amount_vs_avg",
    "transactions_last_24h",
    "hour",
    "day_of_week",
    "failed_attempts",
    "is_international"
]

y = df["is_fraud"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    df, y, test_size=0.3, random_state=42, stratify=y
)

# === Cargar modelos base ===
parent_dir = os.path.dirname(BASE_DIR)

log_model = joblib.load(os.path.join(parent_dir, "model.pkl"))
log_scaler = joblib.load(os.path.join(parent_dir, "scaler.pkl"))

rf_model = joblib.load(os.path.join(parent_dir, "rf_model.pkl"))
rf_scaler = joblib.load(os.path.join(parent_dir, "rf_scaler.pkl"))

kmeans_model = joblib.load(os.path.join(parent_dir, "kmeans_model.pkl"))
kmeans_scaler = joblib.load(os.path.join(parent_dir, "kmeans_scaler.pkl"))

# === Generar probabilidades entrenamiento ===
def get_base_predictions(X):
    # Logistic
    X_log = log_scaler.transform(X[log_features])
    log_prob = log_model.predict_proba(X_log)[:, 1]

    # RF
    X_rf = rf_scaler.transform(X[rf_features])
    rf_prob = rf_model.predict_proba(X_rf)[:, 1]

    # KMeans (score normalizado)
    X_km = kmeans_scaler.transform(X[kmeans_features])
    distances = kmeans_model.transform(X_km)
    kmeans_score = np.min(distances, axis=1)
    kmeans_score = np.clip(kmeans_score / 8, 0, 1)

    return np.column_stack([log_prob, rf_prob, kmeans_score])

# Obtener predicciones
X_train_meta = get_base_predictions(X_train)
X_test_meta = get_base_predictions(X_test)

# === Meta-modelo ===
meta_model = LogisticRegression(max_iter=1000)
meta_model.fit(X_train_meta, y_train)

# Evaluación
meta_probs = meta_model.predict_proba(X_test_meta)[:, 1]

print("ROC STACKING:", roc_auc_score(y_test, meta_probs))

y_pred = (meta_probs >= 0.5).astype(int)

print("\nClassification Report STACKING:")
print(classification_report(y_test, y_pred))

# Guardar meta-modelo
joblib.dump(meta_model, os.path.join(parent_dir, "stacking_model.pkl"))

print("Stacking model guardado correctamente")