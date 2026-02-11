# 📚 Guía Completa del Frontend - FraudAI Dashboard

**Última actualización:** Febrero 10, 2026  
**Versión:** 1.0  
**Autor:** Sistema FraudAI

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Tecnologías y Stack](#tecnologías-y-stack)
4. [Estructura de Carpetas Completa](#estructura-de-carpetas-completa)
5. [Archivos de Configuración](#archivos-de-configuración)
6. [Sistema de Enrutamiento](#sistema-de-enrutamiento)
7. [Sistema de Autenticación](#sistema-de-autenticación)
8. [Comunicación con el Backend](#comunicación-con-el-backend)
9. [Páginas Principales](#páginas-principales)
10. [Componentes Reutilizables](#componentes-reutilizables)
11. [Hooks Personalizados](#hooks-personalizados)
12. [Sistema de Estilos](#sistema-de-estilos)
13. [Flujo de Datos](#flujo-de-datos)
14. [Agregar Nuevas Funcionalidades](#agregar-nuevas-funcionalidades)
15. [Troubleshooting Común](#troubleshooting-común)

---

## 1. Introducción

### ¿Qué es este proyecto?

FraudAI Frontend es un **dashboard administrativo moderno** construido con Next.js para la gestión y visualización de detección de fraudes en transacciones financieras. Permite a los administradores:

- Visualizar métricas en tiempo real
- Revisar transacciones sospechosas
- Aprobar o bloquear transacciones
- Analizar patrones de fraude
- Recibir notificaciones de eventos importantes

### Características Principales

- **Renderizado del lado del servidor (SSR)** con Next.js App Router
- **Diseño glassmorphism** moderno y responsivo
- **Autenticación segura** con JWT y cookies HTTP-only
- **Mobile-first** con diseño adaptable
- **Tema oscuro** como predeterminado
- **Accesible** siguiendo estándares WCAG

---

## 2. Arquitectura General

### Patrón de Diseño

El frontend sigue una arquitectura **basada en componentes** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────┐
│                   NAVEGADOR                          │
│  (Páginas renderizadas con React Server Components) │
└───────────────────┬─────────────────────────────────┘
                    │
    ┌───────────────┴────────────────┐
    │                                │
┌───▼────────┐              ┌───────▼──────┐
│  Páginas   │              │  Componentes │
│  (app/)    │◄────────────►│ (components/)│
└───┬────────┘              └───────┬──────┘
    │                               │
    │       ┌───────────────────────┘
    │       │
┌───▼───────▼───┐
│   Lógica de   │
│    Negocio    │
│    (lib/)     │
└───┬───────────┘
    │
┌───▼───────────┐
│  API Client   │
│   (api.ts)    │
└───┬───────────┘
    │
┌───▼───────────┐
│    Backend    │
│   FastAPI     │
│ (localhost:   │
│     8000)     │
└───────────────┘
```

### Flujo de Renderizado

1. **Usuario accede a una URL** → Next.js determina qué página renderizar
2. **Página se renderiza en el servidor** → React Server Components
3. **Datos se obtienen del backend** → API calls con fetch
4. **HTML se envía al cliente** → Hidratación de componentes interactivos
5. **Interacciones del usuario** → Actualización del estado + llamadas API

---

## 3. Tecnologías y Stack

### Core Framework

```json
{
  "next": "16.1.6",           // Framework React con SSR/SSG
  "react": "19.2.3",          // Librería de UI
  "typescript": "^5"          // Tipado estático
}
```

**¿Por qué Next.js?**
- Renderizado del lado del servidor (mejor SEO y performance)
- File-based routing (las carpetas = rutas)
- API routes integradas
- Optimización automática de imágenes
- Code splitting automático

### UI Components

```json
{
  "@radix-ui/react-*": "^1.x",  // Componentes accesibles sin estilos
  "lucide-react": "^0.544.0",   // Iconos SVG modernos
  "recharts": "2.15.0",         // Gráficas interactivas
  "next-themes": "^0.4.6"       // Sistema de temas (dark/light)
}
```

**¿Por qué Radix UI?**
- Componentes sin estilos (totalmente personalizables)
- Accesibilidad incorporada (ARIA, keyboard navigation)
- Headless (lógica sin UI predefinida)

### Estilos

```json
{
  "tailwindcss": "^4.0.0",        // CSS utility-first
  "autoprefixer": "^10.4.20",     // Prefijos CSS automáticos
  "postcss": "^8.4.49",           // Procesador CSS
  "class-variance-authority": "^0.7.1", // Variantes de componentes
  "tailwind-merge": "^2.6.0"      // Fusión inteligente de clases
}
```

**¿Por qué Tailwind?**
- Desarrollo rápido con clases utilitarias
- Bundle final más pequeño (purge de CSS no usado)
- Consistencia de diseño con tema centralizado
- Responsive design fácil

### Formularios y Validación

```json
{
  "react-hook-form": "^7.54.2",      // Manejo de formularios
  "@hookform/resolvers": "^3.9.1",   // Validadores
  "zod": "^3.24.1"                   // Schema validation
}
```

### Animaciones

```json
{
  "framer-motion": "^12.0.3"   // Animaciones fluidas
}
```

### Utilidades

```json
{
  "date-fns": "4.1.0",              // Manejo de fechas
  "clsx": "^2.1.1",                 // Concatenación de clases CSS
  "sonner": "^1.7.4",               // Notificaciones toast
  "vaul": "1.1.3"                   // Drawers móviles
}
```

---

## 4. Estructura de Carpetas Completa

### Vista General

```
FRONTEND/
├── 📁 app/                      # Páginas y rutas (Next.js App Router)
│   ├── 📄 layout.tsx             # Layout raíz (AuthProvider, fonts)
│   ├── 📄 page.tsx               # Página de inicio (redirect a dashboard)
│   ├── 📄 globals.css            # Estilos globales + variables CSS
│   └── 📁 dashboard/             # Rutas del dashboard
│       ├── 📄 layout.tsx          # Layout del dashboard (sidebar, header)
│       ├── 📄 page.tsx            # Dashboard principal (gráficas, stats)
│       ├── 📁 review/             # Página de revisión de fraudes
│       │   └── 📄 page.tsx
│       └── 📁 charts/             # Página de gráficas detalladas
│           └── 📄 page.tsx
│
├── 📁 components/               # Componentes reutilizables
│   ├── 📁 dashboard/             # Componentes específicos del dashboard
│   │   ├── 📄 sidebar.tsx         # Menú lateral de navegación
│   │   ├── 📄 mobile-sidebar.tsx  # Menú lateral móvil
│   │   ├── 📄 header.tsx          # Header con notificaciones y profile
│   │   ├── 📄 stat-card.tsx       # Tarjetas de estadísticas
│   │   ├── 📄 glass-card.tsx      # Tarjeta con efecto glassmorphism
│   │   ├── 📄 overview-chart.tsx  # Gráfica de overview
│   │   ├── 📄 location-chart.tsx  # Gráfica de ubicaciones
│   │   ├── 📄 transactions-hour-chart.tsx # Gráfica por hora
│   │   ├── 📄 payment-summary.tsx # Resumen de pagos
│   │   ├── 📄 notifications-panel.tsx # Panel de notificaciones
│   │   ├── 📄 profile-dropdown.tsx # Dropdown del perfil
│   │   ├── 📄 chart-type-selector.tsx # Selector de tipo de gráfica
│   │   └── 📁 review/             # Componentes de review
│   │       └── 📄 transaction-row.tsx # Fila de transacción
│   │
│   ├── 📁 login/                 # Componentes de login
│   │   └── 📄 login-form.tsx      # Formulario de inicio de sesión
│   │
│   ├── 📁 ui/                    # Componentes UI base (shadcn/ui)
│   │   ├── 📄 button.tsx          # Botón personalizable
│   │   ├── 📄 input.tsx           # Input de texto
│   │   ├── 📄 card.tsx            # Tarjeta base
│   │   ├── 📄 dialog.tsx          # Modal/diálogo
│   │   ├── 📄 dropdown-menu.tsx   # Menú desplegable
│   │   ├── 📄 avatar.tsx          # Avatar de usuario
│   │   ├── 📄 badge.tsx           # Badge/etiqueta
│   │   ├── 📄 tabs.tsx            # Pestañas
│   │   ├── 📄 chart.tsx           # Wrapper para recharts
│   │   ├── 📄 toast.tsx           # Notificación toast
│   │   └── ...                   # +40 componentes más
│   │
│   └── 📄 theme-provider.tsx     # Proveedor de tema (dark/light)
│
├── 📁 lib/                      # Lógica de negocio y utilidades
│   ├── 📄 api.ts                 # ⭐ Cliente API (comunicación con backend)
│   ├── 📄 auth-context.tsx       # ⭐ Context de autenticación (login, logout)
│   ├── 📄 utils.ts               # Utilidades generales (cn, clsx)
│   └── 📄 mock-data.ts           # Datos de prueba para la página default
│
├── 📁 hooks/                    # React Hooks personalizados
│   ├── 📄 use-mobile.tsx         # Hook para detectar dispositivos móviles
│   └── 📄 use-toast.ts           # Hook para mostrar notificaciones
│
├── 📁 public/                   # Archivos estáticos (accesibles desde /)
│   └── 📁 images/                # Imágenes, logos, etc.
│
├── 📁 styles/                   # Estilos adicionales (legacy)
│   └── 📄 globals.css
│
├── 📁 src/                      # Código legacy (MUI dashboard - NO USADO)
│   ├── 📁 dashboard/
│   ├── 📁 sign-in/
│   └── 📁 shared-theme/
│
├── 📄 .env.local                # ⭐ Variables de entorno (API_URL)
├── 📄 next.config.mjs           # Configuración de Next.js
├── 📄 tailwind.config.ts        # Configuración de Tailwind CSS
├── 📄 tsconfig.json             # Configuración de TypeScript
├── 📄 package.json              # Dependencias del proyecto
├── 📄 components.json           # Configuración de shadcn/ui
└── 📄 README.md                 # Documentación básica
```

### Archivos Críticos (⭐)

Estos son los archivos MÁS importantes para entender el proyecto:

1. **`lib/api.ts`** - Comunicación con backend
2. **`lib/auth-context.tsx`** - Manejo de autenticación
3. **`app/layout.tsx`** - Layout raíz con providers
4. **`app/dashboard/layout.tsx`** - Layout del dashboard
5. **`.env.local`** - URL del backend

---

## 5. Archivos de Configuración

### 5.1 `package.json`

**Propósito:** Define el proyecto, dependencias y scripts.

```json
{
  "name": "my-project",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev --turbo",      // Modo desarrollo con Turbopack
    "build": "next build",           // Build para producción
    "start": "next start",           // Servidor de producción
    "lint": "next lint"              // Linter de código
  },
  "dependencies": { ... }
}
```

**Scripts importantes:**
- `npm run dev` → Inicia servidor de desarrollo en `localhost:3000`
- `npm run build` → Genera build optimizado
- `npm start` → Corre build de producción

### 5.2 `next.config.mjs`

**Propósito:** Configuración de Next.js.

```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // No bloquear build por errores TS
  },
  images: {
    unoptimized: true,        // Deshabilitar optimización de imágenes
  },
  turbopack: {
    root: './',               // Raíz para Turbopack
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*', // Proxy a backend
      },
    ];
  },
};
```

**Características clave:**
- **Rewrites:** Permite hacer `fetch('/api/...')` en lugar de `fetch('http://localhost:8000/...')`
- **Turbopack:** Bundler ultra rápido (reemplazo de Webpack)
- **TypeScript flexible:** No bloquea el build por errores de tipos

### 5.3 `tailwind.config.ts`

**Propósito:** Configuración de Tailwind CSS.

```typescript
export default {
  darkMode: ["class"],  // Tema oscuro por clase CSS
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        // ... más colores
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

**Variables CSS:** Los colores se definen en `app/globals.css` con variables CSS.

### 5.4 `tsconfig.json`

**Propósito:** Configuración de TypeScript.

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]    // Permite imports como: import { X } from "@/lib/utils"
    }
  }
}
```

**Alias de imports:** `@/` apunta a la raíz del proyecto.

### 5.5 `.env.local`

**Propósito:** Variables de entorno (¡NO COMPARTIR EN GIT!).

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Importante:**
- Variables con `NEXT_PUBLIC_` son accesibles en el cliente
- Sin el prefijo, solo disponibles en el servidor
- Este archivo NO debe estar en git (está en `.gitignore`)

---

## 6. Sistema de Enrutamiento

Next.js usa **file-based routing**: la estructura de carpetas en `app/` define las rutas.

### Estructura de Rutas

```
app/
├── page.tsx                 → /              (Home - redirect)
└── dashboard/
    ├── page.tsx             → /dashboard    (Dashboard principal)
    ├── layout.tsx           → Layout compartido
    ├── review/
    │   └── page.tsx         → /dashboard/review
    └── charts/
        └── page.tsx         → /dashboard/charts
```

### Tipos de Archivos Especiales

| Archivo | Propósito | Obligatorio |
|---------|-----------|-------------|
| `page.tsx` | Define la página de una ruta | ✅ Sí |
| `layout.tsx` | Envuelve páginas hijas (navbar, sidebar) | ❌ No |
| `loading.tsx` | UI de carga mientras se carga la página | ❌ No |
| `error.tsx` | Manejo de errores | ❌ No |
| `not-found.tsx` | Página 404 | ❌ No |

### Ejemplo: `/dashboard/review`

**Ruta:** `http://localhost:3000/dashboard/review`

**Jerarquía de renderizado:**
```
app/layout.tsx (RootLayout)
  └── app/dashboard/layout.tsx (DashboardLayout)
      └── app/dashboard/review/page.tsx (ReviewPage)
```

---

## 7. Sistema de Autenticación

### 7.1 `lib/auth-context.tsx`

**Propósito:** Maneja el estado de autenticación globalmente usando React Context.

```typescript
// Proveedor de autenticación
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Login: guarda user y token
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    sessionStorage.setItem('auth_user', JSON.stringify(userData));
    sessionStorage.setItem('auth_token', authToken);
  };

  // Logout: limpia todo
  const logout = async () => {
    await logoutUser(); // Llama al backend
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useAuth() {
  return useContext(AuthContext);
}
```

### ¿Cómo funciona?

1. **Usuario ingresa credenciales** en `components/login/login-form.tsx`
2. **Se llama a `loginUser(email, password)`** en `lib/api.ts`
3. **Backend responde con:**
   ```json
   {
     "status": "ok",
     "userData": {
       "id": 1,
       "full_name": "Juan Pérez",
       "email": "juan@example.com",
       "role": "admin"
     }
   }
   ```
4. **Backend establece cookie HTTP-only** con el token JWT
5. **Frontend guarda `userData` en:**
   - `sessionStorage` (persiste en recarga de página)
   - `AuthContext` (accesible en toda la app)

### Storage vs Cookies

| Dato | Dónde se guarda | Propósito |
|------|-----------------|-----------|
| **JWT Token** | Cookie HTTP-only | 🔐 Seguro, no accesible por JS (protege contra XSS) |
| **User Data** | sessionStorage | 👤 Información del usuario (nombre, email, rol) |

**¿Por qué sessionStorage?**
- Persiste en recargas de página
- Se borra al cerrar la pestaña (más seguro que localStorage)

### 7.2 Flujo de Autenticación

```
┌────────────┐
│  Usuario   │
│ ingresa    │
│ email +    │
│ password   │
└─────┬──────┘
      │
      ▼
┌─────────────────────┐
│ components/login/   │
│   login-form.tsx    │
└─────┬───────────────┘
      │ loginUser(email, password)
      ▼
┌─────────────────────┐
│   lib/api.ts        │
│ POST /auth/login    │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│   Backend           │
│ - Verifica Argon2   │
│ - Genera JWT        │
│ - Set cookie        │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  AuthContext        │
│ login(userData,     │
│       token)        │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  Dashboard          │
│  (usuario           │
│   autenticado)      │
└─────────────────────┘
```

### 7.3 Protección de Rutas

**Actualmente:** No hay protección automática de rutas.

**Recomendación:** Agregar middleware en cada página:

```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !token) {
      router.push('/login'); // Redirect si no está autenticado
    }
  }, [user, token]);

  // ... resto del componente
}
```

---

## 8. Comunicación con el Backend

### 8.1 `lib/api.ts` - Cliente API

Este es el archivo MÁS IMPORTANTE para la comunicación con el backend.

**Configuración:**

```typescript
// URL base del backend (desde .env.local)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Cliente HTTP genérico
async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: string;
    token?: string;
  } = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Si hay token, agregarlo al header
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body,
    credentials: "include", // ⭐ Incluye cookies (JWT)
  });

  const data = await response.json();

  return {
    data: response.ok ? data : undefined,
    error: response.ok ? undefined : data.detail || "Error",
    status: response.status,
  };
}
```

**Características clave:**
- ✅ `credentials: "include"` → Envía cookies automáticamente
- ✅ Authorization header con Bearer token (opcional)
- ✅ Manejo de errores centralizado
- ✅ Tipos TypeScript genéricos

### 8.2 Funciones API Disponibles

#### Autenticación

```typescript
// Login
export async function loginUser(email: string, password: string) {
  return apiRequest<{
    userData: {
      id: number;
      full_name: string;
      email: string;
      role: string;
    };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Logout
export async function logoutUser(token?: string) {
  return apiRequest("/auth/logout", {
    method: "POST",
    token,
  });
}
```

#### Métricas

```typescript
// Dashboard stats (overview)
export async function fetchDashboardStats(token?: string) {
  return apiRequest<{
    total_users: number;
    total_transactions: number;
    total_revenue: number;
    active_users: number;
    total_frauds: number;
    users_change: number;
    transactions_change: number;
    revenue_change: number;
    frauds_change: number;
  }>("/metrics/dashboard-stats", { token });
}

// Métricas detalladas
export async function fetchMetrics(token?: string) {
  return apiRequest<{
    total_transactions: number;
    fraud_detected: number;
    fraud_rate: number;
    total_amount: number;
    avg_transaction: number;
    transactions_by_hour: Array<{ hour: number; count: number }>;
    device_traffic: Array<{ device: string; count: number }>;
    location_metrics: Array<{ location: string; count: number }>;
  }>("/metrics", { token });
}
```

#### Notificaciones y Review

```typescript
// Obtener notificaciones
export async function fetchNotifications(token?: string) {
  return apiRequest<Array<{
    id: string;
    prediction_id: number;
    type: "block" | "review";
    message: string;
    amount: number;
    timestamp: string;
    transaction_id: number;
    channel: string;
    fraud_probability: number;
  }>>("/notifications", { token });
}

// Actualizar decisión (aprobar/bloquear)
export async function updateNotificationDecision(
  predictionId: number,
  decision: "approve" | "block" | "review",
  token?: string
) {
  return apiRequest<{
    status: string;
    message: string;
    prediction_id: number;
    new_decision: string;
  }>(`/notifications/${predictionId}/decision`, {
    method: "PATCH",
    body: JSON.stringify({ decision }),
    token,
  });
}
```

### 8.3 Ejemplo de Uso en Componente

```typescript
// components/dashboard/stat-card.tsx
import { useEffect, useState } from "react";
import { fetchDashboardStats } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function StatCard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const result = await fetchDashboardStats(token);
      
      if (result.data) {
        setStats(result.data);
      } else {
        console.error("Error:", result.error);
      }
      
      setLoading(false);
    }

    if (token) {
      loadStats();
    }
  }, [token]);

  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      <h3>Total Usuarios: {stats.total_users}</h3>
      <h3>Total Transacciones: {stats.total_transactions}</h3>
    </div>
  );
}
```

### 8.4 Manejo de Errores

```typescript
// Patrón recomendado
const result = await fetchDashboardStats(token);

if (result.error) {
  // Manejar error
  console.error("Error:", result.error);
  
  if (result.status === 401) {
    // No autenticado → logout
    logout();
    router.push("/login");
  } else {
    // Otro error → mostrar mensaje
    toast.error(result.error);
  }
} else {
  // Éxito
  setData(result.data);
}
```

---

## 9. Páginas Principales

### 9.1 `app/page.tsx` - Home (Redirect)

**Ruta:** `/`

**Propósito:** Página de inicio que redirige automáticamente al dashboard.

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return null; // No renderiza nada
}
```

### 9.2 `app/dashboard/page.tsx` - Dashboard Principal

**Ruta:** `/dashboard`

**Propósito:** Vista principal con métricas, gráficas y estadísticas.

**Estructura:**

```typescript
export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Cargar datos del backend
    async function loadData() {
      const [statsResult, metricsResult] = await Promise.all([
        fetchDashboardStats(token),
        fetchMetrics(token),
      ]);

      setStats(statsResult.data);
      setMetrics(metricsResult.data);
    }

    if (token) loadData();
  }, [token]);

  return (
    <div>
      {/* Header */}
      <DashboardHeader title="Overview" breadcrumb="Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.total_users} />
        <StatCard title="Transactions" value={stats?.total_transactions} />
        <StatCard title="Revenue" value={stats?.total_revenue} />
        <StatCard title="Frauds" value={stats?.total_frauds} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <OverviewChart data={metrics?.transactions_by_hour} />
        <LocationChart data={metrics?.location_metrics} />
      </div>

      {/* Transactions Table */}
      <PaymentSummary />
    </div>
  );
}
```

**Componentes usados:**
- `<DashboardHeader>` - Título y breadcrumb
- `<StatCard>` - Tarjetas de estadísticas
- `<OverviewChart>` - Gráfica de transacciones
- `<LocationChart>` - Gráfica de ubicaciones
- `<PaymentSummary>` - Tabla de transacciones recientes

### 9.3 `app/dashboard/review/page.tsx` - Review de Fraudes

**Ruta:** `/dashboard/review`

**Propósito:** Revisar y aprobar/bloquear transacciones sospechosas.

**Estructura:**

```typescript
export default function ReviewPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState<"all" | "block" | "review">("all");

  useEffect(() => {
    async function loadTransactions() {
      const result = await fetchNotifications(token);
      
      if (result.data) {
        const txns = result.data.map(notif => ({
          id: notif.id,
          prediction_id: notif.prediction_id,
          transaction_id: notif.transaction_id,
          channel: notif.channel,
          status: notif.type as "block" | "review",
          amount: notif.amount,
          fraud_probability: notif.fraud_probability,
          timestamp: notif.timestamp,
          message: notif.message,
        }));
        
        setTransactions(txns);
      }
    }

    if (token) loadTransactions();
  }, [token]);

  const handleAction = async (id: string, action: "approve" | "block") => {
    // Remover de la lista local
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter(t => t.status === filter);

  return (
    <div>
      {/* Header */}
      <DashboardHeader title="Review" breadcrumb="Fraud Review" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard>
          <p>Total Flagged</p>
          <h2>{transactions.length}</h2>
        </GlassCard>
        <GlassCard>
          <p>Under Review</p>
          <h2>{transactions.filter(t => t.status === "review").length}</h2>
        </GlassCard>
        <GlassCard>
          <p>Blocked</p>
          <h2>{transactions.filter(t => t.status === "block").length}</h2>
        </GlassCard>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("review")}>Review</button>
        <button onClick={() => setFilter("block")}>Blocked</button>
      </div>

      {/* Transactions List */}
      <div className="flex flex-col gap-2">
        {filtered.map(txn => (
          <TransactionRow
            key={txn.id}
            transaction={txn}
            onAction={handleAction}
            token={token}
          />
        ))}
      </div>
    </div>
  );
}
```

**Interacciones:**
1. Usuario hace click en una transacción → Se expande
2. Usuario hace click en "Approve" o "Block"
3. Se llama a `updateNotificationDecision(prediction_id, decision, token)`
4. Backend actualiza la BD
5. Transacción se remueve de la lista (ya no está en "review")

### 9.4 `app/dashboard/charts/page.tsx` - Aqui se supone iran las graficas mas detalladas ehh, hay q pensar cuales usar

**Ruta:** `/dashboard/charts`

Tiene como proposito mas o menos ver todas las gráficas disponibles (transacciones por hora, dispositivos, ubicaciones).



## 10. Componentes Reutilizables

### 10.1 Componentes del Dashboard

#### `components/dashboard/sidebar.tsx`

**Propósito:** Menú lateral de navegación (desktop).

**Características:**
- Links a páginas (Dashboard, Review, Charts)
- Indicador de página activa
- Iconos de Lucide React
- Glassmorphism styling

```typescript
export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/review", label: "Review", icon: ShieldAlert },
    { href: "/dashboard/charts", label: "Charts", icon: BarChart3 },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-2 p-3",
            pathname === link.href && "bg-primary/10"
          )}
        >
          <link.icon size={20} />
          {link.label}
        </Link>
      ))}
    </aside>
  );
}
```

#### `components/dashboard/header.tsx`

**Propósito:** Header superior con notificaciones y perfil.

**Características:**
- Panel de notificaciones
- Dropdown de perfil (logout)
- Indicador de notificaciones no leídas

#### `components/dashboard/stat-card.tsx`

**Propósito:** Tarjeta de estadística (métrica individual).

**Props:**
```typescript
interface StatCardProps {
  title: string;          // "Total Users"
  value: number | string; // 1234
  change?: number;        // +5.2%
  icon?: React.ReactNode; // <Users />
  trend?: "up" | "down";  // Flecha arriba/abajo
}
```

**Estilo:** Glassmorphism con gradiente sutil.

#### `components/dashboard/glass-card.tsx`

**Propósito:** Tarjeta genérica con efecto glassmorphism.

**CSS:**
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
```

