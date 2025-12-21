import matplotlib.pyplot as plt
import seaborn as sns
import os

def save_histogram(df, column, filename, bins=50, kde=True):
    plt.figure()
    sns.histplot(df[column], bins=bins, kde=kde)
    plt.title(f"Distribución de {column}")
    plt.savefig(filename)
    plt.close()

def save_countplot(df, column, filename):
    plt.figure()
    sns.countplot(x=column, data=df)
    plt.title(f"Conteo de {column}")
    plt.savefig(filename)
    plt.close()