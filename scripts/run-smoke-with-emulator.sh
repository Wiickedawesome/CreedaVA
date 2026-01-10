#!/usr/bin/env bash
set -euo pipefail

EMULATOR_CONTAINER="creedava-cosmos-emulator"
EMULATOR_STARTED=0

echo "Checking for Docker..."
if command -v docker >/dev/null 2>&1; then
  echo "Docker detected. Checking emulator container..."
  if docker ps --format '{{.Names}}' | grep -q "^${EMULATOR_CONTAINER}$"; then
    echo "Emulator container is already running."
  else
    echo "Starting emulator container..."
    npm run start:cosmos
    EMULATOR_STARTED=1
  fi
else
  echo "Docker not detected. Skipping emulator startup and running smoke tests with in-memory fallback (if enabled)."
fi

echo "Running smoke tests..."
node scripts/smoke-test.js
SMOKE_EXIT=$?

if [ "$EMULATOR_STARTED" -eq 1 ]; then
  echo "Stopping emulator container..."
  npm run stop:cosmos || true
fi

exit $SMOKE_EXIT
