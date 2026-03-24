# Defensa de Proyecto: FraudAI

## 1. Resumen Ejecutivo
FraudAI es una plataforma para deteccion de fraude en transacciones de pago (tarjeta y QR) con analisis en tiempo casi real.
La solucion integra:
1. Frontend web para operacion y monitoreo.
2. Backend API para autenticacion, procesamiento transaccional y metricas.
3. Motor de IA hibrido (Logistic Regression + Random Forest + KMeans + Stacking).
4. Base de datos relacional para trazabilidad, auditoria y reporteo.

Objetivo de negocio:
1. Reducir falsos negativos (fraudes que pasan).
2. Mantener control de falsos positivos (bloqueos innecesarios).
3. Dar explicabilidad para justificar decisiones ante negocio/comite.

## 2. Flujo Completo Punto a Punto
## 2.1 Flujo funcional (de extremo a extremo)
1. El usuario operador inicia sesion en la interfaz web.
2. El frontend autentica contra backend y recibe cookie segura de sesion.
3. Se genera una transaccion desde Checkout (tarjeta o QR).
4. El frontend envia la transaccion al backend.
5. El backend valida esquema y origen del comercio (API key).
6. El backend enriquece la transaccion con comportamiento historico del usuario.
7. Se construyen features y se ejecuta la inferencia del ensemble de IA.
8. Se calcula decision final: allow, review o block.
9. Se guarda transaccion, prediccion, scores de modelos y explicaciones en base de datos.
10. El frontend muestra resultado de riesgo y alimenta dashboard/notificaciones.
11. Operador puede revisar alertas y actualizar decision (approve/block/review).

## 2.2 Flujo tecnico en el codigo
1. Entrada API y orquestacion: [BACKEND/app/main.py](BACKEND/app/main.py)
2. Endpoint de tarjeta: [BACKEND/app/routers/transactions.py](BACKEND/app/routers/transactions.py)
3. Endpoint de QR: [BACKEND/app/routers/qr_transactions.py](BACKEND/app/routers/qr_transactions.py)
4. Servicio de tarjeta: [BACKEND/app/services/transaction_service.py](BACKEND/app/services/transaction_service.py)
5. Servicio de QR: [BACKEND/app/services/qr_transaction_service.py](BACKEND/app/services/qr_transaction_service.py)
6. Ensemble IA: [BACKEND/app/ml/predictors/fraud_ensemble.py](BACKEND/app/ml/predictors/fraud_ensemble.py)
7. Explicabilidad: [BACKEND/app/ml/utils/explainability.py](BACKEND/app/ml/utils/explainability.py)
8. Persistencia de predicciones y notificaciones: [BACKEND/app/queries/prediction_queries.py](BACKEND/app/queries/prediction_queries.py)

## 3. Flujo de Comunicacion Frontend - Backend
## 3.1 Frontend
1. Cliente API centralizado: [FRONTEND/lib/api.ts](FRONTEND/lib/api.ts)
2. Autenticacion y sesion: [FRONTEND/lib/auth-context.tsx](FRONTEND/lib/auth-context.tsx)
3. Middleware de rutas protegidas: [FRONTEND/middleware.ts](FRONTEND/middleware.ts)
4. Login UI: [FRONTEND/components/login/login-form.tsx](FRONTEND/components/login/login-form.tsx)
5. Checkout tarjeta: [FRONTEND/components/checkout/card-payment-form.tsx](FRONTEND/components/checkout/card-payment-form.tsx)
6. Checkout QR: [FRONTEND/components/checkout/qr-payment-form.tsx](FRONTEND/components/checkout/qr-payment-form.tsx)
7. Dashboard overview: [FRONTEND/app/dashboard/page.tsx](FRONTEND/app/dashboard/page.tsx)

## 3.2 Backend
1. API REST con FastAPI.
2. CORS habilitado para frontend local (dev): [BACKEND/app/main.py](BACKEND/app/main.py)
3. Autenticacion JWT + cookie HttpOnly: [BACKEND/app/routers/auth_router.py](BACKEND/app/routers/auth_router.py)
4. Seguridad de password con Argon2: [BACKEND/app/services/auth_service.py](BACKEND/app/services/auth_service.py)
5. Control de comercio por API key en endpoints transaccionales: [BACKEND/app/core/auth.py](BACKEND/app/core/auth.py)

