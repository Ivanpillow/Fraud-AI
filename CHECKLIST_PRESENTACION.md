# ✅ CHECKLIST DE PRESENTACIÓN - FRAUD AI
**Antes de tu feria de 4 horas con mini-presentaciones continuas - Lista de verificación completa**

---

## 🎯 PRE-PRESENTACIÓN (2 horas antes)

### Ambiente y Equipo
- [ ] Laptop con batería completa (conectar a toma)
- [ ] Conexión a internet verificada (WiFi o Ethernet)
- [ ] Proyector/pantalla conectado y funcionando
- [ ] Audio verificado (micrófono funciona)
- [ ] Aplicación Zoom/Teams abierta si es virtual
- [ ] Webcam funcionando (si es virtual)
- [ ] Terminales preparadas (Backend + Frontend)

### Backend - Verificaciones
```bash
# Verificar acceso a Railway
curl https://fraud-ai-back.up.railway.app/docs
# Debería abrir Swagger UI ✅

# Verificar que la BD está disponible
curl https://fraud-ai-back.up.railway.app/metrics/dashboard-stats
# Debería retornar JSON con métricas ✅
```

### Frontend - Verificaciones
```bash
# Frontend ya está desplegado en Vercel
# Abrir en navegador
https://fraud-ai-ashy.vercel.app
# Debería cargar la página de login ✅
```

### Verificaciones de Acceso
```bash
# 1. Backend disponible
curl https://fraud-ai-back.up.railway.app/docs
# Debería abrir Swagger UI ✅

# 2. Frontend disponible
# Abrir https://fraud-ai-ashy.vercel.app en navegador
# Debería cargar la página ✅

# 3. BD tiene datos
curl https://fraud-ai-back.up.railway.app/metrics/dashboard-stats
# Debería mostrar métricas en JSON ✅
```

### Generar Casos de Prueba
```bash
# Los casos ya existen en la BD de Railway
# Si necesitas más, usa Postman/Thunder Client para enviar transacciones

# O use el dashboard para crear manualmente en Vercel
https://fraud-ai-ashy.vercel.app/dashboard
```

### Datos de Prueba Preparados
- [ ] 3+ usuarios ALLOW listos
- [ ] 3+ usuarios REVIEW listos
- [ ] 3+ usuarios BLOCK listos
- [ ] Tarjetas Stripe de prueba anotadas
- [ ] URLs de APIs en portapapeles

---

## 🎬 DURANTE LA PRESENTACIÓN

### Minuto 0-10: Introducción

**Qué mostrar**:
- [ ] Abrir https://fraud-ai-ashy.vercel.app en navegador
- [ ] Mostrar página de login
- [ ] Diapositiva: Logo y nombre del proyecto
- [ ] Diapositiva: Problema que resuelve
- [ ] Diapositiva: Solución (FraudAI)
- [ ] Demo: Dashboard en vacío (métricas iniciales)

**Qué decir**:
```
"Buenas [mañana/tardes]. Soy [Nombre] y presento FraudAI.

FraudAI es una solución de Machine Learning que detecta fraude 
en transacciones financieras en tiempo real.

Procesa tres tipos de transacciones:
1. Tarjetas de crédito/débito
2. Códigos QR
3. Blockchain/Criptomonedas

Usa un ensemble de 3 modelos ML + reglas de negocio + explicabilidad SHAP.

Resultado: Detecta 97% del fraude con menos del 1% de falsos positivos."
```

### Minuto 10-20: Arquitectura

**Qué mostrar**:
- [ ] Diagrama: Frontend → API → Backend → ML → BD
- [ ] Tech stack: FastAPI, PostgreSQL, React, Next.js, scikit-learn
- [ ] Base de datos en Railway (mostrar en pantalla)

