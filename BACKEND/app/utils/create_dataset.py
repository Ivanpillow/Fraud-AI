import numpy as np
import pandas as pd

# ==============================
# CONFIGURACIÓN GENERAL
# ==============================
N_TRANSACTIONS = 300_000
N_USERS = 10_000
N_MERCHANTS = 600
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

merchant_amount_scale = {
    "grocery": 0.7,
    "electronics": 1.4,
    "fashion": 1.0,
    "travel": 2.0,
    "gaming": 1.2,
    "crypto": 3.0,
    "restaurants": 0.6,
    "gas": 0.8,
    "health": 0.9,
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

merchant_ids = np.random.choice(range(1, N_MERCHANTS + 1), N_TRANSACTIONS)
merchant_category_by_id = np.random.choice(list(merchant_categories.keys()), N_MERCHANTS)
merchant_category = merchant_category_by_id[merchant_ids - 1]

# Promedio historico por merchant
merchant_avg_base = np.random.gamma(shape=2, scale=350, size=N_MERCHANTS)
merchant_scale = np.array([merchant_amount_scale[c] for c in merchant_category_by_id])
merchant_avg_amount = merchant_avg_base * merchant_scale
merchant_avg_tx = merchant_avg_amount[merchant_ids - 1]

amount = np.random.exponential(scale=500, size=N_TRANSACTIONS)
hour = np.random.randint(0, 24, size=N_TRANSACTIONS)
day_of_week = np.random.randint(0, 7, size=N_TRANSACTIONS)

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

user_p95_multiplier = np.random.uniform(1.3, 2.4, size=N_USERS)
user_max_multiplier = user_p95_multiplier + np.random.uniform(0.4, 2.6, size=N_USERS)
user_p95_amount = avg_amount_user * user_p95_multiplier
user_max_amount = avg_amount_user * user_max_multiplier

user_p95_tx = user_p95_amount[user_ids - 1]
user_max_tx = user_max_amount[user_ids - 1]

user_history_count = np.random.poisson(lam=8, size=N_TRANSACTIONS)
merchant_history_count = np.random.poisson(lam=35, size=N_TRANSACTIONS)
user_merchant_history_count = np.random.poisson(lam=4, size=N_TRANSACTIONS)

user_history_count = np.clip(user_history_count, 0, 60)
merchant_history_count = np.clip(merchant_history_count, 0, 200)
user_merchant_history_count = np.clip(user_merchant_history_count, 0, 50)

user_merchant_base = (0.6 * avg_user_amount) + (0.4 * merchant_avg_tx)
user_merchant_noise = np.random.normal(1.0, 0.15, size=N_TRANSACTIONS)
user_merchant_noise = np.clip(user_merchant_noise, 0.6, 1.5)
user_merchant_avg_tx = user_merchant_base * user_merchant_noise

amount_vs_user_max = amount / (user_max_tx + 1)
amount_vs_user_p95 = amount / (user_p95_tx + 1)
amount_vs_merchant_avg = amount / (merchant_avg_tx + 1)
amount_vs_user_merchant_avg = amount / (user_merchant_avg_tx + 1)

user_risk = np.array([user_risk_map[u] for u in user_ids])
cat_risk = np.array([merchant_categories[c] for c in merchant_category])
ctry_risk = np.array([country_risk[c] for c in country])
channel_risk_val = np.array([channel_risk[c] for c in channel])

# ==============================
# PROBABILIDAD DE FRAUDE (MODELO LATENTE REALISTA)
# ==============================

logit = (
    1.3 * np.log1p(amount_vs_avg) +
    0.7 * np.log1p(amount_vs_user_max) +
    0.9 * np.log1p(amount_vs_user_p95) +
    0.6 * np.log1p(amount_vs_merchant_avg) +
    0.7 * np.log1p(amount_vs_user_merchant_avg) +
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
    "merchant_id": merchant_ids,
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
    "amount_vs_user_max": amount_vs_user_max.round(2),
    "amount_vs_user_p95": amount_vs_user_p95.round(2),
    "amount_vs_merchant_avg": amount_vs_merchant_avg.round(2),
    "amount_vs_user_merchant_avg": amount_vs_user_merchant_avg.round(2),
    "failed_attempts": failed_attempts,
    "channel": channel,
    "card_tx_last_24h": card_tx_last_24h,
    "qr_tx_last_24h": qr_tx_last_24h,
    "user_history_count": user_history_count,
    "merchant_history_count": merchant_history_count,
    "user_merchant_history_count": user_merchant_history_count,
    "is_fraud": is_fraud
})

print("Distribución de fraude:")
print(df["is_fraud"].value_counts(normalize=True))

df.to_csv("fraud_ai_dataset_v4.csv", index=False)

print("Dataset generado correctamente.")