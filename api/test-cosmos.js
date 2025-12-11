#!/usr/bin/env node
/**
 * Cosmos DB Setup Verification Script
 * This script checks your Cosmos DB configuration and creates containers if needed
 */

const { CosmosClient } = require('@azure/cosmos');

// Load from local.settings.json
const settings = require('./local.settings.json');
const endpoint = settings.Values.COSMOS_ENDPOINT;
const key = settings.Values.COSMOS_KEY;
const databaseId = settings.Values.COSMOS_DATABASE || 'website-data';

console.log('🔍 Verifying Cosmos DB Setup...\n');
console.log('Endpoint:', endpoint);
console.log('Database:', databaseId);
console.log('');

const client = new CosmosClient({ endpoint, key });

async function verifySetup() {
  try {
    // 1. Check database connection
    console.log('✓ Testing connection...');
    await client.getDatabaseAccount();
    console.log('✅ Connected to Cosmos DB successfully!\n');

    // 2. Check/Create database
    console.log('✓ Checking database:', databaseId);
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    console.log('✅ Database exists or created\n');

    // 3. Define required containers
    const containers = [
      { id: 'analytics', partitionKey: '/type', ttl: 7776000 }, // 90 days
      { id: 'contacts', partitionKey: '/type', ttl: -1 }, // No TTL
      { id: 'users', partitionKey: '/id', ttl: -1 }, // No TTL
      { id: 'linkedin-data', partitionKey: '/id', ttl: -1 } // Existing
    ];

    // 4. Check/Create each container
    for (const containerConfig of containers) {
      console.log(`✓ Checking container: ${containerConfig.id}`);
      
      const containerDef = {
        id: containerConfig.id,
        partitionKey: { paths: [containerConfig.partitionKey] }
      };

      if (containerConfig.ttl !== -1) {
        containerDef.defaultTtl = containerConfig.ttl;
      }

      const { container } = await database.containers.createIfNotExists(containerDef);
      console.log(`✅ Container "${containerConfig.id}" ready (partition: ${containerConfig.partitionKey})`);
    }

    console.log('\n🎉 Cosmos DB setup verified successfully!\n');
    console.log('📊 Database structure:');
    console.log('  ├─ Database: website-data');
    console.log('  ├─ Container: analytics (for tracking events)');
    console.log('  ├─ Container: contacts (for contact forms)');
    console.log('  ├─ Container: users (for authentication)');
    console.log('  └─ Container: linkedin-data (for LinkedIn integration)');
    console.log('\n✅ Your Cosmos DB is ready to use!\n');

    // 5. Test write/read
    console.log('✓ Testing write/read operations...');
    const analyticsContainer = database.container('analytics');
    
    const testItem = {
      id: `test-${Date.now()}`,
      type: 'page_view',
      page: '/test',
      timestamp: new Date().toISOString(),
      metadata: { source: 'setup-verification' }
    };

    await analyticsContainer.items.create(testItem);
    console.log('✅ Successfully wrote test event to analytics container');

    const { resource } = await analyticsContainer.item(testItem.id, testItem.type).read();
    console.log('✅ Successfully read test event from analytics container');
    
    await analyticsContainer.item(testItem.id, testItem.type).delete();
    console.log('✅ Successfully deleted test event\n');

    console.log('🚀 Next steps:');
    console.log('  1. Start Azure Functions: cd api && func start');
    console.log('  2. Start frontend: npm run dev');
    console.log('  3. Visit http://localhost:5173');
    console.log('  4. Browse the site to generate analytics events');
    console.log('  5. Check admin dashboard at /admin/analytics\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  - Check that COSMOS_ENDPOINT and COSMOS_KEY are correct');
    console.error('  - Verify your Azure Cosmos DB account is active');
    console.error('  - Ensure your IP is allowed in firewall rules (if enabled)');
    process.exit(1);
  }
}

verifySetup();
