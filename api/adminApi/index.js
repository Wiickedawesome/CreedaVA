const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { validateBearer } = require('../shared/auth');
const { corsHeaders } = require('../shared/cors');

const allowInMemoryFallback = process.env.ALLOW_INMEMORY_FALLBACK === 'true';
const useCosmosEmulator = process.env.USE_COSMOS_EMULATOR === 'true';

// In-memory storage for development when Cosmos DB isn't available
const inMemoryData = {
    leads: [],
    tasks: [],
    projects: [],
    contacts: [],
    reports: [],
    seo: [],
    keywords: [],
    social: [],
    blog: [],
    campaigns: [],
    landingPages: [],
    customerJourneys: [],
    emails: []
};

// Initialize Cosmos DB
let cosmosAvailable = false;
let database;
let client;

function logDiagnostics(context, operation, startTime, headers = {}) {
    const durationMs = Date.now() - startTime;
    const charge = headers['x-ms-request-charge'] || headers['x-ms-request-charge'.toLowerCase()] || headers['X-MS-REQUEST-CHARGE'];
    const activityId = headers['x-ms-activity-id'] || headers['x-ms-activity-id'.toLowerCase()] || headers['X-MS-ACTIVITY-ID'];
    if (durationMs > 500 || charge || activityId) {
        context.log(`diag ${operation}: ${durationMs}ms${charge ? ` RU:${charge}` : ''}${activityId ? ` activity:${activityId}` : ''}`);
    }
}

async function initializeCosmosDB() {
    if (database) return database; // Already initialized
    
    try {
        let endpoint = process.env.COSMOS_ENDPOINT || process.env.COSMOS_DB_ENDPOINT;
        let key = process.env.COSMOS_KEY || process.env.COSMOS_DB_KEY;
        const dbName = process.env.COSMOS_DATABASE || 'CreedaVA';

        if ((!endpoint || !key) && useCosmosEmulator) {
            endpoint = process.env.COSMOS_EMULATOR_ENDPOINT || 'https://localhost:8081';
            key = process.env.COSMOS_EMULATOR_KEY || 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==';
        }

        if (!endpoint || !key) {
            console.warn('Cosmos DB credentials not configured; admin APIs will run without persistence');
            cosmosAvailable = false;
            return null;
        }

        console.log(`Attempting to connect to Cosmos DB: ${endpoint}`);

        const connectionPolicy = {};
        if (useCosmosEmulator || endpoint.includes('localhost')) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            Object.assign(connectionPolicy, {
                DisableSSLVerification: true,
                enableEndpointDiscovery: false
            });
        }

        client = new CosmosClient({ endpoint, key, connectionPolicy });
        database = client.database(dbName);
        const start = Date.now();
        await database.read();
        logDiagnostics(console, 'cosmos-database-read', start, {});
        cosmosAvailable = true;
        console.log(`✅ Cosmos DB connected: ${dbName} at ${endpoint}`);
        return database;
    } catch (error) {
        console.warn('Cosmos DB not available, using in-memory storage:', error.message);
        cosmosAvailable = false;
        return null;
    }
}

// Generic CRUD operations for all admin entities
const CONTAINERS = {
    leads: 'leads',
    tasks: 'tasks', 
    projects: 'projects',
    contacts: 'contacts',
    reports: 'reports',
    seo: 'seo',
    keywords: 'keywords',
    social: 'socialmedia',
    blog: 'blog',
    campaigns: 'adcampaigns',
    landingPages: 'landingpages',
    customerJourneys: 'customerjourney',
    emails: 'emails'
};

// Helpers: compute SEO and readability deterministically so items created via API have sensible defaults
function computeReadability(text) {
    const words = (text || '').trim().split(/\s+/).filter(w => w.length > 0).length || 0;
    const base = 50;
    const bonus = Math.min(40, Math.floor(words / 50)); // +1 per 50 words up to +40
    return Math.min(100, base + bonus);
}

function computeSeoScore(item) {
    // Simple deterministic scoring to mirror frontend heuristics
    let score = 0;
    if (item.title && item.title.length <= 60) score += 20;
    if (item.metaDescription && item.metaDescription.length <= 160) score += 20;
    if (item.targetKeywords) score += 15;
    if (item.focusKeyword) score += 15;
    if (item.content && item.content.length > 300) score += 15;
    if (item.canonicalUrl) score += 10;
    if (item.openGraphTitle || item.twitterTitle) score += 5;
    return Math.min(score, 100);
}

