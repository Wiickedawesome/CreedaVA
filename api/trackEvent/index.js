const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { corsHeaders } = require('../shared/cors');

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
        headers: corsHeaders({ 'Access-Control-Allow-Methods': 'POST, OPTIONS' })
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

      const item = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'event',
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
