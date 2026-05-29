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

---

## Estándares de codificación

> La fuente autoritativa de convenciones técnicas es **`CLAUDE.md`** en la raíz del repositorio. Esta sección resume los puntos más críticos para el desarrollo diario.

### Convenciones de nombrado

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables y funciones | `camelCase` | `employeeService`, `findByEmail` |
| Clases, interfaces, tipos | `PascalCase` | `EmployeeService`, `CreateEmployeeDto` |
| Archivos de módulo | `kebab-case` | `employee.service.ts`, `auth-guard.ts` |
| Carpetas de módulo | `kebab-case` | `src/modules/employees/` |
| Constantes de módulo | `SCREAMING_SNAKE_CASE` | `MAX_CONCURRENT_SESSIONS`, `SHIPPING_RATES` |
| Rutas de API | `kebab-case` | `/api/pickup-points`, `/api/auth/login` |
| Campos de base de datos | `snake_case` (Prisma `@map`) | `first_name`, `token_jti` |

### Manejo de errores

**Backend (API)**

Los servicios siempre lanzan `new Error('mensaje en español')`. Los controladores capturan y devuelven:

```typescript
// Patrón estándar en todos los controladores
try {
  const result = await someService.doSomething(body)
  return NextResponse.json(result, { status: 200 })
} catch (error: unknown) {
  return NextResponse.json(
    { message: error instanceof Error ? error.message : 'Error interno del servidor' },
    { status: 400 },
  )
}
```

Codificación de errores de autenticación:

| Mensaje contiene | Status HTTP |
|---|---|
| `Token` | 401 |
| Empieza con `Forbidden` | 403 |
| Cualquier otro error | 400 |

**Frontend (cliente)**

Los errores de `fetch` se propagan hacia el componente. Los componentes React muestran el campo `message` del JSON de error. No se muestran stack traces al usuario.

**Errores de infraestructura**

Los errores de PostgreSQL (`numeric field overflow`, código `22003`) se mapean a mensajes legibles en el controlador antes de devolverlos al cliente. Nunca se expone el mensaje crudo del ORM.

### Patrones de logging

Toda acción sensible (login, logout, creación/modificación de empleados, cambios de contraseña, etc.) debe registrarse con `secureAuditLog()` en `src/lib/secure-logger.ts`.

```typescript
await secureAuditLog({
  entityType: 'Employee',
  entityId: employee.id,
  action: 'UPDATE',
  performedBy: adminId,
  ipAddress: ip,          // siempre requerido en acciones sensibles
  oldValues: { ... },     // se enmascara PII automáticamente
  newValues: { ... },
})
```

**Reglas de PII en logs:**
- Emails → `ali***@domain.com`
- Nombres → `A***`
- Teléfonos → `12****90`
- Documentos de identidad → `12****89`
- `secureAuditLog` aplica el enmascaramiento automáticamente sobre `oldValues`/`newValues`.
- **Nunca** usar `console.log` con datos de usuarios en producción.

### Revisión de Pull Requests

**Antes de abrir un PR:**

1. `npm run lint` — sin errores de ESLint
2. `npm run test` — 100 % de los tests existentes pasan
3. `npx tsc --noEmit` — sin errores de TypeScript
4. `npm run build` — build de producción limpio
5. Los nuevos endpoints deben estar documentados en `src/lib/openapi-spec.ts`
6. Las migraciones de Prisma deben usar `NOT VALID` + `VALIDATE CONSTRAINT` para columnas en tablas grandes

**Checklist de review:**

- [ ] La lógica de negocio vive en el servicio, no en el controlador ni en el repositorio
- [ ] El controlador no accede directamente a Prisma (excepto módulo `cotizaciones` — excepción documentada en CLAUDE.md)
- [ ] Los nuevos tests siguen el patrón G1/G2/G3 (happy path / error de negocio / caso inválido controlado)
- [ ] No hay PII en texto plano en logs ni en mensajes de error
- [ ] Las rutas protegidas llaman `requireAdmin(req)` o `getAuthEmployee(req)` al inicio del controlador
- [ ] Los tokens JWT tienen `jti` validado contra la tabla `UserSession` (sesión activa en DB)

**Umbrales mínimos de cobertura (ICPC):**

| Zona | Statements | Funciones |
|---|---|---|
| Verde | ≥ 90 % | ≥ 95 % |
| Amarilla | 80 – 89 % | 85 – 94 % |
| Roja | < 80 % | < 85 % |

Los módulos en Zona Roja bloquean el merge a `main` hasta que se alcance al menos Zona Amarilla.
