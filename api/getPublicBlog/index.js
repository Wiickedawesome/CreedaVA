const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { corsHeaders, corsHeadersForOrigin } = require('../shared/cors');

// Polyfill crypto for Cosmos SDK
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

let cosmosClient;
let database;

async function getCosmosDB() {
    if (database) return database;
    
    const endpoint = process.env.COSMOS_ENDPOINT || process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_KEY || process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DATABASE_NAME || 'CreedaVA';
    
    if (!endpoint || !key) {
        throw new Error('Cosmos DB not configured');
    }
    
    // Configure for emulator if needed
    const useEmulator = process.env.USE_COSMOS_EMULATOR === 'true';
    const connectionPolicy = useEmulator ? {
        DisableSSLVerification: true
    } : {};
    
    cosmosClient = new CosmosClient({ endpoint, key, connectionPolicy });
    database = cosmosClient.database(databaseName);
    return database;
}

/**
 * PUBLIC endpoint - no authentication required
 * Returns only PUBLISHED blog posts for public consumption
 */
app.http('getPublicBlog', {
    methods: ['GET'],
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
            const db = await getCosmosDB();
            const container = db.container('blog');
            
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