// GET functions
Object.keys(CONTAINERS).forEach(entityType => {
    app.http(`get${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`, {
        methods: ['GET'],
        route: `get${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
        authLevel: 'anonymous',
        handler: async (request, context) => {
            try {
                await validateBearer(request);
            } catch (authError) {
                return {
                    status: 401,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ success: false, error: 'Unauthorized' })
                };
            }

            try {
                await initializeCosmosDB();
                let resources = [];
                if (cosmosAvailable && database) {
                    const container = database.container(CONTAINERS[entityType]);
                    context.log(`Querying ${entityType} in container ${CONTAINERS[entityType]}`);
                    const start = Date.now();
                    const { resources: cosmosResources, headers } = await container.items
                        .query({
                            query: 'SELECT * FROM c WHERE c.type = @type',
                            parameters: [{ name: '@type', value: entityType }]
                        })
                        .fetchAll();
                    logDiagnostics(context, `query-${entityType}`, start, headers);
                    context.log(`Found ${cosmosResources.length} items for type ${entityType}`);
                    resources = cosmosResources;
                } else if (allowInMemoryFallback) {
                    resources = inMemoryData[entityType] || [];
                } else {
                    return {
                        status: 503,
                        headers: corsHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({
                            success: false,
                            error: 'Database not available and in-memory fallback disabled'
                        })
                    };
                }
                return {
                    status: 200,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        success: true,
                        data: resources,
                        count: resources.length,
                        source: cosmosAvailable ? 'cosmos' : 'memory'
                    })
                };
            } catch (error) {
                context.error('Error fetching data:', error);
                if (allowInMemoryFallback) {
                    const resources = inMemoryData[entityType] || [];
                    return {
                        status: 200,
                        headers: corsHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ 
                            success: true, 
                            data: resources,
                            count: resources.length,
                            source: 'memory-fallback',
                            error: error.message
                        })
                    };
                }
                return {
                    status: 500,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ success: false, error: error.message })
                };
            }
        }
    });
});

// CREATE functions
Object.keys(CONTAINERS).forEach(entityType => {
    app.http(`create${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`, {
        methods: ['POST'],
        route: `create${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
        authLevel: 'anonymous',
        handler: async (request, context) => {
            try {
                await validateBearer(request);
            } catch (authError) {
                return {
                    status: 401,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ success: false, error: 'Unauthorized' })
                };
            }

            try {
                await initializeCosmosDB();
                const data = await request.json();
                // `type` is the Cosmos partition key (and used in reads); never accept it from callers.
                // Also never accept `id` or timestamps from callers.
                const {
                    type: _ignoredType,
                    id: _ignoredId,
                    createdAt: _ignoredCreatedAt,
                    updatedAt: _ignoredUpdatedAt,
                    ...payload
                } = data || {};

                const nowIso = new Date().toISOString();
                const newItem = {
                    ...payload,
                    id: `${entityType}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                    type: entityType,
                    createdAt: nowIso,
                    updatedAt: nowIso
                };

                // Set deterministic defaults for certain entity types
                if (entityType === 'seo') {
                    newItem.seoScore = computeSeoScore(newItem);
                    newItem.readabilityScore = computeReadability(newItem.content || '');
                }

                if (entityType === 'keywords') {
                    // If no rank history provided but a currentRank exists, seed one entry
                    if ((!newItem.rankHistory || newItem.rankHistory.length === 0) && newItem.currentRank) {
                        newItem.rankHistory = [
                            { date: nowIso, rank: newItem.currentRank, searchVolume: newItem.searchVolume || 0 }
                        ];
                    }
                }

                if (cosmosAvailable && database) {
                    const container = database.container(CONTAINERS[entityType]);
                    const start = Date.now();
                    const { resource, headers } = await container.items.create(newItem);
                    logDiagnostics(context, `create-${entityType}`, start, headers);
                    
                    return {
                        status: 201,
                        headers: corsHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({
                            success: true,
                            data: resource,
                            source: 'cosmos'
                        })
                    };
                } else if (allowInMemoryFallback) {
                    inMemoryData[entityType].push(newItem);
                    
                    return {
                        status: 201,
                        headers: corsHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({
                            success: true,
                            data: newItem,
                            source: 'memory'
                        })
                    };
                }

                return {
                    status: 503,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ success: false, error: 'Database not available and in-memory fallback disabled' })
                };
            } catch (error) {
                context.error('Error creating item:', error);
                return {
                    status: 500,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ 
                        success: false, 
                        error: error.message 
                    })
                };
            }
        }
    });
});

// UPDATE functions  
Object.keys(CONTAINERS).forEach(entityType => {
    app.http(`update${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`, {
        methods: ['PUT'],
        route: `update${entityType.charAt(0).toUpperCase() + entityType.slice(1)}/{id}`,
        authLevel: 'anonymous',
        handler: async (request, context) => {
            try {
                await validateBearer(request);
            } catch (authError) {
                return {
                    status: 401,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ success: false, error: 'Unauthorized' })
                };
            }

            try {
                await initializeCosmosDB();
                if (!cosmosAvailable || !database) {
                    if (allowInMemoryFallback) {
                        const inMemoryItems = inMemoryData[entityType] || [];
                        const index = inMemoryItems.findIndex(item => item.id === request.params.id);
                        if (index === -1) {
                            return {
                                status: 404,
                                headers: corsHeaders({ 'Content-Type': 'application/json' }),
                                body: JSON.stringify({ success: false, error: 'Item not found' })
                            };
                        }
                        const data = await request.json();
                        const {
                            type: _ignoredType,
                            id: _ignoredId,
                            createdAt: _ignoredCreatedAt,
                            updatedAt: _ignoredUpdatedAt,
                            ...payload
                        } = data || {};
                        const nowIso = new Date().toISOString();
                        const existing = inMemoryItems[index] || {};
                        const updated = {
                            ...existing,
                            ...payload,
                            id: request.params.id,
                            type: entityType,
                            createdAt: existing.createdAt || nowIso,
                            updatedAt: nowIso
                        };
                        inMemoryItems[index] = updated;
                        return {
                            status: 200,
                            headers: corsHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ success: true, data: updated, source: 'memory' })
                        };
                    }
                    return {
                        status: 503,
                        headers: corsHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ success: false, error: 'Database not available and in-memory fallback disabled' })
                    };
                }

                const id = request.params.id;
                const data = await request.json();
                const container = database.container(CONTAINERS[entityType]);

                const {
                    type: _ignoredType,
                    id: _ignoredId,
                    createdAt: _ignoredCreatedAt,
                    updatedAt: _ignoredUpdatedAt,
                    ...payload
                } = data || {};

                const nowIso = new Date().toISOString();

                let existing;
                try {
                    const startRead = Date.now();
                    const { resource, headers } = await container.item(id, entityType).read();
                    logDiagnostics(context, `read-${entityType}`, startRead, headers);
                    existing = resource;
                } catch (readError) {
                    const statusCode = readError?.statusCode || readError?.code;
                    if (statusCode === 404) {
                        return {
                            status: 404,
                            headers: corsHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ success: false, error: 'Item not found' })
                        };
                    }
                    throw readError;
                }
                
                const updatedItem = {
                    ...(existing || {}),
                    ...payload,
                    id,
                    type: entityType,
                    createdAt: existing?.createdAt || nowIso,
                    updatedAt: nowIso
                };

                // Recompute derived fields for SEO and ensure keyword rank history exists
                if (entityType === 'seo') {
                    updatedItem.seoScore = computeSeoScore(updatedItem);
                    updatedItem.readabilityScore = computeReadability(updatedItem.content || '');
                }

                if (entityType === 'keywords') {
                    if ((!updatedItem.rankHistory || updatedItem.rankHistory.length === 0) && updatedItem.currentRank) {
                        updatedItem.rankHistory = [
                            { date: nowIso, rank: updatedItem.currentRank, searchVolume: updatedItem.searchVolume || 0 }
                        ];
                    }
                }

                const start = Date.now();
                const { resource, headers } = await container.item(id, entityType).replace(updatedItem);
                logDiagnostics(context, `update-${entityType}`, start, headers);
                
                return {
                    status: 200,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        success: true,
                        data: resource
                    })
                };
            } catch (error) {
                context.error('Error updating item:', error);
                return {
                    status: 500,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ 
                        success: false, 
                        error: error.message 
                    })
                };
            }
        }
    });
});

// DELETE functions
Object.keys(CONTAINERS).forEach(entityType => {
    app.http(`delete${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`, {
        methods: ['DELETE'],
        route: `delete${entityType.charAt(0).toUpperCase() + entityType.slice(1)}/{id}`,
        authLevel: 'anonymous',
        handler: async (request, context) => {
            try {
                await validateBearer(request);
            } catch (authError) {
                return {
                    status: 401,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ success: false, error: 'Unauthorized' })
                };
            }

            try {
                await initializeCosmosDB();
                if (!cosmosAvailable || !database) {
                    if (allowInMemoryFallback) {
                        const items = inMemoryData[entityType] || [];
                        const index = items.findIndex(item => item.id === request.params.id);
                        if (index === -1) {
                            return {
                                status: 404,
                                headers: corsHeaders({ 'Content-Type': 'application/json' }),
                                body: JSON.stringify({ success: false, error: 'Item not found' })
                            };
                        }
                        items.splice(index, 1);
                        return {
                            status: 200,
                            headers: corsHeaders({ 'Content-Type': 'application/json' }),
                            body: JSON.stringify({ success: true, message: 'Item deleted successfully', source: 'memory' })
                        };
                    }
                    return {
                        status: 503,
                        headers: corsHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ success: false, error: 'Database not available and in-memory fallback disabled' })
                    };
                }

                const id = request.params.id;
                const container = database.container(CONTAINERS[entityType]);
                
                const start = Date.now();
                const { headers } = await container.item(id, entityType).delete();
                logDiagnostics(context, `delete-${entityType}`, start, headers || {});
                
                return {
                    status: 200,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        success: true,
                        message: 'Item deleted successfully'
                    })
                };
            } catch (error) {
                context.error('Error deleting item:', error);
                return {
                    status: 500,
                    headers: corsHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ 
                        success: false, 
                        error: error.message 
                    })
                };
            }
        }
    });
});

console.log('✅ Admin API functions registered successfully');