# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # start dev server (Turbopack, 4 GB heap)
npm run build      # production build
npm run lint       # ESLint
npm run test       # Jest
npm run test:coverage
npx jest path/to/__tests__/foo.test.ts   # run a single test file
npx prisma migrate dev --name <description>   # create and apply a migration
npx prisma db seed       # seed database (ts-node prisma/seed.ts)
npm run seed:shipping    # seed shipping rates/providers (prisma/seed-shipping.ts)
npx prisma studio        # browse DB
```

> Prisma is configured via `prisma.config.ts` at the project root (schema: `prisma/schema.prisma`, migrations: `prisma/migrations/`, engine: `classic`).

## Architecture

This is a **Next.js 16 (App Router) monolith** — the frontend and backend (REST API) live in the same repo. There is no separate server; API routes are Next.js Route Handlers under `src/app/api/`.

### Backend pattern (modules)

All business logic lives under `src/modules/<domain>/` following a layered pattern:

```
controllers/   — thin; calls getAuthEmployee() then delegates to service; returns NextResponse
services/      — business rules, orchestrates repositories
repositories/  — all Prisma queries (no raw SQL elsewhere)
dtos/          — input/output types and Zod schemas
```

Route files (`src/app/api/*/route.ts`) are one-liners that import from the matching controller. This is the only wiring the route file does. Some route files dispatch on a `?id=` query parameter rather than using a dynamic `[id]` segment — match the existing pattern in whichever file you're extending.

Controllers always wrap logic in `try/catch` and return errors as `NextResponse.json({ message: error.message }, { status: 400 })`. Follow this convention; do not invent new error shapes.

The `cotizaciones` module (`src/modules/cotizaciones/`) is an exception — it skips the repository layer and queries Prisma directly from the service; it also has no auth guard (public endpoints).

The singleton Prisma client is at `src/lib/prisma.ts`. Import it as `import { prisma } from '@/lib/prisma'`. Never instantiate `PrismaClient` directly.

Test files live at `**/__tests__/**/*.test.ts` (Jest + ts-jest, `@/` alias works).

### Authentication

JWT-based, stateless. The token payload is `{ id, email, role }`.

- `src/lib/auth-guard.ts` — `getAuthEmployee(req)` extracts and verifies the Bearer token from the `Authorization` header. Throws if missing/invalid. Call this first in any protected controller method.
- `src/proxy.ts` — **This IS the Next.js middleware** (there is no `src/middleware.ts`). Next.js 16 compiles it directly. It reads a `token` **cookie** (not header), decodes it without verification, and redirects to the correct dashboard by role. Matcher: `/admin/:path*`, `/employee/:path*`. This is separate from API auth — API routes use Bearer tokens.
- `src/context/AuthContext.tsx` — client-side React context; stores `auth_user` and `auth_token` in `localStorage`.
- Roles: `ADMIN` and `EMPLOYEE`. Authorization is done manually in controllers/services by checking `employee.role`.

**Mandatory convention — every write endpoint must begin with auth:**

```typescript
// All POST / PUT / PATCH / DELETE handlers must start with:
const employee = await getAuthEmployee(req)   // authenticated user or 401
// For admin-only operations:
const employee = await requireAdmin(req)      // ADMIN role required or 403
```

No exceptions. Public endpoints (e.g. `POST /api/cotizaciones/calcular`) must be explicitly listed as intentional exceptions in this file.

Endpoints públicos permitidos sin guard: `auth/login`, `auth/register`, `auth/forgot-password`, `auth/reset-password`, `cotizaciones/calcular`, `cotizaciones/ciudades`, `docs`.

El JWT se firma y verifica con **HS256** explícito en `src/modules/auth/services/jwt.service.ts`. No usar `jwt.decode()` directamente — siempre `getAuthEmployee()`.

**Role-based data access for GET endpoints:**

When an endpoint returns records that belong to a specific employee (quotations, attendance, tasks), filter by role:

```typescript
const where = employee.role === 'ADMIN' ? {} : { employeeId: employee.id }
```

ADMIN sees all records; EMPLOYEE sees only their own.

### Frontend

- **`'use client'`** pages under `src/app/admin/` and `src/app/employee/` are all client components that fetch from the API using the token from `useAuth()`.
- `src/components/layout/DashboardLayout` wraps every dashboard page — pass `navItems` from `NAV_ITEMS` (filtered automatically by role in `Sidebar`).
- Styling: Tailwind CSS v4 with CSS custom properties (`var(--color-nc-*)`).
- Charts: `recharts` and `react-chartjs-2` / `chart.js`.
- Employee pages: `dashboard`, `jornada` (clock-in/out), `tareas` (Kanban tasks), `cotizaciones`, `reportes`.

### API docs

OpenAPI spec lives in `src/lib/openapi-spec.ts` and is served as Swagger UI at `/docs`. Update this file when adding or changing endpoints.

### Modules

| Module | Key responsibility |
|---|---|
| `auth` | Login, register, JWT sign/verify, password reset (email via Resend) |
| `employees` | CRUD, roles, contracts, job history |
| `jobs` | Job title CRUD (used by contracts) |
| `attendance` | Clock-in/out, pause/resume, IP enforcement, history |
| `tasks` | Kanban-style tasks linked to attendance sessions; event-driven notifications |
| `quotations` | Internal shipping calculator (hardcoded brackets, city costs via `CityCost` table) |
| `cotizaciones` | Public Excel-formula calculator; reads all rates from `SystemConfig` table; supports CO and MX |
| `shipping` | Shipments, shipping providers, locations, pickup points |
| `analytics` | Employee KPI aggregation, workload snapshots, alerts |

### Task notification system

`src/modules/tasks/notifications/` contains a simple synchronous in-process event bus (`event-bus.ts`). Listeners (email via Resend, in-app via DB `Notification` table) are registered at import time in `index.ts`. Import `index.ts` from the task service to activate; do not register handlers anywhere else.

Events: `task.assigned`, `task.reassigned`, `task.not_done`.

### Audit logging

`src/lib/audit-logger.ts` exposes `auditLog({ entityType, entityId, action, performedBy, oldValues, newValues })`. Call it from services when mutating data; it writes to the `AuditLog` table.

### Shipping calculators

There are two separate calculators:

- **`quotations`** (`src/modules/quotations/services/shipping-calculator.service.ts`) — internal/admin use; rate brackets are hardcoded (1–14 lb fixed $36, 15–70 lb $2.95/lb, 71–110 lb $3.15/lb). Change `SHIPPING_RATES` at the top of that file when rates change.
- **`cotizaciones`** (`src/modules/cotizaciones/services/cotizacion-calculator.service.ts`) — public-facing Excel-formula calculator; all rates (divisor, insurance, customs, pickup, flat rates) are stored in the `SystemConfig` table and fetched at runtime. Supports Colombia (`CO`) and Mexico (`MX`). Exposes unauthenticated endpoints: `POST /api/cotizaciones/calcular` and `GET /api/cotizaciones/ciudades?country=`.

### SystemConfig table

Key-value store for dynamic configuration used by the cotizaciones calculator. Keys: `divisor`, `insurance_rate`, `customs_rate`, `customs_threshold`, `pickup_base`, `pickup_per_extra_mile`, `pickup_free_miles`, `co_flat_rate_enabled`, `co_flat_rate_price`, `mx_flat_rate_enabled`, `mx_flat_rate_price`. Edit via `PATCH /api/system-config` (admin only).

## Path alias

`@/*` maps to `src/*`. Always use `@/` imports.

## Zod v4

This project uses **Zod v4** (`zod@^4`), which has breaking changes from v3. Key differences: `z.string().nonempty()` is removed (use `.min(1)`), error map API changed, `.nullish()` behavior adjusted. Check the Zod v4 changelog before copying v3 patterns.

## Environment variables

Required in `.env`:
- `DATABASE_URL` — PostgreSQL (Neon)
- `JWT_SECRET`
- `RESEND_API_KEY` — transactional email
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRAPI_URL` / `STRAPI_API_TOKEN` — optional Strapi integration
