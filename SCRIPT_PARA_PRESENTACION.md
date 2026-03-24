# Script para Presentacion (6 minutos)

## Objetivo de esta presentacion
Presentar FraudAI de forma clara y rapida: que problema resuelve, como funciona en flujo general, que funcionalidades ya estan operando y por que cumple con IA aplicada en un sistema real.

## Mensaje principal (1 frase)
FraudAI detecta riesgo de fraude en pagos con tarjeta y QR en tiempo casi real, ayuda a tomar decisiones (allow/review/block) y muestra evidencia para justificar cada caso.

## Objetivo de FRAUD AI:
1. Reducir falsos negativos (fraudes que pasan).
2. Mantener control de falsos positivos (bloqueos innecesarios).
3. Dar explicabilidad para poder justificar decisiones.

Herramientas:
1. FastAPI.
2. SQLAlchemy.
3. PostgreSQL (por URL de conexion en configuracion).
4. scikit-learn.
5. pandas y numpy.
6. Next.js + TypeScript.
7. pytest.

Metodologia de gestion propuesta:
1. SCRUM.

## Guion por tiempo (6:00)

### 0:00 - 0:40 | Introduccion rapida
Texto sugerido para decir:
"Buenos dias. Nuestro proyecto se llama FraudAI. Es una plataforma para analizar transacciones y detectar posibles fraudes en pagos de tarjeta y QR. La idea principal es reducir perdidas por fraude sin bloquear operaciones validas de forma innecesaria."

### 0:40 - 1:30 | Problema y solucion
Texto sugerido para decir:
"El problema es que revisar transacciones manualmente es lento y costoso. FraudAI automatiza un primer filtro de riesgo con IA y deja al operador humano los casos que requieren revision. Asi combinamos velocidad y control."

Puntos clave a mencionar:
1. Entrada: transaccion de pago.
2. Analisis: motor de IA + reglas de negocio.
3. Salida: decision y explicacion.

### 1:30 - 2:30 | Flujo completo de la app (de punto a punto)
Texto sugerido para decir:
"El flujo completo es este: primero el usuario inicia sesion, luego se genera una transaccion en checkout, el backend analiza el riesgo, guarda resultados y finalmente el dashboard muestra metricas y alertas para revision."

Diagrama verbal simple:
1. Login.
2. Checkout (tarjeta o QR).
3. Backend recibe y valida.
4. IA calcula probabilidad de fraude.
5. Decision: allow, review o block.
6. Dashboard y notificaciones.

### 2:30 - 4:30 | Demo funcional (lo mas importante)
Sugerencia de demo corta en vivo:
1. Mostrar login.
2. Entrar a checkout.
3. Enviar una transaccion de prueba.
4. Mostrar resultado de riesgo (probabilidad y decision).
5. Ir al dashboard y enseñar metricas.
6. Ir a review/notificaciones y mostrar como se cambia una decision.

Texto sugerido para decir durante la demo:
"Aqui simulamos una transaccion.
En segundos obtenemos el nivel de riesgo.
Si el riesgo es alto se va a revision o bloqueo.
Todo queda registrado para auditoria y seguimiento."

### 4:30 - 5:20 | Donde esta la IA y que hace
Texto sugerido para decir:
"La IA esta en el backend, en el modulo de machine learning. No es un solo modelo: usamos un enfoque combinado para mayor robustez. El sistema calcula una probabilidad final de fraude y, cuando aplica, guarda explicaciones de las variables que mas influyeron."

### Que hacen
1. Logistic Regression estima probabilidad de fraude con features de comportamiento.
2. Random Forest captura relaciones no lineales y reglas complejas.
3. KMeans estima rareza/anomalia por distancia a centroides.
4. Meta-modelo stacking combina las tres salidas para score final robusto.
5. SHAP explica que variables empujan la prediccion hacia mayor o menor riesgo.

Puntos clave cortos:
1. IA aplicada en el backend.
2. Calcula score de fraude por transaccion.
3. Soporta decisiones operativas.
4. Genera explicabilidad para justificar resultados.

### 5:20 - 6:00 | Cierre
Texto sugerido para decir:
"En resumen, FraudAI ya integra autenticacion, procesamiento transaccional, analisis con IA, dashboard y revision operativa. No es solo un modelo aislado, es un sistema completo y modular que puede escalar a un entorno distribuido en la nube."

## Que mostrar si te queda poco tiempo
Si el tiempo se reduce, prioriza solo esto:
1. Login.
2. Una transaccion (checkout).
3. Resultado de riesgo (allow/review/block).
4. Dashboard con metricas.

## Preguntas comunes del comite (simples) y respuestas

### 1) Que hace su proyecto en palabras simples?
Respuesta:
"Analiza pagos y detecta riesgo de fraude en tiempo casi real para apoyar decisiones de bloqueo o revision."

### 2) Donde esta la inteligencia artificial?
Respuesta:
"En el backend, dentro del modulo ML que evalua cada transaccion, aqui tenemos las carpetas para cada paso de su implementacion, los predictores donde estan los algoritmos, los de entrenamiento donde con nuestro dataset de 300k casos entrenamos los modelos que elegimos y se guardan en los artefactos ya entrenados o archivos .pkl los cuales se usan dentro de los archivos de los predictores."
1. Predictores: [BACKEND/app/ml/predictors](BACKEND/app/ml/predictors)
2. Entrenamiento: [BACKEND/app/ml/training](BACKEND/app/ml/training)
3. Explicabilidad SHAP: [BACKEND/app/ml/utils/explainability.py](BACKEND/app/ml/utils/explainability.py)
4. Artefactos entrenados (.pkl) en carpeta ML: [BACKEND/app/ml](BACKEND/app/ml)

### 3) Que tipo de datos analiza?
Respuesta:
"Datos transaccionales como monto, hora, frecuencia, pais, canal de pago y comportamiento reciente del usuario."

### 4) Que resultado entrega el sistema?
Respuesta:
"Entrega una probabilidad de fraude, una decision operativa (allow/review/block) y evidencia para monitoreo."

### 5) Que parte ve el usuario final?
Respuesta:
"Ve login, checkout, dashboard de metricas y panel de revision de alertas."

### 6) Esto reemplaza al humano?
Respuesta:
"No. Automatiza el primer filtro y deja al humano los casos sensibles para una decision final."

### 7) Como demuestran que si hay IA y no solo reglas?
Respuesta:
"Porque el sistema calcula una probabilidad con modelos de ML y guarda resultados por transaccion para analisis."

### 8) Que ventaja tiene frente a revisar todo manualmente?
Respuesta:
"Reduce tiempo de respuesta, mejora consistencia y permite enfocarse en casos de mayor riesgo."

### 9) Es escalable?
Respuesta:
"Si. La arquitectura separa frontend, backend y base de datos, por lo que se puede desplegar por componentes en nube."

### 10) Cual es el valor principal del proyecto?
Respuesta:
"Combina deteccion automatica con evidencia y trazabilidad para tomar decisiones de fraude mas rapidas y defendibles."