#### `components/dashboard/overview-chart.tsx`

**Propósito:** Gráfica de línea mostrando transacciones por hora.

**Librería:** Recharts

```typescript
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function OverviewChart({ data }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="hour" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="count" stroke="#8b5cf6" />
    </LineChart>
  );
}
```

#### `components/dashboard/review/transaction-row.tsx`

**Propósito:** Fila expandible de transacción sospechosa.

**Características:**
- Click para expandir/colapsar
- Botones "Approve" y "Block"
- Indicador de probabilidad de fraude
- Loading state durante actualización

```typescript
export default function TransactionRow({ transaction, onAction, token }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    const result = await updateNotificationDecision(
      transaction.prediction_id,
      "approve",
      token
    );
    if (result.data) {
      onAction(transaction.id, "approve");
    }
    setLoading(false);
  };

  const handleBlock = async () => {
    setLoading(true);
    const result = await updateNotificationDecision(
      transaction.prediction_id,
      "block",
      token
    );
    if (result.data) {
      onAction(transaction.id, "block");
    }
    setLoading(false);
  };

  return (
    <div className="glass-card">
      {/* Header (siempre visible) */}
      <button onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <ShieldIcon />
          <span>{transaction.id}</span>
          <span>${transaction.amount}</span>
          <span>{transaction.fraud_probability}%</span>
        </div>
      </button>

      {/* Detalles (expandido) */}
      {expanded && (
        <div>
          <p>Timestamp: {transaction.timestamp}</p>
          <p>Canal: {transaction.channel}</p>
          
          <div className="flex gap-2">
            <button onClick={handleApprove} disabled={loading}>
              Approve
            </button>
            <button onClick={handleBlock} disabled={loading}>
              Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 10.2 Componentes de Login

#### `components/login/login-form.tsx`

**Propósito:** Formulario de inicio de sesión.

**Características:**
- Validación con Zod
- Manejo con react-hook-form
- Sanitización de inputs
- Conversión de `full_name` a `name` (compatibilidad)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    const result = await loginUser(data.email, data.password);

    if (result.data) {
      // Convertir full_name a name
      const userData = {
        ...result.data.userData,
        name: result.data.userData.full_name,
      };

      login(userData, result.data.accessToken);
      router.push("/dashboard");
    } else {
      form.setError("root", { message: result.error });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("email")} placeholder="Email" />
      <input {...form.register("password")} type="password" placeholder="Password" />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

### 10.3 Componentes UI (shadcn/ui)

Estos son componentes BASE reutilizables en toda la app:

#### `components/ui/button.tsx`

Botón con variantes (primary, secondary, destructive, ghost, link).

```typescript
<Button variant="default" size="lg">
  Click me
