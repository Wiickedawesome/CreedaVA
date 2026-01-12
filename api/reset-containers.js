#!/usr/bin/env node
/**
 * DESTRUCTIVE: Delete and recreate all Cosmos DB containers
 * 
 * WARNING: This will delete ALL data in the database!
 * Use only for development/testing.
 * 
 * Usage:
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 node reset-containers.js
 */

const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_ENDPOINT || 'https://localhost:8081';
const key = process.env.COSMOS_KEY || 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';
const databaseId = process.env.COSMOS_DATABASE || 'creedava';

const CONTAINERS = [
  'contacts',
  'leads',
  'tasks',
  'projects',
  'emails',
  'seo',
  'keywords',
  'socialmedia',
  'adcampaigns',
  'blog',
  'landingpages',
  'customerjourney',
  'reports',
  'analytics'
];

async function resetContainers() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA and recreate containers!');
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🗄️  Database: ${databaseId}`);
  console.log('');

  const connectionPolicy = {};
  if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    connectionPolicy.DisableSSLVerification = true;
    connectionPolicy.enableEndpointDiscovery = false;
  }

  const client = new CosmosClient({ endpoint, key, connectionPolicy });

  try {
    const database = client.database(databaseId);
    
    // Delete all containers
    console.log('🗑️  Deleting existing containers...');
    for (const containerId of CONTAINERS) {
      try {
        await database.container(containerId).delete();
        console.log(`  ✅ Deleted: ${containerId}`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`  ℹ️  Not found (skipped): ${containerId}`);
        } else {
          console.error(`  ❌ Error deleting ${containerId}:`, error.message);
        }
      }
    }

    console.log('');
    console.log('📦 Creating fresh containers...');
    
    // Recreate all containers
    for (const containerId of CONTAINERS) {
      const { resource } = await database.containers.create({
        id: containerId,
        partitionKey: {
          paths: ['/type'],
          version: 2
        }
      });
      console.log(`  ✅ Created: ${containerId}`);
    }

    console.log('');
    console.log('🎉 Reset complete! All containers recreated with no data.');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

resetContainers();
