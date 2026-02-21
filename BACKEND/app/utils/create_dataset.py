import numpy as np
import pandas as pd

# ==============================
# CONFIGURACIÓN GENERAL
# ==============================
N_TRANSACTIONS = 300_000
N_USERS = 10_000
TARGET_FRAUD_RATIO = 0.02  # 2% fraude aproximado

np.random.seed(42)

# ==============================
# CATÁLOGOS CON RIESGO BASE
# ==============================

merchant_categories = {
    "grocery": 0.1,
    "electronics": 0.4,
    "fashion": 0.2,
    "travel": 0.5,
    "gaming": 0.6,
    "crypto": 0.9,
    "restaurants": 0.1,
    "gas": 0.15,
    "health": 0.1
}

country_risk = {
    "MX": 0.1,
    "US": 0.3,
    "CA": 0.2,
    "BR": 0.5,
    "ES": 0.25,
    "FR": 0.2
}

channels = ["card", "qr"]

channel_risk = {
    "card": 0.2,
    "qr": 0.4
}

device_types = ["mobile", "web"]

# ==============================
# GENERACIÓN DE USUARIOS
# ==============================

user_ids = np.random.choice(range(1, N_USERS + 1), N_TRANSACTIONS)

# Promedio histórico por usuario
avg_amount_user = np.random.gamma(shape=2, scale=400, size=N_USERS)
user_avg_map = dict(zip(range(1, N_USERS + 1), avg_amount_user))

# Perfil de riesgo por usuario (algunos naturalmente más riesgosos)
user_risk_profile = np.random.beta(2, 10, size=N_USERS)
user_risk_map = dict(zip(range(1, N_USERS + 1), user_risk_profile))

# ==============================
# TRANSACCIONES BASE
# ==============================

amount = np.random.exponential(scale=500, size=N_TRANSACTIONS)
hour = np.random.randint(0, 24, size=N_TRANSACTIONS)
day_of_week = np.random.randint(0, 7, size=N_TRANSACTIONS)

merchant_category = np.random.choice(
    list(merchant_categories.keys()), N_TRANSACTIONS
)

country = np.random.choice(
    list(country_risk.keys()), N_TRANSACTIONS
)

device_type = np.random.choice(device_types, N_TRANSACTIONS)

channel = np.random.choice(channels, N_TRANSACTIONS, p=[0.75, 0.25])

transactions_last_24h = np.random.poisson(lam=2.5, size=N_TRANSACTIONS)
failed_attempts = np.random.poisson(lam=0.4, size=N_TRANSACTIONS)

is_international = (country != "MX").astype(int)

# ==============================
# ACTIVIDAD POR CANAL (REALISTA)
# ==============================

card_tx_last_24h = []
qr_tx_last_24h = []

for ch in channel:
    if ch == "card":
        card_tx_last_24h.append(np.random.poisson(2))
        qr_tx_last_24h.append(np.random.poisson(0.5))
    else:
        card_tx_last_24h.append(np.random.poisson(0.5))
        qr_tx_last_24h.append(np.random.poisson(2))

card_tx_last_24h = np.array(card_tx_last_24h)
qr_tx_last_24h = np.array(qr_tx_last_24h)

# ==============================
# FEATURES DERIVADAS
# ==============================

avg_user_amount = np.array([user_avg_map[u] for u in user_ids])
amount_vs_avg = amount / (avg_user_amount + 1)

user_risk = np.array([user_risk_map[u] for u in user_ids])
cat_risk = np.array([merchant_categories[c] for c in merchant_category])
ctry_risk = np.array([country_risk[c] for c in country])
channel_risk_val = np.array([channel_risk[c] for c in channel])

# ==============================
# PROBABILIDAD DE FRAUDE (MODELO LATENTE REALISTA)
# ==============================

logit = (
    1.3 * np.log1p(amount_vs_avg) +
    0.4 * is_international +
    0.7 * failed_attempts +
    0.5 * transactions_last_24h +
    0.4 * card_tx_last_24h +
    0.6 * qr_tx_last_24h +
    0.6 * cat_risk +
    0.5 * ctry_risk +
    0.6 * channel_risk_val +
    0.9 * user_risk +
    np.random.normal(0, 0.6, N_TRANSACTIONS)
)

prob_fraud = 1 / (1 + np.exp(-logit))

# Ajustar ratio final aproximado al objetivo
threshold = np.percentile(prob_fraud, 100 * (1 - TARGET_FRAUD_RATIO))
is_fraud = (prob_fraud >= threshold).astype(int)

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
    "channel": channel,
    "card_tx_last_24h": card_tx_last_24h,
    "qr_tx_last_24h": qr_tx_last_24h,
    "is_fraud": is_fraud
})

print("Distribución de fraude:")
print(df["is_fraud"].value_counts(normalize=True))

df.to_csv("fraud_ai_dataset_v3.csv", index=False)

print("Dataset generado correctamente.")