## 3.3 Protocolos
1. HTTP/HTTPS para frontend-backend.
2. REST/JSON para intercambio de datos.
3. Cookies HttpOnly para sesion de usuario.
4. Header X-API-Key para identificar comercio en transacciones.

## 4. Explicacion del Backend (simple y concreta)
El backend esta dividido por capas:
1. Routers: exponen endpoints.
2. Services: reglas de negocio y orquestacion IA.
3. Queries: acceso a datos.
4. Models/Schemas: contrato y persistencia.
5. ML: prediccion y explicabilidad.

Backend en una frase:
Recibe transacciones, calcula riesgo con IA, toma decision operativa, y deja evidencia auditable para monitoreo y mejora continua.

## 5. Explicacion del Frontend (simple y concreta)
El frontend es una aplicacion Next.js orientada a operacion:
1. Login y control de sesion.
2. Simulador de checkout para tarjeta y QR.
3. Dashboard de metricas de fraude.
4. Vista de notificaciones/revision para decisiones humanas.

Frontend en una frase:
Convierte la API de fraude en una consola operativa para monitorear, decidir y justificar acciones.

## 6. Punto Critico 1: Como se implementa la IA, donde esta y que hace
## 6.1 Donde esta
1. Predictores: [BACKEND/app/ml/predictors](BACKEND/app/ml/predictors)
2. Entrenamiento: [BACKEND/app/ml/training](BACKEND/app/ml/training)
3. Explicabilidad SHAP: [BACKEND/app/ml/utils/explainability.py](BACKEND/app/ml/utils/explainability.py)
4. Artefactos entrenados (.pkl) en carpeta ML: [BACKEND/app/ml](BACKEND/app/ml)

## 6.2 Que hace
1. Logistic Regression estima probabilidad de fraude con features de comportamiento.
2. Random Forest captura relaciones no lineales y reglas complejas.
3. KMeans estima rareza/anomalia por distancia a centroides.
4. Meta-modelo stacking combina las tres salidas para score final robusto.
5. SHAP explica que variables empujan la prediccion hacia mayor o menor riesgo.

## 6.3 Como se aplica en runtime
1. Se extraen features desde transaccion + historial del usuario.
2. Se ejecuta [BACKEND/app/ml/predictors/fraud_ensemble.py](BACKEND/app/ml/predictors/fraud_ensemble.py).
3. Se obtiene final_score y decision.
4. Si aplica, se generan explicaciones en [BACKEND/app/ml/utils/explainability.py](BACKEND/app/ml/utils/explainability.py).
5. Se guarda evidencia de scores y explicaciones en BD.

## 7. Cobertura de Modulos Academicos

## 7.1 Modulo 2. Gestion de las tecnologias de la informacion
### 2.1 Modela e implementa un sistema de informacion
Propuesta de metodologia para defensa: SCRUM.

Estructura sugerida para presentar:
1. Sprint 1: Autenticacion, modelo de datos base, API minima.
2. Sprint 2: Motor IA y flujo transaccional card/QR.
3. Sprint 3: Dashboard, notificaciones y revision humana.
4. Sprint 4: Pruebas, endurecimiento de seguridad y despliegue.

Evidencia de ingenieria de software en el proyecto:
1. Arquitectura por capas y separacion de responsabilidades.
2. Validacion de datos con Pydantic en esquemas.
3. Integridad con modelos relacionales y llaves foraneas.
4. Control de acceso por JWT + cookies + API key.
5. Trazabilidad de decisiones en predicciones/notificaciones.
6. Pruebas unitarias y de backtest en [BACKEND/app/tests](BACKEND/app/tests).

### 2.2 Estandares, normas, algoritmos, metodologias y herramientas
Estandares/protocolos:
1. HTTP/HTTPS.
2. REST.
3. JSON.
4. JWT (RFC 7519).
5. CORS.

Algoritmos:
1. Logistic Regression.
2. Random Forest.
3. KMeans.
4. Stacking (meta-model logistic).
5. SHAP para explicabilidad.

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

