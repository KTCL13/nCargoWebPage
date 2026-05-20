# Postman — N-Cargo Security Tests

Colección Postman para verificar los fixes de seguridad y los endpoints clave de la rama `secfix`.

## Archivos

- `ncargo-security-tests.postman_collection.json` — Collection con 6 carpetas (~35 requests).
- `ncargo-local.postman_environment.json` — Environment con `baseUrl`, credenciales y tokens.

## Setup

1. Abre Postman → **Import** → arrastra los 2 archivos.
2. Arriba a la derecha, selecciona el environment **"N-Cargo Local"**.
3. Ajusta `adminEmail` / `adminPassword` / `employeeEmail` / `employeePassword` si tus usuarios son distintos.
4. Arranca la app: `npm run dev` (debe estar en `http://localhost:3000`).

## Orden de ejecución

| Carpeta | Qué hace | Notas |
|---|---|---|
| **1. Auth** | Login admin/empleado, register, logout | Los tokens se guardan automáticamente en `adminToken` y `empToken` |
| **2. Security — Auth gating** | Verifica 401/403 en endpoints protegidos | Requiere haber corrido carpeta 1 |
| **3. Rate limiting** | Spam de login (correr 12 veces en Collection Runner) | Después del 10º intento debe responder 429 |
| **4. Admin operations** | Listados que solo admin puede ver | Requiere `adminToken` |
| **5. Employee operations** | Self-scope: /me, notifications, attendance | Requiere `empToken` |
| **6. Public endpoints** | Cotizaciones públicas — sin token | Sin auth |

## Asserts automáticos

Cada request tiene tests en la pestaña **Tests** que validan el código HTTP esperado. Para correr toda la colección:

1. Click en la colección → "Run".
2. Selecciona el environment.
3. Run.

Esperado: ~30+ tests passed.

## Notas

- La carpeta de **Rate limiting** la debes correr **manualmente con N ≥ 12 iteraciones** (Collection Runner → tab Run → "Iterations: 12").
- Los tokens JWT expiran después de 1 día. Si fallan los requests con 401, vuelve a correr "Login admin" o "Login employee".
- Si el endpoint de register dice "Ya existe", el usuario `hacker.test@evil.com` ya está creado de una corrida anterior. Es OK — el login funciona igual.