</Button>
```

#### `components/ui/input.tsx`

Input de texto estilizado.

```typescript
<Input type="email" placeholder="Email" />
```

#### `components/ui/card.tsx`

Tarjeta básica (sin glassmorphism).

```typescript
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    Contenido...
  </CardContent>
</Card>
```

#### `components/ui/dialog.tsx`

Modal/diálogo.

```typescript
<Dialog>
  <DialogTrigger>Abrir</DialogTrigger>
  <DialogContent>
    <DialogTitle>Título del Modal</DialogTitle>
    <p>Contenido...</p>
  </DialogContent>
</Dialog>
```

#### `components/ui/dropdown-menu.tsx`

Menú desplegable (usado en profile dropdown).

```typescript
<DropdownMenu>
  <DropdownMenuTrigger>
    <Avatar />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 11. Hooks Personalizados

### `hooks/use-mobile.tsx`

**Propósito:** Detectar si el dispositivo es móvil.

```typescript
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}
```

**Uso:**
```typescript
const isMobile = useMobile();

return isMobile ? <MobileSidebar /> : <DesktopSidebar />;
```

### `hooks/use-toast.ts`

**Propósito:** Mostrar notificaciones toast.

```typescript
import { toast } from "sonner";

// Éxito
toast.success("Operación exitosa");

// Error
toast.error("Algo salió mal");

// Info
toast.info("Nueva notificación");
```

