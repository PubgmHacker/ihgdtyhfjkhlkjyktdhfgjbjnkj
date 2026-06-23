#!/bin/bash
# SOULDAWN web (Next.js) — Railway start script.
set -e
echo "=== SOULDAWN WEB START ==="

# Apply pending Prisma migrations against the production DB.
if [ -n "$DATABASE_URL" ]; then
  echo "Applying Prisma migrations..."
  node node_modules/prisma/build/index.js migrate deploy || echo "!!! migrate deploy failed (continuing) !!!"
else
  echo "!!! DATABASE_URL not set — skipping migrations !!!"
fi

# Start the standalone Next.js server. Railway provides $PORT.
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"
echo "Starting Next.js on port $PORT..."
exec node server.js
