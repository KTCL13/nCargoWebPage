# ncargo

Proyecto Next.js 16 (App Router) monolito: frontend y backend dentro del mismo repositorio.

Este README resume cómo poner en marcha el proyecto, comandos útiles y convenciones importantes para desarrolladores.

## Requisitos mínimos y recomendados

### Mínimos

- Node.js 18
- CPU: 2 cores
- Memoria: 2 GB RAM
- Espacio libre en disco: 2 GB
- npm / pnpm / yarn (cualquier gestor de paquetes)

### Recomendados

- Node.js 20 (o la LTS más reciente)
- CPU: 4+ cores
- Memoria: 8+ GB RAM
- Espacio libre en disco: 10 GB+
- pnpm (recomendado por velocidad y determinismo)

Nota: Para desarrollo en Windows se recomienda usar WSL2 para compatibilidad con herramientas y scripts tipo Unix.

## Instalación rápida

```bash
npm install
npm run dev
# o con pnpm
pnpm install
pnpm dev
```

Abre http://localhost:3000 en tu navegador.

## Comandos útiles

- `npm run dev` — servidor de desarrollo
- `npm run build` — build para producción
- `npm start` — iniciar en producción (`next start`)
- `npm run lint` — ESLint
- `npm run test` — Jest
- `npm run test:coverage` — tests con cobertura
- `npm run seed:shipping` — seed de tarifas de envío (ver `prisma/seed-shipping.ts`)

## Variables de entorno

Crea un archivo `.env` con al menos las siguientes variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRAPI_URL` (opcional)
- `STRAPI_API_TOKEN` (opcional)

## Prisma

- Ejecutar migraciones: `npx prisma migrate dev --name <descripcion>`
- Ejecutar seed: `npx prisma db seed` o `npm run seed:shipping`
- Prisma Studio: `npx prisma studio`

## Estructura y convenciones

- App Router de Next.js: código en `src/app/`.
- Endpoints API: Route Handlers en `src/app/api/`.
- Lógica por módulos en `src/modules/` (controllers → services → repositories → dtos).
- Cliente Prisma singleton: `src/lib/prisma.ts`.
- OpenAPI / Swagger: especificación en `src/lib/openapi-spec.ts` y UI disponible en `/docs`.

## Estructura del proyecto

Estructura de alto nivel (archivos y carpetas más relevantes):

```
- prisma/              # esquema Prisma, migraciones y seeds
- public/              # recursos estáticos (images, logos, website)
- src/                 # código fuente
	- app/               # App Router: páginas y `api` (route handlers)
	- components/        # componentes UI reutilizables
	- modules/           # lógica por dominio (controllers → services → repositories → dtos)
	- lib/               # utilidades (prisma client, auth-guard, openapi-spec, audit-logger, etc.)
	- context/           # React contexts (ej. AuthContext)
	- hooks/             # custom hooks
- next.config.mjs      # configuración de Next.js
- package.json
- prisma.config.ts
- tsconfig.json
```

### Notas rápidas para desarrolladores

- Autenticación: JWT para las APIs (ver `src/lib/auth-guard.ts`).
- Alias de importación: `@/` → `src/`.
