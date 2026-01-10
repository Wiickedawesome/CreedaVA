const { CosmosClient } = require('@azure/cosmos');

const endpoint = 'https://localhost:8081';
const key = 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';
const databaseId = 'CreedaVA';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new CosmosClient({ endpoint, key, connectionPolicy: { DisableSSLVerification: true } });

async function checkPartitions() {
    try {
        const database = client.database(databaseId);
        const { resources: containers } = await database.containers.readAll().fetchAll();
        
        console.log('\n📦 Container Partition Keys:\n');
        for (const containerDef of containers) {
            const container = database.container(containerDef.id);
            const { resource } = await container.read();
            console.log(`  ${resource.id.padEnd(20)} → ${JSON.stringify(resource.partitionKey.paths)}`);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkPartitions();