---

## 12. Sistema de Estilos

### 12.1 Tailwind CSS

**Clases más usadas:**

```css
/* Layout */
flex, grid, gap-4, p-4, m-4

/* Tamaños */
w-full, h-screen, max-w-7xl

/* Colores */
bg-background, text-foreground, text-primary

/* Efectos */
hover:bg-primary/10, transition-all, rounded-xl, shadow-lg

/* Responsive */
md:grid-cols-2, lg:grid-cols-4
```

### 12.2 Variables CSS (app/globals.css)

```css
:root {
  --background: 222.2 84% 4.9%;    /* #0f141e */
  --foreground: 210 40% 98%;       /* #f8f9fc */
  --primary: 263 70% 50%;          /* #8b5cf6 (púrpura) */
  --destructive: 0 84.2% 60.2%;    /* #f43f5e (rojo) */
  /* ... más variables */
}
```

**Uso en Tailwind:**
```tsx
<div className="bg-background text-foreground">
  {/* background = hsl(var(--background)) */}
</div>
```

### 12.3 Glassmorphism

**Efecto de vidrio esmerilado:**

```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
```

**Componente:**
```tsx
<div className="glass p-6">
  Contenido con efecto glassmorphism
</div>
```

---

## 13. Flujo de Datos

### Flujo Completo: Mostrar Estadísticas

