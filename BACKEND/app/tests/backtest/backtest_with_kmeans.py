import pandas as pd
from tqdm import tqdm
from app.ml.predictors.fraud_ensemble import predict_fraud_combined

df = pd.read_csv("app/utils/fraud_ai_dataset.csv")

results = []

for _, row in tqdm(df.iterrows(), total=len(df)):
    tx = row.to_dict()
    res = predict_fraud_combined(tx)

    results.append({
        "true": row["is_fraud"],
        "score": res["final_score"],
        "pred": res["label"],
        "kmeans": res["kmeans_score"]
    })

pd.DataFrame(results).to_csv(
    "app/tests/backtest/results_with_kmeans.csv",
    index=False
)

print("CSV con KMeans generado")
