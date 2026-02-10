const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { corsHeaders, corsHeadersForOrigin } = require('../shared/cors');

// Polyfill crypto for Cosmos SDK
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

// Module-level Cosmos init (shared across requests like other endpoints)
let database;
let cosmosAvailable = false;

async function initializeCosmosDB() {
    if (database) return database;
    
    const endpoint = process.env.COSMOS_ENDPOINT || process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_KEY || process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DATABASE || 'creedava';
    
    if (!endpoint || !key) {
        console.warn('Cosmos DB not configured for public blog');
        cosmosAvailable = false;
        return null;
    }
    
    // Configure for emulator if needed
    const useEmulator = process.env.USE_COSMOS_EMULATOR === 'true';
    const connectionPolicy = useEmulator ? {
        DisableSSLVerification: true,
        enableEndpointDiscovery: false
    } : {};
    
    const client = new CosmosClient({ endpoint, key, connectionPolicy });
    database = client.database(databaseName);
    cosmosAvailable = true;
    return database;
}

/**
 * PUBLIC endpoint - no authentication required
 * Returns only PUBLISHED blog posts for public consumption
 */
app.http('getPublicBlog', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'public/blog',
    handler: async (request, context) => {
        const origin = request.headers.get('origin') || '';
        const headers = corsHeadersForOrigin(origin);

        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers
            };
        }

        try {
            await initializeCosmosDB();
            
            if (!cosmosAvailable || !database) {
                return {
                    status: 200,
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: [] })
                };
            }

            const container = database.container('blog');
            
            // Query ONLY published blogs
            const query = {
                query: 'SELECT * FROM c WHERE c.type = @type AND c.status = @status AND c.isPublished = @isPublished ORDER BY c.publishedAt DESC, c.createdAt DESC',
                parameters: [
                    { name: '@type', value: 'blog' },
                    { name: '@status', value: 'published' },
                    { name: '@isPublished', value: true }
                ]
            };
            
            const { resources: items } = await container.items.query(query).fetchAll();
            
            return {
                status: 200,
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: items })
            };
        } catch (error) {
            context.error('Error fetching public blog posts:', error);
            
            // Return empty array instead of error for better UX
            return {
                status: 200,
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [] })
            };
        }
    }
});