### 2.3 Bases de datos y estructuras de datos
1. Base de datos relacional (tablas transaccionales y de prediccion).
2. Tablas clave: users, transactions, qr_transactions, fraud_predictions, fraud_explanations.
3. Uso de ORM SQLAlchemy para consistencia y mantenibilidad.
4. Estructuras in-memory para features y respuestas JSON en backend.

Evidencia en modelos:
1. [BACKEND/app/models/transaction.py](BACKEND/app/models/transaction.py)
2. [BACKEND/app/models/qr_transaction.py](BACKEND/app/models/qr_transaction.py)
3. [BACKEND/app/models/fraud_prediction.py](BACKEND/app/models/fraud_prediction.py)

### 2.4 Eleccion de lenguajes
1. Python para backend, IA y scripts de entrenamiento.
2. TypeScript/JavaScript para frontend.
3. SQL para consultas y modelado de datos.

Justificacion:
1. Python tiene ecosistema fuerte para IA y APIs.
2. TypeScript reduce errores en interfaz y contratos.
3. SQL relacional es apropiado para auditoria e integridad transaccional.

## 7.2 Modulo 3. Sistemas Robustos, Paralelos y Distribuidos
### 3.1 Dominio de algoritmos
Se demuestra al combinar:
1. Clasificacion supervisada (logistic y random forest).
2. Deteccion de anomalias (kmeans score).
3. Fusion por stacking.
4. Reglas de decision por umbrales y contexto del usuario.

### 3.2 Dominio de herramienta utilizada
Herramientas dominadas y evidenciadas en codigo:
1. FastAPI para API robusta.
2. SQLAlchemy para capa de datos.
3. scikit-learn para entrenamiento e inferencia.
4. Next.js para cliente web y panel.

### 3.3 Restriccion: no valido servidor local
Estado actual:
1. El proyecto corre en local para desarrollo/pruebas.

Como defender cumplimiento formal:
1. Frontend desplegado en servicio cloud (ejemplo: Vercel).
2. Backend desplegado en servicio cloud (ejemplo: Render/Fly.io/Azure App Service).
3. Base de datos administrada en la nube (ejemplo: Neon/Supabase/RDS).
4. Comunicacion por HTTPS entre componentes en equipos diferentes.

Mensaje para comite:
La arquitectura esta desacoplada y lista para despliegue distribuido; local se usa solo para desarrollo.

### 3.4 Justificacion de protocolos
1. HTTPS/REST por simplicidad, interoperabilidad y trazabilidad.
2. JWT + cookies para autenticacion de sesion de usuario.
3. X-API-Key para identificar/aislar comercios en endpoints de pago.

### 3.5 Distribucion del trabajo en entidades funcionales
1. Cliente (Frontend): visualizacion y operacion.
2. API (Backend): logica de negocio y seguridad.
3. Motor IA (dentro del backend): scoring y explicabilidad.
4. Base de datos: persistencia y analitica historica.

### 3.6 Sistema descentralizado/concurrente (opciones aplicables)
Implementacion actual defendible:
1. 3.1.1 Componentes concurrentes: API ASGI atiende multiples solicitudes.
2. 3.1.4 Procesamiento de calculos distribuido por capas: cliente, API, motor IA y BD.

Elemento en roadmap para fortalecer modulo:
1. 3.1.6 Informacion en tiempo real por sockets: existe router websocket pero vacio en [BACKEND/app/routers/websocket.py](BACKEND/app/routers/websocket.py).

## 7.3 Modulo 4. Computo Flexible (SoftComputing)
### 4.1 Ramas de IA cubiertas
Cubre de forma directa:
1. 4.1.2 Aprendizaje automatico.
2. 4.1.9 Arboles de decision (Random Forest).
3. 4.1.10 Mineria de datos (dataset historico y entrenamiento).

### 4.2 Representacion del modelo matematico
Variables de entrada:
x = [amount, amount_vs_avg, tx_24h, card_tx_24h, qr_tx_24h, hour, day_of_week, failed_attempts, is_international]

