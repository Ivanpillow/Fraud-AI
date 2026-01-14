import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
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
    "is_international",
    "risk_score_rule"
]

X = df[FEATURES]           # 👈 DataFrame
y = df["is_fraud"]

# Split (70% entrenamiento, 30% prueba)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# Escalado (Normalización)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Modelo (Regresión Logística)
model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

model.fit(X_train_scaled, y_train)

# Background para SHAP (Explicabilidad)
background = X_train.sample(100, random_state=42)

# Guardar artefactos en la carpeta padre (ml/)
parent_dir = os.path.dirname(BASE_DIR)
joblib.dump(model, os.path.join(parent_dir, "model.pkl"))
joblib.dump(scaler, os.path.join(parent_dir, "scaler.pkl"))
joblib.dump(background, os.path.join(parent_dir, "background.pkl"))

print("Modelo, scaler y background guardados correctamente")
