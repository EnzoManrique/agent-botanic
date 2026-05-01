# Agente Botánico

Asistente personal para el cuidado de plantas, pensado mobile-first y construido con Next.js 16, React 19 y la AI SDK v6. Identifica plantas desde una foto, recuerda los riegos, alerta sobre eventos climáticos extremos (Zonda, helada, granizo) y sugiere productos reales del catálogo de Mercado Libre Argentina.

## Tabla de contenidos

- [Características](#características)
- [Stack técnico](#stack-técnico)
- [Arquitectura](#arquitectura)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Esquema de base de datos](#esquema-de-base-de-datos)
- [Flujos clave](#flujos-clave)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)
- [Despliegue](#despliegue)

## Características

- **Identificación de plantas por foto** — el usuario sube una imagen y el modelo multimodal Gemini devuelve nombre común, especie científica, frecuencia de riego sugerida y consejos personalizados.
- **Jardín personal** — listado tipo card con cada planta, estado de riego ("Hoy", "En 3 días", "Atrasada") y registro de cuidados con un toque.
- **Botón de regar inteligente** — se deshabilita automáticamente entre ciclos para evitar registros duplicados, con cuenta regresiva visual.
- **Agente conversacional con tools** — chat que consulta el clima en tiempo real (Open-Meteo), lista las plantas del usuario, busca productos en Mercado Libre y diagnostica problemas desde fotos.
- **Alertas climáticas para Mendoza** — detecta viento Zonda combinando ráfagas + baja humedad, helada, ola de calor y granizo basándose en preferencias del usuario.
- **Carousel de productos en el chat** — cuando el agente sugiere fertilizante o sustrato, renderiza tarjetas con foto oficial, marca y link directo a Mercado Libre.
- **Sugerencias descubribles** — el empty state del chat muestra 6 chips con íconos para que el usuario descubra todas las capacidades del agente.
- **Autenticación con Auth.js** — login con email/contraseña usando bcrypt y sesiones JWT, sin localStorage.
- **Diseño mobile-first** — bottom-tabs, headers fijos, sheets de detalle en vez de modales, optimizado para móviles.

## Stack técnico

| Capa            | Tecnología                                                       |
| --------------- | ---------------------------------------------------------------- |
| Framework       | [Next.js 16](https://nextjs.org) (App Router, RSC, Server Actions) |
| UI              | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Radix UI](https://www.radix-ui.com) |
| IA              | [AI SDK v6](https://sdk.vercel.ai) con `@ai-sdk/google` (Gemini 2.0 Flash y 2.5 Flash) |
| Base de datos   | [Neon Postgres](https://neon.tech) serverless                    |
| Auth            | [Auth.js v5](https://authjs.dev) (NextAuth) con credenciales + bcrypt |
| Clima           | [Open-Meteo](https://open-meteo.com) — sin API key, gratis       |
| Productos       | API pública de [Mercado Libre Argentina](https://api.mercadolibre.com) |
| Notificaciones  | [Sonner](https://sonner.emilkowal.ski)                           |
| Tipos           | TypeScript 5.7 + Zod para validación de runtime                  |

## Arquitectura

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Cliente (React 19)                            │
│   • Bottom-tabs · Sheets · Forms · Cards                             │
│   • useChat (AI SDK) · SWR para estado servidor                      │
└──────────────┬───────────────────────────────────────────────────────┘
               │ Server Actions + Route Handlers
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                             │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐│
│  │ Server Actions     │  │ /api/chat          │  │ /api/auth/*       ││
│  │ (lib/actions/*)    │  │ streamText + tools │  │ Auth.js handler  ││
│  └────────────────────┘  └────────────────────┘  └──────────────────┘│
└──────────────┬─────────────────┬─────────────────────────────────────┘
               │                 │
               ▼                 ▼
       ┌──────────────┐    ┌────────────────────────────────────────┐
       │ Neon Postgres│    │ APIs externas                          │
       │ users        │    │ • Google Gemini (chat + visión)        │
       │ plants       │    │ • Open-Meteo (clima)                   │
       │ care_logs    │    │ • Mercado Libre (productos)            │
       │ user_settings│    └────────────────────────────────────────┘
       └──────────────┘
```

### Decisiones de diseño

- **No ORM** — las queries van directo con `@neondatabase/serverless` y SQL parametrizado. Más control, menos magia, mejor performance en serverless.
- **Server Actions sobre API routes** para mutaciones. Solo el chat usa Route Handler porque necesita streaming.
- **Multi-modelo con fallback** — el escaneo de fotos prueba `gemini-2.5-flash` primero y cae a `gemini-2.0-flash` si está saturado. El chat usa solo `2.0-flash` (más estable bajo carga).
- **Tools resilientes** — cada tool del agente está envuelta en try/catch y devuelve `{ error: true, message }` en vez de tirar excepción, así el modelo puede disculparse en lenguaje natural sin que muera el stream.
- **Auto-retry transparente en el cliente** — si el modelo está saturado momentáneamente, el cliente reintenta una vez después de 2 segundos sin avisar al usuario. Solo se muestra toast si el retry también falla.
- **Tipo `LucideIcon` y design tokens** — los íconos y colores se centralizan para mantener consistencia visual y poder cambiar el theme desde `globals.css`.

## Puesta en marcha

### Requisitos previos

- Node.js 20 o superior
- pnpm (`npm install -g pnpm`)
- Una cuenta de Neon (gratis) para Postgres
- Una API key de Google AI Studio (gratis, sin tarjeta)

### Instalación

```bash
git clone https://github.com/EnzoManrique/agent-botanic.git
cd agent-botanic
pnpm install
```

### Configurar variables de entorno

Copiá el ejemplo y completá los valores:

```bash
cp .env.example .env.local
```

Variables requeridas — ver [Variables de entorno](#variables-de-entorno).

### Crear las tablas

La primera vez, hacé un GET a `/api/create-plants-table` después de levantar el server (ese endpoint corre las migraciones idempotentes).

### Arrancar el dev server

```bash
pnpm dev
```

Abrí http://localhost:3000.

## Variables de entorno

```bash
# === Base de datos (Neon Postgres) ===
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# === Modelo de IA (Google AI Studio) ===
# Obtenerla gratis en https://aistudio.google.com/app/apikey
# Free tier: ~1500 requests/día sin tarjeta de crédito
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# === Auth.js ===
AUTH_SECRET=             # generar con: openssl rand -base64 32
AUTH_URL=http://localhost:3000   # solo en dev; en prod lo setea Vercel

# === Opcionales ===
NEXT_PUBLIC_VERCEL_URL=  # autoseteado en Vercel; útil para callbacks OAuth si se agregan
```

> **Aviso sobre AI Gateway de Vercel:** considerá AI Gateway si querés switching automático entre proveedores, pero requiere tarjeta de crédito incluso para los créditos gratis. Por eso por defecto usamos la API directa de Google AI Studio.

## Esquema de base de datos

Cuatro tablas principales en Neon Postgres:

```sql
-- Usuarios
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  password     TEXT NOT NULL,            -- bcrypt hash
  name         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Plantas registradas por cada usuario
CREATE TABLE plants (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email               TEXT NOT NULL REFERENCES users(email),
  alias                    TEXT NOT NULL,
  species                  TEXT,
  scientific_name          TEXT,
  watering_frequency_days  INTEGER NOT NULL,
  location                 TEXT,             -- "Adentro" | "Afuera"
  image_url                TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Registro histórico de cuidados (regar, fertilizar, podar...)
CREATE TABLE care_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id    UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  care_type   TEXT NOT NULL,         -- "water" | "fertilize" | "prune"...
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preferencias del agente y alertas climáticas
CREATE TABLE user_settings (
  user_email      TEXT PRIMARY KEY REFERENCES users(email),
  city            TEXT,
  alert_zonda     BOOLEAN DEFAULT TRUE,
  alert_frost     BOOLEAN DEFAULT TRUE,
  alert_heat_wave BOOLEAN DEFAULT TRUE,
  alert_hail      BOOLEAN DEFAULT TRUE
);
```

## Flujos clave

### Identificar una planta desde foto

1. El usuario toma la foto en `/escanear` (componente `ScannerPanel`).
2. La imagen se redimensiona en cliente con `lib/image-utils.ts` antes de subirla, para evitar payloads gigantes.
3. La Server Action `scanPlant()` en `lib/actions/plants.ts`:
   - Intenta primero con `gemini-2.5-flash` (mejor visión).
   - Si está saturado, cae automáticamente a `gemini-2.0-flash`.
   - Usa `Output.object({ schema })` para forzar respuesta tipada con Zod.
4. Si detecta planta, abre el dialog de "Agregar al jardín" prellenado con la sugerencia.

### Chat con tools

El endpoint `/api/chat` usa `streamText` de la AI SDK con 5 tools:

| Tool                   | Qué hace                                                   |
| ---------------------- | ---------------------------------------------------------- |
| `getWeatherAlerts`     | Detecta Zonda, helada, ola de calor, granizo               |
| `getWeatherForecast`   | Pronóstico 3 días (max/min, lluvia, viento, humedad)       |
| `listUserPlants`       | Lista las plantas del usuario logueado                     |
| `checkWateringSchedule`| Días desde último riego de una planta puntual              |
| `searchProducts`       | Busca en catálogo de Mercado Libre Argentina               |

El cliente (`ChatPanel`) muestra los productos como cards visuales en lugar de texto plano cuando el modelo invoca `searchProducts`. Para esto el system prompt instruye explícitamente al modelo a no repetir la lista en texto.

### Auto-retry en saturación

```ts
// components/features/chat-panel.tsx
onError: (err) => {
  if (isOverloadError(err) && !retryAttemptedRef.current) {
    retryAttemptedRef.current = true
    setTimeout(() => regenerate(), 2000)
    return
  }
  toast.error(humanizeAiError(err))
}
```

`isOverloadError` matchea 9 patrones (overloaded, high demand, 429, 503, ECONNRESET, timeout...) y `humanizeAiError` traduce los errores técnicos a 4 mensajes en castellano.

## Estructura del proyecto

```
agent-botanic/
├── app/
│   ├── (app)/                    # Rutas protegidas (requieren auth)
│   │   ├── page.tsx              # Home (jardín + clima + agente)
│   │   ├── jardin/               # Vista del jardín
│   │   ├── escanear/             # Identificación por foto
│   │   ├── agente/               # Chat con el agente
│   │   └── perfil/               # Perfil + preferencias
│   ├── (auth)/                   # Rutas públicas (login, registro)
│   ├── api/
│   │   ├── chat/route.ts         # Endpoint de chat streaming con tools
│   │   ├── auth/[...nextauth]/   # Auth.js handler
│   │   └── create-plants-table/  # Migración idempotente
│   └── layout.tsx                # Root layout + fonts + metadata
├── components/
│   ├── auth/                     # Login, register, forgot-password forms
│   ├── features/                 # Componentes de feature (1 por vista)
│   │   ├── plant-card.tsx        # Card de planta con botón de regar
│   │   ├── chat-panel.tsx        # Chat con auto-retry y carousels
│   │   ├── scanner-panel.tsx     # Captura y diagnóstico de fotos
│   │   └── ...
│   ├── mobile/                   # Bottom-tabs y headers móviles
│   └── ui/                       # Componentes shadcn/ui (buttons, cards...)
├── lib/
│   ├── actions/                  # Server Actions
│   │   ├── plants.ts             # CRUD de plantas + scanPlant
│   │   ├── auth.ts               # Server actions para login/register
│   │   └── settings.ts           # Preferencias y alertas
│   ├── db/                       # Capa de acceso a Postgres
│   │   ├── plants.ts
│   │   ├── care-logs.ts
│   │   └── settings.ts
│   ├── ai-retry.ts               # tryModelsInOrder + humanizeAiError
│   ├── weather.ts                # Cliente de Open-Meteo + evaluador de alertas
│   ├── mercadolibre.ts           # Cliente de la API de productos
│   ├── image-utils.ts            # Redimensionado de fotos en cliente
│   ├── plant-meta.ts             # Metadatos por tipo de cuidado (íconos, copy)
│   └── types.ts                  # Tipos compartidos cliente/servidor
├── auth.ts                       # Config de Auth.js
├── auth.config.ts                # Edge-safe config (para middleware)
├── proxy.ts                      # Middleware de Next.js 16 (antes middleware.ts)
└── next.config.mjs               # Config con allowedDevOrigins
```

## Solución de problemas

### "Algo salió mal procesando tu pedido" en el chat

Hay varias causas posibles. Revisá los logs del server y mirá el código HTTP del request al modelo:

| Causa                               | Síntoma en logs                                  | Solución                                                                |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| Cuota gratis de Google agotada      | `429 RESOURCE_EXHAUSTED, limit: 0`               | Esperar 24hs al reset, o crear key nueva en otra cuenta de Google       |
| Falta `GOOGLE_GENERATIVE_AI_API_KEY`| `Falta GOOGLE_GENERATIVE_AI_API_KEY`             | Agregar en `.env.local` o en Vars del proyecto en Vercel                |
| Modelo saturado momentáneamente     | `503 model overloaded` o `high demand`           | El cliente reintenta solo. Si persiste, esperar unos minutos            |
| Tool falla (Open-Meteo, ML)         | `[v0] Tool xxx falló`                            | El modelo se disculpa solo. Revisar que la API externa esté arriba      |

### Botones que no responden / hidratación rota

En Next.js 16, el dev server bloquea por defecto las requests cross-origin a recursos de desarrollo. Si abrís el preview desde un dominio distinto a `localhost`, agregá el dominio a `next.config.mjs`:

```js
allowedDevOrigins: ["*.vusercontent.net", "*.v0.app", "*.vercel.app"]
```

Después reiniciá el dev server.

### "Falta DATABASE_URL"

Conectá tu proyecto de Neon en las settings de Vercel o agregá la URL completa a `.env.local`.

### Sesión que no persiste tras login

Asegurate de que `AUTH_SECRET` esté seteado y que `AUTH_URL` apunte al dominio correcto (en producción es la URL de Vercel sin trailing slash).

## Despliegue

El proyecto está optimizado para Vercel:

1. Conectá el repo de GitHub a un proyecto nuevo en Vercel.
2. Conectá la integración de Neon desde el marketplace (autoseteará `DATABASE_URL`).
3. Agregá las variables `AUTH_SECRET` y `GOOGLE_GENERATIVE_AI_API_KEY` en Settings → Environment Variables.
4. Hacé un push a `main` y Vercel deploya automáticamente.

> Próximas mejoras planeadas: notificaciones push, modo offline con IndexedDB, integración con Apple Shortcuts, y soporte multilenguaje.

## Licencia

MIT — uso libre, sin garantías.

## Créditos

- Fotos por defecto: [Unsplash](https://unsplash.com)
- Datos climáticos: [Open-Meteo](https://open-meteo.com) (sin API key, gratis para uso no comercial)
- Catálogo de productos: API pública de [Mercado Libre](https://api.mercadolibre.com)
- Construido con asistencia de [v0](https://v0.app)
