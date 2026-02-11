# Guía de Autenticación - FraudAI

## Sistema de Autenticación Actualizado

### Cómo Generar un Password Hash

Para generar hashes seguros de contraseñas usando Argon2, usa Python:

```python
from argon2 import PasswordHasher

ph = PasswordHasher()
password = "MySecurePassword123"
hash = ph.hash(password)
print(hash)  # Copia este hash a tu BD
```

O usa el script Python incluido en el backend:

```bash
cd BACKEND
python -c "
from argon2 import PasswordHasher
ph = PasswordHasher()
print(ph.hash('YourPassword123'))
"
```


## Flujo de Autenticación

### 1. **Login**
- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "test@example.com",
    "password": "MySecurePassword123"
  }
  ```
- **Response**:
  ```json
  {
    "userData": {
      "id": 1,
      "email": "test@example.com",
      "full_name": "Test User",
      "role": "admin"
    }
  }
  ```
- **Cookie**: Se setea automáticamente `accessToken` con JWT

### 2. **Validaciones**
- Email válido (RFC 5321)
- Usuario existe en tabla `auth_users`
- Usuario activo (`is_active = true`)
- Contraseña coincide con `password_hash`
- Si falla cualquier validación, devuelve HTTP 401 (Unauthorized)

### 3. **Token JWT**
El backend crea un JWT con:
```json
{
  "sub": "1",           // user.id
  "role": "admin"       // user.role.name
}
```

### 4. **Logout**
- **Endpoint**: `POST /auth/logout`
- **Acción**: Elimina la cookie `accessToken`



### Desde cURL/Postman
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "MySecurePassword123"
  }' \
  -c cookies.txt

# Para peticiones subsecuentes, usa -b cookies.txt
curl http://localhost:8000/auth/me -b cookies.txt
```

## 🔒 Seguridad

- Las contras estan Hashadas con Argon2 (algoritmo criptográfico seguro)
- En cuanto a cookies se tiene HTTP-only, SameSite=Lax (previene CSRF)
- El CORS esta configurado para localhost:3000 en desarrollo
- JWT: Firmado con clave secreta (ver `app/core/security.py`)

### Para Producción
Cambia en `app/routers/auth_router.py`:
```python
response.set_cookie(
    key="accessToken",
    ...
    secure=True,        # ← Cambiar a True (requiere HTTPS)
    ...
)
```

## Estructura de Usuario

El usuario devuelto por el login tiene esta estructura:

```typescript
interface User {
  id: number;           // De auth_users.id
  email: string;        // De auth_users.email
  name: string;         // De auth_users.full_name (mapeado a 'name')
}
```

## Problemas a tener en cuenta
### Error 401 (Unauthorized)
- Usuario no existe en tabla `auth_users`
- Contraseña es incorrecta
- Usuario probablemente incorrecto

### Error 403 (Forbidden)
- El usuario existe pero `is_active = false`
- Actualiza el usuario: `UPDATE auth_users SET is_active = true WHERE email = 'test@example.com'`

### Error de Validación en Frontend
- Email no es válido
- Contraseña no cumple requisitos (mínimo 8 caracteres, número y letra)

### Cookie no se setea
- Asegúrate que CORS esté configurado con `allow_credentials=True`
- Revisa que `credentials: "include"` esté en las opciones de fetch

