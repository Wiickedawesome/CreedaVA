#!/usr/bin/env node
/**
 * Create all required Cosmos DB containers for CreedaVA
 * 
 * Usage:
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 node create-containers.js
 * 
 * Environment Variables:
 *   COSMOS_ENDPOINT - Cosmos DB endpoint (default: https://localhost:8081 for emulator)
 *   COSMOS_KEY - Cosmos DB key (default: emulator key)
 *   COSMOS_DATABASE - Database name (default: creedava)
 */

const { CosmosClient } = require('@azure/cosmos');

// Default to Cosmos emulator for local development
const endpoint = process.env.COSMOS_ENDPOINT || 'https://localhost:8081';
const key = process.env.COSMOS_KEY || 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';
const databaseId = process.env.COSMOS_DATABASE || 'creedava';

// All containers that need to be created
// All use partition key /type to match the admin API convention
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

async function createContainers() {
  console.log('🚀 Starting Cosmos DB container creation...');
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🗄️  Database: ${databaseId}`);
  console.log('');

  // Configure client for emulator if needed
  const connectionPolicy = {};
  if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
    console.log('🔧 Using local emulator - disabling SSL verification');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    connectionPolicy.DisableSSLVerification = true;
    connectionPolicy.enableEndpointDiscovery = false;
  }

  const client = new CosmosClient({ endpoint, key, connectionPolicy });

  try {
    // Create database if it doesn't exist
    console.log(`📦 Creating database "${databaseId}"...`);
    const { database } = await client.databases.createIfNotExists({ 
      id: databaseId 
    });
    console.log(`✅ Database "${databaseId}" ready`);
    console.log('');

    // Create all containers
    let created = 0;
    let existed = 0;

    for (const containerId of CONTAINERS) {
      try {
        console.log(`📦 Creating container "${containerId}"...`);
        const { resource } = await database.containers.createIfNotExists({
          id: containerId,
          partitionKey: {
            paths: ['/type'],
            version: 2
          },
          // Optional: configure throughput (400 RU/s is minimum)
          // throughput: 400
        });

        if (resource) {
          console.log(`✅ Container "${containerId}" created successfully`);
          created++;
        } else {
          console.log(`ℹ️  Container "${containerId}" already exists`);
          existed++;
        }
      } catch (error) {
        console.error(`❌ Error creating container "${containerId}":`, error.message);
        throw error;
      }
    }

    console.log('');
    console.log('🎉 Container creation complete!');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ℹ️  Already existed: ${existed}`);
    console.log(`   📊 Total: ${CONTAINERS.length}`);
    console.log('');
    console.log('✨ Your Cosmos DB is ready for use!');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Failed to create containers:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('  1. Cosmos emulator not running: docker ps | grep cosmos');
    console.error('  2. Wrong endpoint or key in environment variables');
    console.error('  3. SSL certificate issues: make sure NODE_TLS_REJECT_UNAUTHORIZED=0 is set');
    console.error('');
    process.exit(1);
  }
}

createContainers();