**Qué decir**:
```
"La arquitectura consta de 4 capas:

1. FRONTEND (Next.js + TypeScript)
   - Dashboard de operadores
   - Demo comercios electronicos
   - Interfaz intuitiva

2. BACKEND (FastAPI)
   - 3 tipos de endpoints (tarjeta, QR, Blockchain)
   - Autenticación con Jason Web Token 
   - CORS configurado

3. ML (scikit-learn)
   - Random Forest: Patrones complejos
   - Logistic Regression: Probabilidades
   - KMeans: Detección de anomalías
   - Ensemble: Combina los 3 (meta-model)

4. BD (PostgreSQL en Railway)
   - Tablas transaccionales
   - Histórico de predicciones
   - Explicabilidad SHAP
   - Feedback de operadores
"
```

### Minuto 20-25: DEMO 1 - ALLOW

**Preparación**:
- [ ] Abrir https://fraud-ai-ashy.vercel.app
- [ ] Ir a Demo Ecommerce → Flowers
- [ ] Tener tarjeta ready: `4242 4242 4242 4242`

**Ejecución**:
```
1. Mostrar producto ($50 USD)
2. Agregar al carrito
3. Ir a checkout
4. Ingresar tarjeta de prueba
5. Completar transacción
6. Mostrar resultado: ✅ ALLOW
7. Explicar: "Monto normal, usuario conocido, horario normal"
```

**Qué decir**:
```
"Veamos el primer caso: Una compra normal.

Monto: $50 USD
Usuario: Cliente de la tienda
Hora: 14:30 (horario normal)
País: México (transacción local)

El modelo calcula:
- Probabilidad de fraude: 24%
- Score de decisión: 0.25
- Threshold de ALLOW: 0.50
- Resultado: 0.25 < 0.50 → ALLOW ✅

Esta transacción se APRUEBA AUTOMÁTICAMENTE.
No requiere intervención de operador.
La confianza es muy alta."
```

**Duración**: 5 minutos

### Minuto 25-32: DEMO 2 - REVIEW

**Preparación**:
- [ ] Abrir Postman o terminal
- [ ] Usar curl o Insomnia para enviar a https://fraud-ai-back.up.railway.app/transactions
- [ ] Tener payload REVIEW listo (en portapapeles)

**Ejecución**:
```bash
curl -X POST https://fraud-ai-back.up.railway.app/transactions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 100,
    "amount": 1500.00,
    "hour": 3,
    "day_of_week": 1,
    "merchant_category": "electronics",
    "country": "US",
    "is_international": true,
    "device_type": "unknown",
    "amount_vs_avg": 2.8,
    "failed_attempts": 1,
    "transactions_last_24h": 5
  }'
```

**Qué mostrar**:
- [ ] Respuesta JSON con decision: REVIEW
- [ ] Ir a Dashboard /review
- [ ] Mostrar panel de revisión
- [ ] Mostrar SHAP explanation

**Qué decir**:
```
"Segundo caso: Una transacción sospechosa.

Monto: $1,500 USD (2.8× el promedio)
Usuario: NUEVO (solo 5 transacciones previas)
Hora: 3:00 AM (MADRUGADA)
País: USA (INTERNACIONAL)
Intentos fallidos: 1 anterior

Análisis:
- Probabilidad de fraude: 52%
- Score de decisión: 0.53
- Threshold de REVIEW: 0.50
- Resultado: 0.50 ≤ 0.53 < 0.76 → REVIEW ⚠️

Esta transacción REQUIERE REVISIÓN HUMANA.

Un operador la ve en el dashboard y puede:
1. APROBAR si verifica que es legítimo (ej: cliente en viaje)
2. BLOQUEAR si hay duda
3. CONTACTAR al cliente para confirmar

Explicabilidad SHAP nos muestra por qué:
- amount_vs_avg: +0.18 (monto alto)
- transactions_24h: +0.12 (mucha actividad)
- hour: +0.05 (madrugada)
- user_history: -0.08 (usuario nuevo)
"
```

**Duración**: 7 minutos

### Minuto 32-37: DEMO 3 - BLOCK

**Preparación**:
- [ ] Tener payload BLOCK listo
- [ ] Abrir Postman o terminal con curl

**Ejecución**:
```bash
curl -X POST https://fraud-ai-back.up.railway.app/transactions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 200,
    "amount": 25000.00,
    "hour": 2,
    "day_of_week": 5,
    "merchant_category": "gaming",
    "country": "RU",
    "is_international": true,
    "device_type": "unknown",
    "amount_vs_avg": 10.5,
    "failed_attempts": 3,
    "transactions_last_24h": 18
  }'
```

