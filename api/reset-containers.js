const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');

// Destructive: drops listed containers then recreates them with /type partition key.
// Ensure local.settings.json (or env vars) has COSMOS_ENDPOINT, COSMOS_KEY, COSMOS_DATABASE.

function loadSettings() {
  try {
    const raw = fs.readFileSync('local.settings.json', 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.Values || {};
  } catch (err) {
    console.error('❌ Failed to load local.settings.json. Provide COSMOS_* env vars or a settings file.');
    throw err;
  }
}

async function main() {
  const settings = {
    COSMOS_ENDPOINT: process.env.COSMOS_ENDPOINT,
    COSMOS_KEY: process.env.COSMOS_KEY,
    COSMOS_DATABASE: process.env.COSMOS_DATABASE,
    ...(!process.env.COSMOS_ENDPOINT ? loadSettings() : {}),
  };

  const { COSMOS_ENDPOINT: endpoint, COSMOS_KEY: key, COSMOS_DATABASE: databaseId } = settings;
  if (!endpoint || !key || !databaseId) {
    throw new Error('Missing COSMOS_ENDPOINT, COSMOS_KEY, or COSMOS_DATABASE');
  }

  const client = new CosmosClient({ endpoint, key, connectionPolicy: { DisableSSLVerification: true } });
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  console.log(`🔗 Connected to database ${databaseId}`);

  const containers = [
    'contacts',
    'leads',
    'tasks',
    'projects',
    'emails',
    'seo',
    'socialmedia',
    'keywords',
    'adcampaigns',
    'blog',
    'landingpages',
    'customerjourney',
    'reports',
    'analytics',
  ];

  for (const id of containers) {
    try {
      console.log(`⚠️  Dropping container '${id}'`);
      await database.container(id).delete();
    } catch (err) {
      if (err.code !== 404) {
        console.warn(`⚠️  Could not drop '${id}': ${err.message}`);
      } else {
        console.log(`ℹ️  Container '${id}' not found; skipping drop.`);
      }
    }

    console.log(`➕ Creating container '${id}' with partition /type`);
    await database.containers.createIfNotExists({
      id,
      partitionKey: { paths: ['/type'] },
    });
  }

  console.log('✅ Containers reset complete (partition key = /type).');
}

main().catch((err) => {
  console.error('❌ Reset failed:', err.message);
  process.exit(1);
});
