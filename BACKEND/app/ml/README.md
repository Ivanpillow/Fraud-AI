# Estructura del Módulo ML

La carpeta `app/ml` ha sido reorganizada para mejorar la legibilidad y mantenibilidad del código.

## Estructura Actual

```
app/ml/
├── __init__.py              # Exports convenientes
├── predictors/              # Modelos entrenados
│   ├── __init__.py
│   ├── fraud_model.py       # Logistic Regression para detección de fraude
│   ├── random_forest_model.py # Random Forest para predicción
│   └── anomaly_model.py     # Placeholder para detección de anomalías
├── training/                # Scripts de entrenamiento
│   ├── __init__.py
│   ├── train_logistic.py    # Entrenamiento de Logistic Regression
│   └── train_randomF.py     # Entrenamiento de Random Forest
├── utils/                   # Funciones de utilidad
│   ├── __init__.py
│   ├── explainability.py    # Explicabilidad SHAP
│   └── model_loader.py      # Placeholder para cargadores
└── *.pkl                    # Archivos de modelos entrenados
    ├── model.pkl
    ├── scaler.pkl
    ├── background.pkl
    ├── rf_model.pkl
    └── rf_scaler.pkl
```

## Descripción de Componentes

### `predictors/`
Contiene los modelos entrenados listos para usar:
- **fraud_model.py**: Función `predict_fraud(features)` que retorna predicción y probabilidad
- **random_forest_model.py**: Función `predict_fraud_rf(features)` con Random Forest
- **anomaly_model.py**: Placeholder para futuras mejoras

### `training/`
Scripts para entrenar o reentrenar los modelos:
- **train_logistic.py**: Entrena el modelo de Logistic Regression
- **train_randomF.py**: Entrena el modelo de Random Forest
- Estos scripts guardan los artefactos en `../` (carpeta padre ml/)

### `utils/`
Funciones de utilidad y soporte:
- **explainability.py**: Explicabilidad SHAP con funciones `explain_transaction()` y `explain()`
- **model_loader.py**: Placeholder para futuros cargadores de modelos

## Importaciones

### Desde el módulo raíz (recomendado)
```python
from app.ml import predict_fraud, predict_fraud_rf, explain_transaction
```

### Desde subcarpetas específicas
```python
from app.ml.predictors import predict_fraud
from app.ml.utils import explain_transaction
from app.ml.training import train_logistic  # si es necesario ejecutar training
```

## Notas Técnicas

- Los archivos `.pkl` (modelos entrenados) se encuentran en `app/ml/` para que los predictores puedan acceder a ellos con ruta relativa `../`
- Los scripts de training guardan los artefactos en la carpeta padre para mantener centralizado
- Cada carpeta contiene un `__init__.py` que exporta los símbolos relevantes
- Las importaciones son completamente retrocompatibles con el código existente

## Cambios Realizados

Se reorganizaron los archivos de manera lógica sin cambiar la funcionalidad:
- Antes: 8 archivos en `app/ml/` (visual crowded)
- Después: 3 subcarpetas temáticas + carpeta limpia