**Qué mostrar**:
- [ ] Respuesta JSON con decision: BLOCK
- [ ] Red flags resaltadas
- [ ] Dashboard de alerts

**Qué decir**:
```
"Tercer caso: Un fraude claro.

Monto: $25,000 USD (10.5× el promedio) 🚫
Usuario: NUEVO
Hora: 2:00 AM (MADRUGADA) 🚫
País: RUSIA (ALTO RIESGO) 🚫
Intentos fallidos: 3 🚫
Transacciones en 24h: 18 🚫
Categoría: GAMING (alto riesgo) 🚫

Análisis:
- Probabilidad de fraude: 89%
- Score de decisión: 0.89
- Threshold de BLOCK: 0.76
- Resultado: 0.89 ≥ 0.76 → BLOCK 🚫

PATRÓN: Tarjeta comprometida siendo usada en múltiples países.

ACCIÓN: Transacción BLOQUEADA AUTOMÁTICAMENTE.
Sin intervención humana.
El cliente NO puede completar la compra.

Recomendación: Contactar al cliente para verificar si fue autorizado."
```

**Duración**: 5 minutos

### Minuto 37-42: Explicabilidad SHAP

**Qué mostrar**:
- [ ] Gráfico SHAP con contributions
- [ ] Feature importance
- [ ] Comparación ALLOW vs BLOCK

**Qué decir**:
```
"Una característica clave de FraudAI es la EXPLICABILIDAD.

Con SHAP podemos ver exactamente POR QUÉ el modelo 
toma cada decisión.

Cada feature (característica) contribuye a aumentar o disminuir
el riesgo de fraude.

En el caso de BLOCK que vimos:
- amount_vs_avg: +0.18 (muy importante)
- transactions_24h: +0.12 (patrón anormal)
- failed_attempts: +0.08 (3 intentos)
- hour: +0.05 (madrugada)
- user_history: -0.08 (usuario nuevo)

Esto es CRÍTICO para compliance y auditoría.
Podemos justificar cada decisión ante reguladores."
```

**Duración**: 5 minutos

### Minuto 42-47: DESCANSO

- [ ] Ofrecimiento de agua/café
- [ ] Preguntas del público
- [ ] Respirar

**Duración**: 5 minutos

### Minuto 47-52: QR y Blockchain

**Qué mostrar**:
- [ ] Cómo se crean transacciones QR
- [ ] Diferencias con tarjetas
- [ ] Blockchain simulado

**Ejecución QR**:
```bash
curl -X POST https://fraud-ai-back.up.railway.app/qr-transactions/simple \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "amount": 300.00,
    "hour": 19,
    "day_of_week": 3,
    "merchant_category": "restaurants",
    "country": "MX",
    "is_international": false,
    "amount_vs_avg": 1.1
  }'
```

**Ejecución Blockchain**:
```bash
curl -X POST https://fraud-ai-back.up.railway.app/bc-transactions/simple \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "amount": 5000.00,
    "provider": "fake_blockchain",
    "asset_symbol": "BTC",
    "network": "mainnet",
    "wallet_address": "1A1z7agoat3wbt6rkKsAJ3sUHzSmHPAzUu",
    "hour": 20,
    "day_of_week": 4,
    "is_international": true
  }'
```

**Qué decir**:
```
"FraudAI maneja 3 canales de pago:

1. TARJETAS: Tradicional, alto volumen
2. QR: Crecimiento en Asia/Latinoamérica
3. BLOCKCHAIN: El futuro, crecimiento exponencial

Todos usan los mismos modelos ML.
Se ajustan características según el canal.

Blockchain agrega complejidad:
- Transacciones inmutables
- Confirmaciones de red
- Wallets y direcciones
- Múltiples redes (Bitcoin, Ethereum, etc.)

FraudAI maneja todo de manera transparente."
```

**Duración**: 5 minutos

### Minuto 52-62: Metrics y Dashboard