```
┌──────────────────────────────────────────────────────────┐
│ 1. Usuario navega a /dashboard                          │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 2. Next.js renderiza app/dashboard/page.tsx             │
│    - useAuth() obtiene token de AuthContext             │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 3. useEffect() se ejecuta al montar el componente       │
│    - Llama a fetchDashboardStats(token)                 │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 4. lib/api.ts hace fetch() al backend                   │
│    GET http://localhost:8000/metrics/dashboard-stats    │
│    Headers: Authorization: Bearer <token>               │
│    Credentials: include (cookies)                       │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 5. Backend (FastAPI) responde                           │
│    {                                                     │
│      "total_users": 1234,                               │
│      "total_transactions": 5678,                        │
│      "total_revenue": 123456.78,                        │
│      ...                                                 │
│    }                                                     │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 6. apiRequest() parsea JSON y retorna                   │
│    { data: {...}, status: 200 }                         │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 7. setStats(result.data) actualiza el estado React      │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 8. React re-renderiza los componentes                   │
│    <StatCard title="Total Users" value={stats.users} /> │
└──────────────────────────────────────────────────────────┘
```

---

## 14. Agregar Nuevas Funcionalidades

### 14.1 Agregar una Nueva Página

**Ejemplo:** Crear `/dashboard/settings`

