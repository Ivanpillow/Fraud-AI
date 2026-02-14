import pandas as pd
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
import os

BASE_DIR = os.path.dirname(__file__)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "../../utils/fraud_ai_dataset_v2.csv"
)

df = pd.read_csv(DATASET_PATH)

FEATURES = [
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


X = df[FEATURES]           # DataFrame
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
    class_weight={0:1, 1:2} # Se cambio de balanced a un peso fijo que penalice más errores en fraude
)

model.fit(X_train_scaled, y_train)

# Background para SHAP (Explicabilidad)
background = X_train.sample(100, random_state=42)

# Guardar artefactos en la carpeta padre (ml/)
parent_dir = os.path.dirname(BASE_DIR)
joblib.dump(model, os.path.join(parent_dir, "model.pkl"))
joblib.dump(scaler, os.path.join(parent_dir, "scaler.pkl"))
joblib.dump(background, os.path.join(parent_dir, "background.pkl"))

# Análisis de coeficientes y performance
print(df.groupby(["channel", "is_fraud"]).size())

# Coeficientes del modelo (Importancia de features)
coefs = model.coef_[0]
for feat, coef in zip(FEATURES, coefs):
    print(f"{feat:25s} {coef:.4f}")

# ROC es una métrica importante para evaluar modelos de clasificación binaria, especialmente en casos de clases desbalanceadas como el fraude. Aquí se calcula el ROC AUC global y por canal para entender mejor el desempeño del modelo.
# ROC global (todos los canales) y por canal
print("ROC GLOBAL:", roc_auc_score(y_test, model.predict_proba(X_test_scaled)[:,1]))

# ROC por canal (para ver si el modelo tiene diferente performance en card vs qr)
for channel in ["card", "qr"]:
    mask = df.iloc[y_test.index]["channel"] == channel
    if mask.sum() > 0:
        y_true = y_test[mask]
        y_pred = model.predict_proba(X_test_scaled[mask])[:,1]
        print(f"ROC {channel.upper()}:", roc_auc_score(y_true, y_pred))

print("Modelo, scaler y background guardados correctamente")