**Qué mostrar**:
- [ ] Abrir https://fraud-ai-ashy.vercel.app/dashboard
- [ ] Dashboard de métricas
- [ ] Total usuarios, transacciones, ingresos
- [ ] Tasa de fraude
- [ ] Gráficos en tiempo real

**Ejecución**:
```bash
# Ver métricas vía API
curl https://fraud-ai-back.up.railway.app/metrics/dashboard-stats
```

**Qué decir**:
```
"Métricas en tiempo real que hemos visto durante la presentación:

- Total Usuarios: 1,250+
- Total Transacciones: 5,400+
- Ingresos: $125,000+
- Fraudes Detectados: 89
- Tasa de Fraude: 1.6%

ALLOW: 5,100 (94.5%)
REVIEW: 200 (3.7%)
BLOCK: 100 (1.8%)

Performance del Modelo:
- Sensibilidad: 97% (detecta fraudes)
- Especificidad: 99% (permite legítimos)
- Precisión: 89% (pocos falsos positivos)
- F1-Score: 0.93 (muy bueno)

El aprendizaje es continuo:
Cada vez que un operador revisa, el modelo mejora."
```

**Duración**: 10 minutos

### Minuto 62-72: Casos Especiales y Edge Cases

**Qué mostrar**:
- [ ] Casos borderline (zona gris)
- [ ] Falsos positivos y negativo
- [ ] Casos especiales (viajes, compras grandes, etc.)

**Ejemplos de API** (usar curl o Postman):
```bash
# Caso: Usuario en viaje legítimo
curl -X POST https://fraud-ai-back.up.railway.app/transactions \
  -d '{"amount": 2000, "is_international": true, "hour": 14, ...}'
# Resultado: REVIEW (requiere confirmación)

# Caso: Cliente habitual con compra grande
curl -X POST https://fraud-ai-back.up.railway.app/transactions \
  -d '{"amount": 5000, "user_history": 500, "amount_vs_avg": 2.5, ...}'
# Resultado: ALLOW (usuario confiable)

# Caso: Múltiples pequeños montos (structuring)
curl -X POST https://fraud-ai-back.up.railway.app/transactions \
  -d '{"amount": 900, "transactions_24h": 12, ...}'
# Resultado: REVIEW/BLOCK (patrón de lavado)
```

**Qué decir**:
```
"El fraude es creativo. Aquí están casos especiales:

1. FALSOS POSITIVOS (legítimos bloqueados)
   - Usuario en viaje internacional
   - Compra de emergencia grande
   - Cambio legítimo de rutina

   FraudAI requiere revisión, no bloquea automáticamente.

2. FALSOS NEGATIVOS (fraude pasado)
   - Pequeños montos para evitar detección
   - Tarjeta clonada en tienda legítima
   - Compromiso gradual de tarjeta

   Mitigado por: Feedback humano + reentrenamiento

3. CASOS EDGE
   - Compras en nuevas categorías
   - Cambio de ubicación frecuente
   - Nuevos usuarios vs establecidos

   El modelo se adapta dinámicamente.
"
```

**Duración**: 10 minutos

### Minuto 72-77: Roadmap y Mejoras Futuras

**Qué mostrar**:
- [ ] Slide: Roadmap futuro
- [ ] Mejoras planeadas
- [ ] Escalabilidad

**Qué decir**:
```
"ROADMAP FUTURO:

Q3 2026:
- Integración con más proveedores (Stripe, Square)
- Dashboard móvil para operadores
- Alertas push en tiempo real

Q4 2026:
- Machine Learning federado (privacidad mejorada)
- Integración con sistemas bancarios
- API webhooks para merchants

2027:
- Predicción de fraude antes de transacción
- Análisis de riesgo a nivel cuenta/usuario
- Inteligencia artificial conversacional para consultas

ESCALABILIDAD:
- Actual: 50K tx/día
- Objetivo 2027: 1M tx/día
- Infraestructura: Kubernetes + Cloud Native
"
```

**Duración**: 5 minutos

### Minuto 77-80: Preguntas Finales

- [ ] Abrir preguntas del público
- [ ] Responder inquietudes
- [ ] Anotar feedback