#### Paso 1: Crear archivo de página

```bash
# Crear carpeta y archivo
FRONTEND/app/dashboard/settings/page.tsx
```

#### Paso 2: Escribir el componente

```typescript
// app/dashboard/settings/page.tsx
export default function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <p>Configuración del usuario</p>
    </div>
  );
}
```

#### Paso 3: Agregar link en sidebar

```typescript
// components/dashboard/sidebar.tsx
const links = [
  // ... links existentes
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];
```

¡Listo! La ruta `/dashboard/settings` ya está disponible.

### 14.2 Agregar un Nuevo Endpoint de Backend

**Ejemplo:** Obtener transacciones del usuario

#### Paso 1: Agregar función en `lib/api.ts`

```typescript
// lib/api.ts
export async function fetchUserTransactions(
  userId: number,
  token?: string
) {
  return apiRequest<Array<{
    transaction_id: number;
    amount: number;
    timestamp: string;
    status: string;
  }>>(`/transactions/user/${userId}`, { token });
}
```

#### Paso 2: Usar en componente

```typescript
// app/dashboard/transactions/page.tsx
export default function TransactionsPage() {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    async function loadTransactions() {
      const result = await fetchUserTransactions(user.id, token);
      
      if (result.data) {
        setTransactions(result.data);
      }
    }

    if (user && token) {
      loadTransactions();
    }
  }, [user, token]);

  return (
    <div>
      <h1>Mis Transacciones</h1>
      <ul>
        {transactions.map(tx => (
          <li key={tx.transaction_id}>
            {tx.amount} - {tx.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 14.3 Agregar un Nuevo Componente

**Ejemplo:** Botón de exportar datos

#### Paso 1: Crear componente

```typescript
// components/dashboard/export-button.tsx
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  onExport: () => void;
}

