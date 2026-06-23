#!/bin/sh

echo "=== SOULDAWN WEB START ==="

echo "Applying Prisma migrations..."
npx prisma migrate resolve --applied 0001_init || true
npx prisma migrate resolve --applied 0002_identities || true
npx prisma migrate deploy

echo "Starting Next.js on port $PORT..."
HOSTNAME="0.0.0.0" exec node server.js
