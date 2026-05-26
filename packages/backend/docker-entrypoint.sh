#!/bin/sh
set -e
echo "Running migrations..."
bun src/db/migrate.ts
echo "Starting server..."
exec bun run src/index.ts
