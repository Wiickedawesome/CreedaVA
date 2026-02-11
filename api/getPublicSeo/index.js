const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { corsHeaders, corsHeadersForOrigin } = require('../shared/cors');

// Polyfill crypto for Cosmos SDK
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

// Module-level Cosmos init (shared across requests)
let database;
let cosmosAvailable = false;

async function initializeCosmosDB() {
    if (database) return database;
    
    const endpoint = process.env.COSMOS_ENDPOINT || process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_KEY || process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DATABASE || 'creedava';
    
    if (!endpoint || !key) {
        console.warn('Cosmos DB not configured for public SEO');
        cosmosAvailable = false;
        return null;
    }
    
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
 * Returns published SEO metadata for public pages
 * 
 * GET /api/public/seo         — returns all published SEO records
 * GET /api/public/seo?url=/about — returns SEO record for a specific page URL
 */
app.http('getPublicSeo', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'public/seo',
    handler: async (request, context) => {
        const origin = request.headers.get('origin') || '';
        const headers = corsHeadersForOrigin(origin);

        if (request.method === 'OPTIONS') {
            return { status: 200, headers };
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

            const container = database.container('seo');
            const url = new URL(request.url);
            const pageUrl = url.searchParams.get('url');

            let query;
            if (pageUrl) {
                // Fetch SEO for a specific page URL
                query = {
                    query: 'SELECT * FROM c WHERE c.type = @type AND c.status = @status AND c.url = @url',
                    parameters: [
                        { name: '@type', value: 'seo' },
                        { name: '@status', value: 'published' },
                        { name: '@url', value: pageUrl }
                    ]
                };
            } else {
                // Fetch all published SEO records
                query = {
                    query: 'SELECT * FROM c WHERE c.type = @type AND c.status = @status ORDER BY c.url ASC',
                    parameters: [
                        { name: '@type', value: 'seo' },
                        { name: '@status', value: 'published' }
                    ]
                };
            }

            const { resources: items } = await container.items.query(query).fetchAll();

            // Strip internal fields, return only what the frontend needs
            const sanitized = items.map(item => ({
                url: item.url,
                title: item.title,
                metaDescription: item.metaDescription,
                targetKeywords: item.targetKeywords,
                focusKeyword: item.focusKeyword,
                canonicalUrl: item.canonicalUrl,
                openGraphTitle: item.openGraphTitle,
                openGraphDescription: item.openGraphDescription,
                openGraphImage: item.openGraphImage,
                twitterTitle: item.twitterTitle,
                twitterDescription: item.twitterDescription,
                twitterImage: item.twitterImage,
                category: item.category,
                contentType: item.contentType,
            }));

            return {
                status: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: sanitized })
            };
        } catch (error) {
            context.error('Error fetching public SEO data:', error);
            
            return {
                status: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [] })
            };
        }
    }
});
