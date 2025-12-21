import numpy as np
import pandas as pd

# ==============================
# CONFIGURACIÓN GENERAL
# ==============================
N_TRANSACTIONS = 100_000
N_USERS = 8_000
FRAUD_RATIO = 0.015  # 1.5% fraude (realista)

np.random.seed(42)

# ==============================
# CATÁLOGOS
# ==============================
merchant_categories = [
    "grocery", "electronics", "fashion", "travel",
    "gaming", "crypto", "restaurants", "gas", "health"
]

countries = ["MX", "US", "CA", "BR", "ES", "FR"]
device_types = ["mobile", "web"]

# ==============================
# USUARIOS BASE
# ==============================
user_ids = np.random.choice(range(1, N_USERS + 1), N_TRANSACTIONS)

avg_amount_user = np.random.gamma(shape=2, scale=300, size=N_USERS)
user_avg_map = dict(zip(range(1, N_USERS + 1), avg_amount_user))

# ==============================
# TRANSACCIONES
# ==============================
amount = np.random.exponential(scale=400, size=N_TRANSACTIONS)
hour = np.random.randint(0, 24, size=N_TRANSACTIONS)
day_of_week = np.random.randint(0, 7, size=N_TRANSACTIONS)

merchant_category = np.random.choice(merchant_categories, N_TRANSACTIONS)
country = np.random.choice(countries, N_TRANSACTIONS)
device_type = np.random.choice(device_types, N_TRANSACTIONS)

transactions_last_24h = np.random.poisson(lam=2, size=N_TRANSACTIONS)
failed_attempts = np.random.poisson(lam=0.3, size=N_TRANSACTIONS)

is_international = np.where(country != "MX", 1, 0)

avg_user_amount = np.array([user_avg_map[u] for u in user_ids])
amount_vs_avg = amount / (avg_user_amount + 1)

# ==============================
# REGLAS DE RIESGO (FEATURE ENGINEERING)
# ==============================
risk_score = (
    0.35 * (amount_vs_avg > 3).astype(int) +
    0.25 * is_international +
    0.15 * ((hour >= 0) & (hour <= 5)).astype(int) +
    0.15 * (transactions_last_24h > 5).astype(int) +
    0.10 * (failed_attempts > 2).astype(int)
)

risk_score = np.clip(risk_score + np.random.normal(0, 0.05, N_TRANSACTIONS), 0, 1)

# ==============================
# GENERACIÓN DE FRAUDE (TARGET)
# ==============================
fraud_threshold = np.percentile(risk_score, 100 * (1 - FRAUD_RATIO))
is_fraud = (risk_score >= fraud_threshold).astype(int)

# ==============================
# DATAFRAME FINAL
# ==============================
df = pd.DataFrame({
    "transaction_id": range(1, N_TRANSACTIONS + 1),
    "user_id": user_ids,
    "amount": amount.round(2),
    "hour": hour,
    "day_of_week": day_of_week,
    "merchant_category": merchant_category,
    "country": country,
    "is_international": is_international,
    "device_type": device_type,
    "transactions_last_24h": transactions_last_24h,
    "avg_amount_user": avg_user_amount.round(2),
    "amount_vs_avg": amount_vs_avg.round(2),
    "failed_attempts": failed_attempts,
    "risk_score_rule": risk_score.round(3),
    "is_fraud": is_fraud
})

print(df.head())
print("\nDistribución de fraude:")
print(df["is_fraud"].value_counts(normalize=True))

# ==============================
# GUARDAR DATASET
# ==============================
df.to_csv("fraud_ai_dataset.csv", index=False)
