const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { corsHeaders, corsHeadersForOrigin } = require('../shared/cors');

// Polyfill crypto for Cosmos SDK
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'creedava';
const containerId = 'analytics';

let client, database, container;

if (endpoint && key) {
  client = new CosmosClient({ endpoint, key });
  database = client.database(databaseId);
  container = database.container(containerId);
}

app.http('trackEvent', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: corsHeadersForOrigin(request.headers.origin)
      };
    }

    try {
      if (!endpoint || !key) {
        context.log('Cosmos DB not configured - skipping data collection');
        return {
          status: 200,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ success: true, message: 'Analytics not configured' })
        };
      }

      const body = await request.json();
      const { eventType, eventData, page, userAgent, referrer } = body;

      // Extract geo data from headers (provided by Azure)
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-client-ip') || 'unknown';
      const country = request.headers.get('x-ms-client-principal-country') || 
                      request.headers.get('cloudflare-ipcountry') || 'unknown';
      const region = request.headers.get('x-ms-client-principal-region') || 'unknown';

      const item = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'event',
        clientIp,
        country,
        region,
        eventType,
        eventData,
        page,
        userAgent,
        referrer,
        timestamp: new Date().toISOString(),
        ttl: 7776000 // 90 days
      };

      await container.items.create(item);

      context.log('Event tracked:', eventType);

      return {
        status: 200,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      context.error('Error tracking event:', error);
      return {
        status: 500,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }
});
