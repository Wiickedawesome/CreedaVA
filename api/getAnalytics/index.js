const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'website-data';
const containerId = process.env.COSMOS_CONTAINER || 'analytics';

let client, database, container;

if (endpoint && key) {
  client = new CosmosClient({ endpoint, key });
  database = client.database(databaseId);
  container = database.container(containerId);
}

app.http('getAnalytics', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'function', // Requires function key for security
  handler: async (request, context) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-functions-key'
        }
      };
    }

    try {
      if (!endpoint || !key) {
        return {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            success: true, 
            data: [], 
            message: 'Analytics not configured' 
          })
        };
      }

      // Get query parameters
      const url = new URL(request.url);
      const days = parseInt(url.searchParams.get('days') || '30');
      const eventType = url.searchParams.get('eventType');

      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Build query
      let query = 'SELECT * FROM c WHERE c.type = "event" AND c.timestamp >= @startDate';
      const parameters = [
        { name: '@startDate', value: startDate.toISOString() }
      ];

      if (eventType) {
        query += ' AND c.eventType = @eventType';
        parameters.push({ name: '@eventType', value: eventType });
      }

      query += ' ORDER BY c.timestamp DESC';

      const { resources } = await container.items
        .query({ query, parameters })
        .fetchAll();

      // Calculate summary statistics
      const summary = {
        totalEvents: resources.length,
        uniquePages: new Set(resources.map(r => r.page)).size,
        eventTypes: {}
      };

      resources.forEach(event => {
        if (!summary.eventTypes[event.eventType]) {
          summary.eventTypes[event.eventType] = 0;
        }
        summary.eventTypes[event.eventType]++;
      });

      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: true, 
          data: resources,
          summary
        })
      };
    } catch (error) {
      context.error('Error fetching analytics:', error);
      return {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false, 
          error: error.message 
        })
      };
    }
  }
});
