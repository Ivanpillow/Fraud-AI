import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import os

from sklearn.metrics import classification_report, confusion_matrix

BASE_DIR = os.path.dirname(__file__)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "../../utils/fraud_ai_dataset_v3.csv"
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
y = df["is_fraud"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

# No necesita escalado pero lo deje por consistencia
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=8,              
    min_samples_split=5,      # esto lo hace mas sensible
    min_samples_leaf=2,       # esto evita los extremos
    class_weight="balanced_subsample",
    random_state=42,
    n_jobs=-1
)

model.fit(X_train_scaled, y_train)

# Guardar artefactos en la carpeta padre (ml/)
parent_dir = os.path.dirname(BASE_DIR)
joblib.dump(model, os.path.join(parent_dir, "rf_model.pkl"))
joblib.dump(scaler, os.path.join(parent_dir, "rf_scaler.pkl"))



y_pred = model.predict(X_test_scaled)

print("\nMatriz de confusión:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))


print("Random Forest entrenado y guardado correctamente")
