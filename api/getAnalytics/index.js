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
  authLevel: 'anonymous', // Changed to anonymous for admin panel access
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
            message: 'Database not configured' 
          })
        };
      }

      // Get query parameters
      const url = new URL(request.url);
      const tableName = url.searchParams.get('table') || 'analytics';
      const orderBy = url.searchParams.get('orderBy');
      const orderDirection = url.searchParams.get('orderDirection') || 'desc';
      const limitCount = parseInt(url.searchParams.get('limit') || '1000');

      // Use specified table
      const targetContainer = database.container(tableName);

      // Build query for general table access
      let query = 'SELECT * FROM c';
      const parameters = [];

      // Add filters if provided
      const filterKeys = Array.from(url.searchParams.keys()).filter(k => k.startsWith('filter'));
      if (filterKeys.length > 0) {
        const conditions = [];
        filterKeys.forEach((key, index) => {
          try {
            const filter = JSON.parse(url.searchParams.get(key));
            conditions.push(`c.${filter.column} = @filter${index}`);
            parameters.push({ name: `@filter${index}`, value: filter.value });
          } catch (e) {
            context.error('Invalid filter:', e);
          }
        });
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
      }

      // Add ordering
      if (orderBy) {
        query += ` ORDER BY c.${orderBy} ${orderDirection.toUpperCase()}`;
      }

      // Execute query
      const { resources } = await targetContainer.items
        .query({ query, parameters })
        .fetchAll();

      // Apply limit if needed
      const limitedResources = limitCount ? resources.slice(0, limitCount) : resources;

      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(limitedResources)
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
