#!/bin/sh
set -e

# Run pending Prisma migrations before starting the app.
# Safe to run on every startup — idempotent.
echo "[entrypoint] Running database migrations..."
npx prisma migrate deploy

echo "[entrypoint] Starting Next.js..."
exec "$@"
