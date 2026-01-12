#!/bin/bash
# Start Cosmos DB Emulator in Docker
# Usage: ./scripts/start-cosmos-emulator.sh

set -e

CONTAINER_NAME="cosmosdb-emulator"
COSMOS_PORT=8081
PARTITION_COUNT=10

echo "🚀 Starting Cosmos DB Emulator..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 Container '${CONTAINER_NAME}' already exists"
    
    # Check if it's running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ Emulator is already running on https://localhost:${COSMOS_PORT}"
        exit 0
    else
        echo "▶️  Starting existing container..."
        docker start ${CONTAINER_NAME}
    fi
else
    echo "📦 Creating new Cosmos DB Emulator container..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${COSMOS_PORT}:8081 \
        -p 10251-10254:10251-10254 \
        -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=${PARTITION_COUNT} \
        -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=true \
        -v cosmos-data:/tmp/cosmos \
        mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
fi

echo "⏳ Waiting for emulator to be ready (this may take 30-60 seconds)..."

# Wait for emulator to be ready (max 2 minutes)
max_attempts=24
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -k -s https://localhost:${COSMOS_PORT}/_explorer/emulator.pem > /dev/null 2>&1; then
        echo "✅ Cosmos DB Emulator is ready!"
        echo ""
        echo "📍 Endpoint: https://localhost:${COSMOS_PORT}"
        echo "🔑 Key: C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
        echo ""
        echo "Next steps:"
        echo "  1. Create containers: npm run setup:db"
        echo "  2. Start API: cd api && npm start"
        echo "  3. Start frontend: npm run dev"
        echo ""
        exit 0
    fi
    
    attempt=$((attempt + 1))
    echo "  Attempt $attempt/$max_attempts - still waiting..."
    sleep 5
done

echo "❌ Error: Emulator did not start within expected time"
echo "   Check logs: docker logs ${CONTAINER_NAME}"
exit 1
