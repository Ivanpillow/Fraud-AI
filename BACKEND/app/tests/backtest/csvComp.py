import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_auc_score

# Cargar los resultados
df_no = pd.read_csv("results_without_kmeans.csv")
df_km = pd.read_csv("results_with_kmeans.csv")

print("=" * 80)
print("COMPARACIÓN DE RESULTADOS: CON vs SIN KMEANS")
print("=" * 80)

# === MÉTRICAS SIN KMEANS ===
print("\n📊 MODELO SIN KMEANS")
print("-" * 40)
acc_no = accuracy_score(df_no["true"], df_no["pred"])
prec_no = precision_score(df_no["true"], df_no["pred"], zero_division=0)
rec_no = recall_score(df_no["true"], df_no["pred"], zero_division=0)
f1_no = f1_score(df_no["true"], df_no["pred"], zero_division=0)
auc_no = roc_auc_score(df_no["true"], df_no["score"])

print(f"Accuracy:  {acc_no:.4f}")
print(f"Precision: {prec_no:.4f}")
print(f"Recall:    {rec_no:.4f}")
print(f"F1-Score:  {f1_no:.4f}")
print(f"ROC-AUC:   {auc_no:.4f}")

# === MÉTRICAS CON KMEANS ===
print("\n📊 MODELO CON KMEANS")
print("-" * 40)
acc_km = accuracy_score(df_km["true"], df_km["pred"])
prec_km = precision_score(df_km["true"], df_km["pred"], zero_division=0)
rec_km = recall_score(df_km["true"], df_km["pred"], zero_division=0)
f1_km = f1_score(df_km["true"], df_km["pred"], zero_division=0)
auc_km = roc_auc_score(df_km["true"], df_km["score"])

print(f"Accuracy:  {acc_km:.4f}")
print(f"Precision: {prec_km:.4f}")
print(f"Recall:    {rec_km:.4f}")
print(f"F1-Score:  {f1_km:.4f}")
print(f"ROC-AUC:   {auc_km:.4f}")

# === DIFERENCIAS ===
print("\n📈 MEJORA CON KMEANS")
print("-" * 40)
print(f"Accuracy:  {(acc_km - acc_no):+.4f} ({((acc_km/acc_no - 1) * 100):+.2f}%)")
print(f"Precision: {(prec_km - prec_no):+.4f} ({((prec_km/prec_no - 1) * 100 if prec_no > 0 else 0):+.2f}%)")
print(f"Recall:    {(rec_km - rec_no):+.4f} ({((rec_km/rec_no - 1) * 100 if rec_no > 0 else 0):+.2f}%)")
print(f"F1-Score:  {(f1_km - f1_no):+.4f} ({((f1_km/f1_no - 1) * 100 if f1_no > 0 else 0):+.2f}%)")
print(f"ROC-AUC:   {(auc_km - auc_no):+.4f} ({((auc_km/auc_no - 1) * 100):+.2f}%)")

# === ANÁLISIS DE SCORES ===
print("\n📉 ESTADÍSTICAS DE SCORES")
print("-" * 40)
print("Sin KMeans:")
print(df_no["score"].describe())
print("\nCon KMeans:")
print(df_km["score"].describe())

# === COMPARACIÓN DE SCORES ===
print("\n🔍 DIFERENCIA DE SCORES (KMeans - Sin KMeans)")
print("-" * 40)
score_diff = df_km["score"] - df_no["score"]
print(score_diff.describe())

# === MATRIZ DE CONFUSIÓN ===
print("\n🎯 MATRIZ DE CONFUSIÓN - SIN KMEANS")
print("-" * 40)
cm_no = confusion_matrix(df_no["true"], df_no["pred"])
print(f"TN: {cm_no[0][0]:5d}  FP: {cm_no[0][1]:5d}")
print(f"FN: {cm_no[1][0]:5d}  TP: {cm_no[1][1]:5d}")

print("\n🎯 MATRIZ DE CONFUSIÓN - CON KMEANS")
print("-" * 40)
cm_km = confusion_matrix(df_km["true"], df_km["pred"])
print(f"TN: {cm_km[0][0]:5d}  FP: {cm_km[0][1]:5d}")
print(f"FN: {cm_km[1][0]:5d}  TP: {cm_km[1][1]:5d}")

print("\n" + "=" * 80)