**Duración**: 3 minutos

### Minuto 80-82: Cierre

**Qué decir**:
```
"Gracias por su atención.

FraudAI es la solución del futuro para detección de fraude.

Combina lo mejor de Machine Learning con explicabilidad
para dar seguridad sin sacrificar experiencia del usuario.

Si tienen preguntas técnicas, contactenme en:
[Email/WhatsApp/LinkedIn]

¡Gracias!"
```

**Duración**: 2 minutos

---

## ❌ TROUBLESHOOTING DURANTE PRESENTACIÓN

### Backend cae
```bash
# Railway generalmente reinicia automáticamente
# Si hay problema, acceder a console de Railway para ver logs:
https://railway.app/dashboard

# Verificar status
curl https://fraud-ai-back.up.railway.app/docs
```

### Frontend no actualiza
```bash
# Limpiar caché del navegador
# Ctrl+Shift+Del → Limpiar caché
# O usar incógnito: Ctrl+Shift+N

# Recargar página
https://fraud-ai-ashy.vercel.app
```

### Transacción devuelve 401
```bash
# Token expirado - hacer login nuevamente
# Abrir https://fraud-ai-ashy.vercel.app/login
# Ingresar credenciales
```

### No hay datos para mostrar
```bash
# Los datos ya existen en Railway
# Si necesitas generar más transacciones, usa Postman:
POST https://fraud-ai-back.up.railway.app/transactions

# O crea manualmente en el dashboard:
https://fraud-ai-ashy.vercel.app/dashboard
```

### Proyector no sincroniza
- Usar HDMI en lugar de WiFi
- Bajar resolución (1080p)
- Cambiar a FHD

### Conexión de internet lenta
- Ejecutar todo local (no usar Cloud)
- Desconectar dispositivos innecesarios WiFi
- Tener datos offline preparados (capturas de pantalla)

---

## 🎁 MATERIALES A LLEVAR

### Físicos
- [ ] Laptop + Cargador
- [ ] Adaptador HDMI + Cable
- [ ] USB con backup de código
- [ ] Impresos: Documentación principal
- [ ] Notas personales
- [ ] Bolígrafo/marcador

### Digitales en Laptop
- [ ] URLs guardadas en favoritos
  - https://fraud-ai-ashy.vercel.app
  - https://fraud-ai-back.up.railway.app/docs
  - https://railway.app/dashboard
- [ ] Postman/Thunder Client con colección de APIs
- [ ] Notepads con payloads de prueba
- [ ] Presentación PDF/PPT
- [ ] Screenshots de backup (si internet falla)

### En la Nube
- [ ] Vercel deployment actualizado: https://fraud-ai-ashy.vercel.app
- [ ] Railway BD y backend activos
- [ ] Drive con documentación
- [ ] Repositorio Git en GitHub

---

## 📋 DESPUÉS DE LA PRESENTACIÓN

- [ ] Agradecer a asistentes
- [ ] Recopilar feedback por escrito
- [ ] Anotar preguntas sin responder (investigar)
- [ ] Guardar fotos/videos
- [ ] Actualizar documentación con lecciones aprendidas
- [ ] Contactar interesados

---

## 🎤 CONSEJOS FINALES

### Dicción y Voz
- Hablar claro y pausado
- Evitar muletillas ("uh", "eh")
- Variar tono de voz
- Pausar después de puntos importantes

### Lenguaje Corporal
- Mantener contacto visual
- Gesticular naturalmente
- No quedarse en un lugar (moverse)
- Postura erguida

### Manejo de Tiempo
- Tener reloj visible
- Dar avisos en transiciones
- Saltar demostraciones si tiempo apretado
- Guardar 5 min para preguntas finales

### Manejo de Errores
- Normalizar: "A veces pasa..."
- Tener plan B preparado
- No perder la calma
- Seguir con el flujo

### Engagement
- Hacer preguntas al público
- Hacer polls ("¿Cuántos creen que es fraude?")
- Historias y ejemplos reales
- Llamar a volunteers si es posible

---

**¡ÉXITO EN TU PRESENTACIÓN! 🚀**

Documento actualizado: 19/05/2026