Modelos base:
1. p_log = LogisticRegression(x)
2. p_rf = RandomForest(x_rf)
3. s_km = min_j ||z - c_j|| (distancia minima a centroides), normalizada a [0,1]

Meta-modelo (stacking):
1. x_meta = [p_log, p_rf, s_km]
2. p_final = LogisticRegression_meta(x_meta)
3. label = 1 si p_final >= 0.5, en otro caso 0

Decision operativa:
1. if p_final >= block_threshold -> block/review segun contexto
2. elif p_final >= review_threshold -> review
3. else -> allow

### 4.3 Justificacion de algoritmos
1. Logistic Regression: base interpretable y estable.
2. Random Forest: mejor captura de no linealidad.
3. KMeans: detecta rareza fuera de patrones normales.
4. Stacking: mejora robustez al combinar perspectivas complementarias.
5. SHAP: habilita explicaciones entendibles para auditoria/comite.

### 4.4 Analisis y estadisticas (muestra >= 35)
Evidencia actual del dataset principal:
1. Archivo: [BACKEND/app/utils/fraud_ai_dataset_v3.csv](BACKEND/app/utils/fraud_ai_dataset_v3.csv)
2. Registros: 300000 (muy superior a 35).
3. Variables: 17 columnas.
4. Tasa de fraude aproximada: 2%.
5. Canales: card y qr.

Adicional:
1. Existen scripts de entrenamiento y backtest.
2. Existen pruebas de comportamiento del ensemble y KMeans.

## 8. Riesgos Reales y Respuestas para Defensa
## 8.1 Pregunta dificil: "Donde esta exactamente la IA?"
Respuesta corta:
La IA esta en [BACKEND/app/ml](BACKEND/app/ml); en inferencia vive en [BACKEND/app/ml/predictors/fraud_ensemble.py](BACKEND/app/ml/predictors/fraud_ensemble.py), y se invoca desde [BACKEND/app/services/transaction_service.py](BACKEND/app/services/transaction_service.py) y [BACKEND/app/services/qr_transaction_service.py](BACKEND/app/services/qr_transaction_service.py).

## 8.2 Pregunta dificil: "Como justifican decisiones de bloqueo?"
Respuesta corta:
No solo se usa score global; tambien se guardan scores por modelo y explicaciones SHAP para auditar cada decision en [BACKEND/app/queries/prediction_queries.py](BACKEND/app/queries/prediction_queries.py).

## 8.3 Pregunta dificil: "Como cumplen distribuido si lo corren en local?"
Respuesta corta:
Local es solo entorno de desarrollo; la arquitectura es cliente-servidor desacoplada y se despliega en nodos separados (frontend cloud, backend cloud y BD cloud) para cumplimiento formal de la restriccion.

## 8.4 Pregunta dificil: "Que evidencia de calidad tienen?"
Respuesta corta:
Pruebas unitarias y de backtest en [BACKEND/app/tests](BACKEND/app/tests), validacion de entrada con schemas Pydantic, y persistencia estructurada con SQLAlchemy.

## 8.5 Pregunta dificil: "Que mejorarian para produccion?"
Respuesta corta:
1. Externalizar secretos (SECRET_KEY) a variables de entorno.
2. Activar secure=True en cookies bajo HTTPS.
3. Completar websocket en tiempo real.
4. Formalizar pipeline MLOps de reentrenamiento y monitoreo de drift.

## 9. Guion de Exposicion de 5-7 minutos
1. Problema: fraude en pagos digitales y costo operativo.
2. Solucion: FraudAI como plataforma de deteccion + explicabilidad + revision.
3. Flujo punta a punta: login -> transaccion -> scoring IA -> decision -> dashboard.
4. IA en detalle: 3 modelos base + stacking + SHAP.
5. Cobertura de modulos 2, 3 y 4 con evidencia en codigo.
6. Cierre: impacto, trazabilidad, y plan de despliegue distribuido en nube.

## 10. Conclusion
FraudAI no es solo un modelo de IA aislado: es un sistema completo de informacion para fraude, con flujo operativo, persistencia auditable y decisiones explicables.
Esto permite defender el proyecto de forma tecnica y clara ante el comite, alineado a los modulos de gestion TI, sistemas distribuidos y computo flexible.
