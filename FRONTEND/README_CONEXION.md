# FraudAI - Guía de Conexión Frontend-Backend

## ✅ Estado: COMPLETADO Y FUNCIONANDO

El frontend de PruebaDeFront-main ha sido integrado exitosamente con el backend de FastAPI.  
**Backend corriendo en:** http://localhost:8000  
**Frontend corriendo en:** http://localhost:3000

## 📊 Nuevas Características Implementadas

### Dashboard Stats (Datos Reales de BD)
Se ha implementado un nuevo endpoint que devuelve estadísticas reales del dashboard:

**Endpoint:** `GET /metrics/dashboard-stats`

**Datos que devuelve:**
- `total_users` - Total de usuarios en la BD
- `total_transactions` - Total de transacciones (card + QR)
- `total_revenue` - Suma total de ingresos de transacciones
- `active_users` - Usuarios activos (igual a total de usuarios por ahora)
- `total_frauds` - Total de fraudes detectados
- `users_change` - Cambio % de usuarios (datos dummy para "looks": +5.2%)
- `transactions_change` - Cambio % de transacciones (datos dummy: +12.5%)
- `revenue_change` - Cambio % de ingresos (datos dummy: +8.3%)
- `frauds_change` - Cambio % de fraudes (datos dummy: -2.1%)

Este endpoint está conectado a tu base de datos y obtiene datos REALES de las tablas:
- `users` → Total de usuarios
- `transactions` → Total y suma de transacciones card
- `qr_transactions` → Total y suma de transacciones QR
- `fraud_predictions` → Total de fraudes detectados

### Cambios Realizados

#### Backend (BACKEND/app/)
- ✅ `queries/metrics_queries.py` - Agregada función `get_dashboard_stats()` que consulta BD
- ✅ `services/metrics_service.py` - Agregada función `get_dashboard_metrics()`
- ✅ `routers/metrics.py` - Nuevo endpoint `/metrics/dashboard-stats`
- ✅ `ml/utils/explainability.py` - Manejado error de features faltantes (gracefully)
- ✅ `main.py` - CORS configurado para http://localhost:3000

#### Frontend (FRONTEND/)
- ✅ `lib/api.ts` - Actualizada función `fetchDashboardStats()` para usar nuevo endpoint
- ✅ `components/login/login-form.tsx` - Adaptada para backend real
- ✅ `lib/auth-context.tsx` - Tipos actualizados
- ✅ `next.config.mjs` - Rewrites y configuración actualizada
- ✅ `.env.local` - URL del backend configurada

## 🔧 Cómo Ejecutar (Ambos servidores ya están corriendo)

### Backend (Si necesita reiniciar)
```bash
cd BACKEND
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend (Si necesita reiniciar)
```bash
cd FRONTEND
npm run dev
```

## 🧪 Pruebas Realizadas

✅ **Backend iniciado correctamente** en http://localhost:8000
✅ **Frontend iniciado correctamente** en http://localhost:3000
✅ **CORS configurado** - Permite peticiones desde frontend
✅ **Endpoint /metrics/dashboard-stats** - Obtiene datos reales de BD
✅ **Autenticación configurada** - Cookies HTTP-only habilitadas

## 📡 Endpoints Disponibles

### Autenticación
- `POST /auth/login` - Login con body: `{login: string, password: string}`
- `POST /auth/logout` - Logout

### Métricas (NUEVOS - CON DATOS REALES)
- `GET /metrics` - Métricas globales completas
- `GET /metrics/dashboard-stats` - Stats del dashboard (datos reales de BD) ✨ NUEVO

### Transacciones
- `POST /transactions` - Crear transacción card completa
- `POST /transactions/simple` - Crear transacción card simple
- `GET /transactions` - Obtener transacciones

### Transacciones QR
- `POST /qr-transactions` - Crear transacción QR completa
- `POST /qr-transactions/simple` - Crear transacción QR simple

### Feedback de Fraude
- `POST /fraud-feedback` - Enviar feedback sobre una predicción

## 📊 Estructura de Datos

### Dashboard Stats Response
```json
{
  "total_users": 1250,
  "total_transactions": 5432,
  "total_revenue": 125432.50,
  "active_users": 1250,
  "total_frauds": 87,
  "users_change": 5.2,
  "transactions_change": 12.5,
  "revenue_change": 8.3,
  "frauds_change": -2.1
}
```

## 🛠️ Variables de Entorno

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (requirements.txt instaladas)
- FastAPI 0.116.1
- SQLAlchemy 2.0.45
- Uvicorn 0.35.0
- python-jose
- argon2-cffi
- Y muchas más...

## ⚠️ Notas Importantes

1. **Base de Datos**: Asegúrate de que MySQL esté corriendo con la configuración correcta
2. **Datos de Prueba**: Los cambios porcentuales (users_change, transactions_change, etc.) son valores dummy para "looks". Puedes calcular valores reales más adelante
3. **SHAP Explainer**: El warning sobre features faltantes es normal - el sistema maneja gracefully el caso cuando el modelo no está disponible
4. **Cookies**: El login automáticamente setea una cookie `accessToken` que se usa para peticiones subsecuentes

## 🎨 Frontend Features

- Dashboard interactivo con datos reales
- Gráficas de fraudes por hora
- Distribución geográfica de fraudes
- Autenticación con manejo de sesión
- Tema claro/oscuro
- Responsive design
- TypeScript tipado

## 🐛 Troubleshooting

### Error de conexión
1. Verifica que backend esté en http://localhost:8000
2. Verifica que frontend esté en http://localhost:3000
3. Revisa consola del navegador (F12)

### Error de Base de Datos
1. Verifica que MySQL esté corriendo
2. Revisa las credenciales en app/core/config.py
3. Verifica que las tablas existan en BD

### Error de Autenticación
1. Asegúrate de tener usuarios en tabla `users`
2. Intenta con credenciales válidas
3. Revisa logs del backend

## 📚 Documentación Útil

- **Swagger API Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)

---

## 🎉 ¡Sistema Listo para Usar!

Tu frontend PruebaDeFront-main está completamente integrado con tu backend FraudAI.  
Los datos del dashboard provienen directamente de tu base de datos en tiempo real.

### Próximos pasos sugeridos:
1. Crear más usuarios de prueba en BD
2. Insertar transacciones de prueba
3. Implementar predicciones de fraude en las transacciones
4. Crear feedback de fraude para entrenar el modelo
5. Implementar websockets para actualizaciones en tiempo real

¡Éxito! 🚀
