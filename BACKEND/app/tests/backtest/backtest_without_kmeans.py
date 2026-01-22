import pandas as pd
from tqdm import tqdm
from app.ml.predictors.fraud_model import predict_fraud
from app.ml.predictors.random_forest_model import predict_fraud_rf

df = pd.read_csv("app/utils/fraud_ai_dataset.csv")

results = []

for _, row in tqdm(df.iterrows(), total=len(df)):
    tx = row.to_dict()

    _, rf_prob = predict_fraud_rf(tx)
    _, log_prob = predict_fraud(tx)

    final_score = (0.7 * rf_prob) + (0.3 * log_prob)
    label = int(final_score >= 0.6)

    results.append({
        "true": row["is_fraud"],
        "score": final_score,
        "pred": label
    })

pd.DataFrame(results).to_csv(
    "app/tests/backtest/results_without_kmeans.csv",
    index=False
)

print("CSV sin KMeans generado")

