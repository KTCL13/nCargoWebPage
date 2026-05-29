# Dockerización de N-Cargo

Guía completa para contenerizar la aplicación, escalarla horizontalmente y
desplegarla de forma agnóstica al proveedor de nube.

---

## Archivos incluidos

| Archivo | Propósito |
|---|---|
| `Dockerfile` | Build multi-stage (deps → builder → runner) |
| `docker-compose.yml` | Stack local: app + PostgreSQL |
| `docker-entrypoint.sh` | Ejecuta migraciones Prisma antes de iniciar |
| `.dockerignore` | Excluye secretos, node_modules y artefactos de build |

---

## Requisitos previos

- Docker ≥ 24 y Docker Compose ≥ 2.20
- Node.js 20 (solo para desarrollo local sin Docker)
- PostgreSQL 15+ (gestionado externamente en producción)

---

## Variables de entorno

Copia `.env.example` como `.env.docker` y rellena los valores:

```bash
cp .env.example .env.docker
```

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | ✓ | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✓ | ≥ 32 chars aleatorios (`openssl rand -base64 48`) |
| `RESEND_API_KEY` | ✓ | Clave API de Resend para emails transaccionales |
| `NEXT_PUBLIC_APP_URL` | ✓ | URL pública del frontend (ej. `https://app.ncargousa.com`) |
| `ODOO_URL` | opcional | URL de la instancia Odoo (debe ser `https://`) |
| `ODOO_DB` | opcional | Nombre de la base de datos en Odoo |
| `ODOO_USERNAME` | opcional | Usuario de Odoo |
| `ODOO_API_KEY` | opcional | API key de Odoo |
| `ODOO_SHIPPING_PRODUCT_CODE` | opcional | Código interno del producto de envío en Odoo |
| `RESEND_FROM` | opcional | `Nombre <email>` del remitente |
| `NEXT_PUBLIC_STRAPI_URL` | opcional | URL de Strapi |
| `STRAPI_API_TOKEN` | opcional | Token de Strapi |

> **Nunca** incluyas valores de producción en el repositorio ni en la imagen Docker.

---

## Desarrollo local con Docker Compose

```bash
# 1. Preparar variables
cp .env.example .env.docker
# editar .env.docker con valores de desarrollo

# 2. Levantar el stack (primera vez construye la imagen)
docker compose up --build

# 3. La app estará en http://localhost:3000
# Las migraciones se aplican automáticamente al iniciar

# 4. Detener
docker compose down

# 5. Destruir volúmenes (reset de base de datos)
docker compose down -v
```

---

## Construir la imagen de producción

```bash
docker build -t ncargo:latest .

# Ejecutar manualmente
docker run -p 3000:3000 \
  --env-file .env.docker \
  ncargo:latest
```

---

## Escala horizontal — hasta 500 usuarios concurrentes

La arquitectura está diseñada para ser stateless a nivel de aplicación:

| Componente | Estado | Notas |
|---|---|---|
| JWT | Stateless ✓ | Expiry 4h, verificado con clave compartida |
| Sesiones de usuario | Base de datos ✓ | Tabla `user_sessions` en PostgreSQL |
| Prisma / ORM | Sin estado local ✓ | Pool de conexiones por instancia |
| Métricas (`prom-client`) | Por instancia ✓ | Prometheus raspa cada pod individualmente |

### Limitación conocida: Rate Limiter en memoria

El rate limiter actual (`src/lib/rate-limiter.ts`) usa un `Map` en memoria.
En un despliegue con múltiples réplicas, cada instancia tiene su propio contador
y el límite no se comparte entre pods.

**Solución antes de escalar a múltiples réplicas:**

```bash
npm install @upstash/ratelimit @upstash/redis
# o
npm install ioredis
```

Reemplaza el store interno en `src/lib/rate-limiter.ts` con Redis/Upstash.
El resto del código no necesita cambios — la interfaz pública `rateLimit()` se mantiene igual.

### Escalar con Docker Compose (desarrollo)

```bash
docker compose up --scale app=3
```

> Requiere un load balancer (nginx, Traefik) frente a las réplicas y el rate limiter en Redis.

### Escalar en producción (Kubernetes / ECS / Cloud Run)

```yaml
# Ejemplo Kubernetes — HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

Para 500 usuarios concurrentes con tiempos de respuesta < 500 ms se recomienda:
- 3-5 réplicas de la app (512 MB RAM / 0.5 vCPU cada una)
- PostgreSQL con al menos 4 vCPU y connection pooling (PgBouncer)
- Redis para rate limiter y caché de sesiones opcionales

---

## Health check

El endpoint `GET /api/health` está configurado como `HEALTHCHECK` en el `Dockerfile`:

```
HTTP 200 → status: "ok"   (DB responde)
HTTP 503 → status: "degraded" (DB no responde)
```

En Kubernetes usa `livenessProbe` y `readinessProbe`:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
```

---

## Migraciones de base de datos

El `docker-entrypoint.sh` ejecuta `prisma migrate deploy` en cada inicio.
Esto es seguro porque `migrate deploy` es idempotente — solo aplica migraciones pendientes.

Para ejecutar migraciones manualmente:

```bash
docker exec -it <container_id> npx prisma migrate deploy
```

---

## Agregar nuevas variables de entorno

1. Agregar al archivo `.env.example` (con descripción y valor de ejemplo)
2. Documentar en la tabla de Variables de entorno de este archivo
3. Si es requerida en build time (prefijo `NEXT_PUBLIC_`), agregar como `ARG` en el `Dockerfile`

---

## Empujar a un registry

```bash
# Docker Hub
docker tag ncargo:latest tuusuario/ncargo:latest
docker push tuusuario/ncargo:latest

# AWS ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag ncargo:latest <account>.dkr.ecr.<region>.amazonaws.com/ncargo:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/ncargo:latest

# Google Artifact Registry
docker tag ncargo:latest <region>-docker.pkg.dev/<project>/ncargo:latest
docker push <region>-docker.pkg.dev/<project>/ncargo:latest
```
