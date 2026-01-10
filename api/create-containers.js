const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');

// Load settings
let settings = {};
try {
  const localSettings = JSON.parse(fs.readFileSync('local.settings.json', 'utf8'));
  settings = localSettings.Values || {};
  console.log('✅ Loaded local.settings.json');
} catch (error) {
  console.error('❌ Error loading local.settings.json:', error.message);
  process.exit(1);
}

// Initialize Cosmos client
const client = new CosmosClient({
  endpoint: settings.COSMOS_ENDPOINT,
  key: settings.COSMOS_KEY,
  connectionPolicy: {
    DisableSSLVerification: true
  }
});

const databaseId = settings.COSMOS_DATABASE;

async function createContainers() {
  try {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`Database ${databaseId} ready`);

    // List of containers to create
    const containers = [
      { id: 'contacts', partitionKey: '/type' },
      { id: 'leads', partitionKey: '/type' },
      { id: 'tasks', partitionKey: '/type' },
      { id: 'projects', partitionKey: '/type' },
      { id: 'emails', partitionKey: '/type' },
      { id: 'seo', partitionKey: '/type' },
      { id: 'socialmedia', partitionKey: '/type' },
      { id: 'keywords', partitionKey: '/type' },
      { id: 'adcampaigns', partitionKey: '/type' },
      { id: 'blog', partitionKey: '/type' },
      { id: 'landingpages', partitionKey: '/type' },
      { id: 'customerjourney', partitionKey: '/type' },
      { id: 'reports', partitionKey: '/type' },
      { id: 'analytics', partitionKey: '/type' }
    ];

    for (const containerDef of containers) {
      try {
        const { container } = await database.containers.createIfNotExists({
          id: containerDef.id,
          partitionKey: {
            paths: [containerDef.partitionKey]
          }
        });
        console.log(`✅ Container '${containerDef.id}' ready`);
      } catch (error) {
        console.error(`❌ Error creating container '${containerDef.id}':`, error.message);
      }
    }

    console.log('\n🎉 All containers created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createContainers();