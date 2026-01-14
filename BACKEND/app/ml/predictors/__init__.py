"""
Predictors module
Contiene los modelos de predicción entrenados para detección de fraude.
"""

from .fraud_model import predict_fraud
from .random_forest_model import predict_fraud_rf

__all__ = ["predict_fraud", "predict_fraud_rf"]
