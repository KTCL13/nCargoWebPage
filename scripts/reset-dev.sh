#!/usr/bin/env bash
# Reset the local dev environment to a "freshly cloned" state.
#   - kills running dev servers / watchers / prisma studio
#   - frees ports 3000, 3001, 5555
#   - clears build caches and coverage
#   - reinstalls deps strictly from package-lock.json
#   - regenerates Prisma client
#   - runs typecheck + tests as smoke check
#
# Usage:
#   bash scripts/reset-dev.sh          # full reset (recommended)
#   bash scripts/reset-dev.sh --fast   # skip reinstall (just clear caches)
#   bash scripts/reset-dev.sh --no-test # skip the test/typecheck step

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

FAST=false
NO_TEST=false
for arg in "$@"; do
  case "$arg" in
    --fast)    FAST=true ;;
    --no-test) NO_TEST=true ;;
  esac
done

say() { printf "\n\033[1;36m==>\033[0m %s\n" "$*"; }

say "Killing project processes (dev server, jest watch, prisma studio)..."
pkill -f "next-server"   2>/dev/null || true
pkill -f "next dev"      2>/dev/null || true
pkill -f "next start"    2>/dev/null || true
pkill -f "next build"    2>/dev/null || true
pkill -f "jest --watch"  2>/dev/null || true
pkill -f "prisma studio" 2>/dev/null || true
pkill -f "tsc --watch"   2>/dev/null || true

say "Freeing ports 3000 / 3001 / 5555..."
for port in 3000 3001 5555; do
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "   killing PIDs on :$port → $pids"
    echo "$pids" | xargs -r kill -9 2>/dev/null || true
  fi
done

say "Clearing build artifacts and caches..."
rm -rf .next node_modules/.cache coverage tsconfig.tsbuildinfo

if [ "$FAST" = false ]; then
  say "Reinstalling dependencies (npm ci — strict from lockfile)..."
  npm ci
else
  say "Skipping reinstall (--fast)"
fi

say "Clearing Jest cache..."
npx jest --clearCache >/dev/null 2>&1 || true

say "Regenerating Prisma client..."
npx prisma generate >/dev/null

if [ "$NO_TEST" = false ]; then
  say "Type check..."
  npx tsc --noEmit
  say "Test suite..."
  npx jest --silent
fi

cat <<EOF

\033[1;32m✓ Reset complete.\033[0m

Next steps:
  npm run dev          # http://localhost:3000
  npx prisma studio    # browse DB on http://localhost:5555
  npm test             # run tests once
  npm run build        # production build

EOF
