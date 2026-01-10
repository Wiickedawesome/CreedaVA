#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="creedava-cosmos-emulator"
IMAGE="mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest"
HOST_PORT=8081

command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Container ${CONTAINER_NAME} already running."
  exit 0
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Removing existing stopped container ${CONTAINER_NAME}..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

echo "Starting Azure Cosmos DB emulator container (${CONTAINER_NAME})..."

docker run -d \
  --name "${CONTAINER_NAME}" \
  -p ${HOST_PORT}:8081 \
  -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=1 \
  -e AZURE_COSMOS_EMULATOR_IP_ADDRESS_OVERRIDE=127.0.0.1 \
  ${IMAGE} >/dev/null

# Wait for readiness
echo "Waiting for emulator to be ready on https://127.0.0.1:${HOST_PORT} (this may take 20-60s)..."

for i in $(seq 1 60); do
  if curl -sSf -k "https://127.0.0.1:${HOST_PORT}/_explorer/emulator.pem" >/dev/null 2>&1; then
    echo "Cosmos emulator is up and responding."
    echo "Set COSMOS_ENDPOINT=https://127.0.0.1:${HOST_PORT} and COSMOS_KEY to the emulator key (see emulator logs or the Azure emulator docs)."
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for the Cosmos emulator to be ready. Check 'docker logs ${CONTAINER_NAME}' for details." >&2
exit 2
