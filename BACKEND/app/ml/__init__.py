"""
ML Module
=========

Módulo de machine learning para detección de fraude.

Estructura:
- predictors/: Modelos entrenados para predicción de fraude
- training/: Scripts para entrenar los modelos
- utils/: Funciones de utilidad (explicabilidad, cargadores)

Importaciones convenientes:
"""

from .predictors import predict_fraud, predict_fraud_rf
from .utils import explain_transaction, explain

__all__ = [
    "predict_fraud",
    "predict_fraud_rf", 
    "explain_transaction",
    "explain"
]
