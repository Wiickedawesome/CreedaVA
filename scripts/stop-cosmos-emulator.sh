#!/usr/bin/env bash
set -euo pipefail
CONTAINER_NAME="creedava-cosmos-emulator"

command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Stopping and removing ${CONTAINER_NAME}..."
  docker rm -f "${CONTAINER_NAME}"
  exit 0
fi

echo "No running ${CONTAINER_NAME} container found."
exit 0
