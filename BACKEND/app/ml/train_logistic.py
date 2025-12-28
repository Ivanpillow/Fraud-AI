import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import os
import pandas as pd

BASE_DIR = os.path.dirname(__file__)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "../utils/fraud_ai_dataset.csv"
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

X = df[FEATURES]
y = df["is_fraud"]

# Escalado (Normalización)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split (Separar datos para entrenamiento y prueba)
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.3, random_state=42
)

# Modelo (Entrenamiento)
model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced" 
) # Con class weight balanced, el fraude recibe mucho más peso en la función de pérdida, ya que en datasets de fraude es muy común que haya un desbalance significativo entre clases (muchos más casos no fraudulentos que fraudulentos

model.fit(X_train, y_train)

# Guardar modelo y scaler
joblib.dump(model, "app/ml/model.pkl")
joblib.dump(scaler, "app/ml/scaler.pkl")

print("Modelo entrenado y guardado correctamente")