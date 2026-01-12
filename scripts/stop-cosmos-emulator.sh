#!/bin/bash
# Stop and remove Cosmos DB Emulator container
# Usage: ./scripts/stop-cosmos-emulator.sh

set -e

CONTAINER_NAME="cosmosdb-emulator"

echo "🛑 Stopping Cosmos DB Emulator..."

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ℹ️  Container '${CONTAINER_NAME}' does not exist"
    exit 0
fi

# Stop the container
echo "  Stopping container..."
docker stop ${CONTAINER_NAME} || true

# Remove the container
echo "  Removing container..."
docker rm ${CONTAINER_NAME} || true

echo "✅ Cosmos DB Emulator stopped and removed"
echo ""
echo "Note: The data volume 'cosmos-data' was preserved."
echo "To completely remove all data: docker volume rm cosmos-data"