export default function ExportButton({ onExport }: ExportButtonProps) {
  return (
    <Button onClick={onExport} variant="outline">
      <Download size={16} />
      Exportar
    </Button>
  );
}
```

#### Paso 2: Usar en página

```typescript
// app/dashboard/page.tsx
import ExportButton from "@/components/dashboard/export-button";

export default function DashboardPage() {
  const handleExport = () => {
    // Lógica de exportación
    console.log("Exportando datos...");
  };

  return (
    <div>
      <ExportButton onExport={handleExport} />
    </div>
  );
}
```

---

## 15. Troubleshooting Común

### 15.1 "Cannot read properties of undefined"

**Causa:** Intentar acceder a datos antes de que se carguen.

**Solución:**
```typescript
// ❌ Malo
<h1>{stats.total_users}</h1>

// ✅ Bueno
<h1>{stats?.total_users || 0}</h1>

// ✅ Mejor
{stats ? (
  <h1>{stats.total_users}</h1>
) : (
  <div>Cargando...</div>
)}
```

### 15.2 "Module not found: Can't resolve '@/...'"

**Causa:** Alias `@/` no configurado.

**Solución:** Verificar `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 15.3 "Error: Hydration mismatch"

**Causa:** El HTML renderizado en el servidor no coincide con el cliente.

