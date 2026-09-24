#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "⚡ FlashLearn: Running Drizzle schema push..."
  bun run --cwd /app/apps/api db:push || echo "⚠️ FlashLearn DB push warning, continuing to start API..."
fi

echo "🚀 Launching FlashLearn Engine on port ${PORT:-3000}..."
exec bun /app/apps/api/src/index.ts
