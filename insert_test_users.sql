-- Script para insertar usuarios de prueba en la tabla auth_users
-- IMPORTANTE: Reemplaza los hashes con hashes reales generados con el script generate_password_hash.py

-- Primero, asegúrate de que exista al menos un rol
INSERT INTO public.roles (role_name) 
VALUES ('admin'), ('user'), ('analyst') 
ON CONFLICT (role_name) DO NOTHING;

-- Obtener el ID del rol admin
-- Esto es necesario para la insercción de usuarios

-- Usuario 1: Admin
INSERT INTO public.auth_users (email, password_hash, full_name, role_id, is_active)
SELECT 
  'admin@fraudai.com' as email,
  '$argon2id$v=19$m=65540,t=3,p=4$c29tZXNhbHQ$TZhKAJ4iM6jJq3xkjR8dkqLc8oW6c8kLq8pJ8mN7bQ' as password_hash,
  'Admin User' as full_name,
  role_id,
  true
FROM public.roles 
WHERE role_name = 'admin'
ON CONFLICT (email) DO NOTHING;

-- Usuario 2: Analyst
INSERT INTO public.auth_users (email, password_hash, full_name, role_id, is_active)
SELECT 
  'analyst@fraudai.com' as email,
  '$argon2id$v=19$m=65540,t=3,p=4$c29tZXNhbHQ$TZhKAJ4iM6jJq3xkjR8dkqLc8oW6c8kLq8pJ8mN7bQ' as password_hash,
  'Analyst User' as full_name,
  role_id,
  true
FROM public.roles 
WHERE role_name = 'analyst'
ON CONFLICT (email) DO NOTHING;

-- Usuario 3: Regular User
INSERT INTO public.auth_users (email, password_hash, full_name, role_id, is_active)
SELECT 
  'user@fraudai.com' as email,
  '$argon2id$v=19$m=65540,t=3,p=4$c29tZXNhbHQ$TZhKAJ4iM6jJq3xkjR8dkqLc8oW6c8kLq8pJ8mN7bQ' as password_hash,
  'Regular User' as full_name,
  role_id,
  true
FROM public.roles 
WHERE role_name = 'user'
ON CONFLICT (email) DO NOTHING;

-- Verificar que los usuarios fueron insertados
SELECT id, email, full_name, is_active, role_id, created_at 
FROM public.auth_users 
ORDER BY created_at DESC;

-- NOTA: Los hashes anteriores son ejemplos. Usa el script generate_password_hash.py para generar hashes reales
-- Contraseña de ejemplo usada: TestPassword123
-- Para usar diferentes contraseñas, sigue estos pasos:
-- 1. cd BACKEND
-- 2. python generate_password_hash.py
-- 3. Ingresa tu contraseña
-- 4. Copia el hash generado
-- 5. Reemplaza el hash en este script
-- 6. Ejecuta el script en tu base de datos
