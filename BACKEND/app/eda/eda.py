import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import os

# Ruta del dataset
DATA_PATH = r"G:\CUCEI\Fraud-AI\Files\creditcard.csv"
# Carpeta para guardar gráficas
PLOTS_DIR = os.path.join(os.path.dirname(__file__), "plots")
os.makedirs(PLOTS_DIR, exist_ok=True)

# Cargar dataset
df = pd.read_csv(DATA_PATH)
print("Primeras filas del dataset:")
print(df.head())

print("\nInformación general:")
print(df.info())

# Distribución de clases (fraude vs no fraude)
sns.countplot(x='Class', data=df)
plt.title("Distribución de transacciones: Fraude vs No fraude")
plt.savefig(os.path.join(PLOTS_DIR, "class_distribution.png"))
plt.close()

print("\nConteo de clases:")
print(df['Class'].value_counts())

# Correlación
corr = df.corr()
plt.figure(figsize=(12,10))
sns.heatmap(corr, cmap='coolwarm', annot=False)
plt.title("Mapa de correlación")
plt.savefig(os.path.join(PLOTS_DIR, "correlation_matrix.png"))
plt.close()

# Distribución de Amount y Time
sns.histplot(df['Amount'], bins=50, kde=True)
plt.title("Distribución de Amount")
plt.savefig(os.path.join(PLOTS_DIR, "amount_distribution.png"))
plt.close()

sns.histplot(df['Time'], bins=50, kde=True)
plt.title("Distribución de Time")
plt.savefig(os.path.join(PLOTS_DIR, "time_distribution.png"))
plt.close()

# Boxplot de Amount vs Class para detectar outliers
sns.boxplot(x='Class', y='Amount', data=df)
plt.title("Boxplot de Amount vs Class")
plt.savefig(os.path.join(PLOTS_DIR, "amount_boxplot.png"))
plt.close()

print("\nEDA completo. Las gráficas se guardaron en la carpeta 'plots'.")