**Soluciones:**
1. No usar `window` o `localStorage` durante el renderizado inicial
2. Usar `useState` + `useEffect` para datos del cliente

```typescript
// ❌ Malo
const isDark = localStorage.getItem("theme") === "dark";

// ✅ Bueno
const [isDark, setIsDark] = useState(false);

useEffect(() => {
  setIsDark(localStorage.getItem("theme") === "dark");
}, []);
```

### 15.4 CORS Errors

**Causa:** Backend no permite peticiones desde `localhost:3000`.

**Solución:** Verificar `BACKEND/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 15.5 "401 Unauthorized"

**Causa:** Token expirado o no enviado.

**Soluciones:**
1. Verificar que el token se envía en headers
2. Verificar que `credentials: "include"` está en fetch
3. Hacer logout y login de nuevo

```typescript
// Verificar token
const { token } = useAuth();
console.log("Token:", token);

// Si no hay token → redirect a login
if (!token) {
  router.push("/login");
}
```

---

## 📎 Apéndices

### A. Comandos Útiles

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build producción
npm run build

# Servidor de producción
npm start

# Limpiar cache
rm -rf .next
npm run dev

# Instalar nuevo paquete
npm install nombre-paquete
```

### B. Atajos de Teclado (VS Code)

| Atajo | Acción |
|-------|--------|
| `Ctrl + P` | Buscar archivo |
| `Ctrl + Shift + F` | Buscar en archivos |
| `F12` | Ir a definición |
| `Alt + ←` | Volver atrás |
| `Ctrl + /` | Comentar/descomentar |

### C. Recursos Adicionales

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Recharts Docs](https://recharts.org/)

---

## 🎯 Resumen Final

### Arquitectura

```
Frontend (Next.js) ←→ Backend (FastAPI)
       ↓                    ↓
  React Context        PostgreSQL
   (AuthContext)       (fraud_predictions)
```

### Flujo de Autenticación

```
Login Form → API → Backend → JWT Cookie + UserData → AuthContext → Dashboard
```

### Estructura de Carpetas Clave

```
app/          → Páginas (rutas)
components/   → UI reutilizable
lib/          → Lógica de negocio (api.ts, auth-context.tsx)
hooks/        → Custom hooks
```

### Archivos Críticos

1. `lib/api.ts` - Comunicación con backend
2. `lib/auth-context.tsx` - Estado de autenticación
3. `.env.local` - URL del backend
4. `app/dashboard/page.tsx` - Dashboard principal
5. `components/dashboard/sidebar.tsx` - Navegación

---

**¿Tienes preguntas?** Revisa la sección de Troubleshooting o consulta la documentación oficial de cada tecnología.

**Última actualización:** Febrero 10, 2026
