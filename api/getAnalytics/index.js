const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { validateBearer } = require('../shared/auth');
const { corsHeaders, corsHeadersForOrigin } = require('../shared/cors');

// Polyfill crypto for Cosmos SDK
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

const useCosmosEmulator = process.env.USE_COSMOS_EMULATOR === 'true';
const allowInMemoryFallback = process.env.ALLOW_INMEMORY_FALLBACK === 'true';

// In-memory storage for development when Cosmos DB isn't available
const inMemoryData = {
  analytics: [
    {
      id: '1',
      type: 'event',
      eventType: 'page_view',
      page: '/admin/dashboard',
      timestamp: new Date().toISOString(),
      sessionId: 'session_1'
    },
    {
      id: '2', 
      type: 'event',
      eventType: 'click',
      page: '/admin/tasks',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      sessionId: 'session_2'
    },
    {
      id: '3',
      type: 'event', 
      eventType: 'page_view',
      page: '/admin/leads',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      sessionId: 'session_3'
    },
    {
      id: '4',
      type: 'event',
      eventType: 'form_submit',
      page: '/admin/contacts',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      sessionId: 'session_4'
    },
    {
      id: '5',
      type: 'event',
      eventType: 'page_view',
      page: '/admin/analytics',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      sessionId: 'session_5'
    }
  ]
};

function logDiagnostics(context, operation, startTime, headers = {}) {
  const durationMs = Date.now() - startTime;
  const charge = headers['x-ms-request-charge'] || headers['X-MS-REQUEST-CHARGE'];
  const activityId = headers['x-ms-activity-id'] || headers['X-MS-ACTIVITY-ID'];
  if (durationMs > 500 || charge || activityId) {
    context.log(`diag ${operation}: ${durationMs}ms${charge ? ` RU:${charge}` : ''}${activityId ? ` activity:${activityId}` : ''}`);
  }
}

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'creedava';
const containerId = 'analytics';

let client, database, container;

if (endpoint && key) {
  const connectionPolicy = {};
  if (useCosmosEmulator || endpoint.includes('localhost')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    connectionPolicy.DisableSSLVerification = true;
  }
  client = new CosmosClient({ endpoint, key, connectionPolicy });
  database = client.database(databaseId);
  container = database.container(containerId);
}

app.http('getAnalytics', {
  methods: ['GET', 'OPTIONS'],
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
      try {
        await validateBearer(request)
      } catch (authError) {
        return {
          status: 401,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ success: false, error: 'Unauthorized' })
        }
      }

      if (!endpoint || !key) {
        if (!allowInMemoryFallback) {
          return {
            status: 503,
            headers: corsHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ 
              success: false, 
              error: 'Database not configured and in-memory fallback disabled' 
            })
          };
        }

        // Use in-memory data
        const url = new URL(request.url);
        const days = url.searchParams.get('days');
        let data = inMemoryData.analytics || [];

        // Apply time filter if specified
        if (days) {
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - parseInt(days));
          data = data.filter(item => new Date(item.timestamp) >= daysAgo);
        }

        // Build summary
        const summary = {
          totalEvents: data.length,
          uniquePages: [...new Set(data.map(d => d.page))].length,
          eventTypes: data.reduce((acc, item) => {
            acc[item.eventType] = (acc[item.eventType] || 0) + 1;
            return acc;
          }, {})
        };

        return {
          status: 200,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            success: true,
            data: data,
            summary: summary,
            source: 'memory'
          })
        };
      }

      // Get query parameters
      const url = new URL(request.url);
      const tableName = url.searchParams.get('table') || 'analytics';
      const orderBy = url.searchParams.get('orderBy');
      const orderDirection = url.searchParams.get('orderDirection') || 'desc';
      const limitCount = parseInt(url.searchParams.get('limit') || '1000');
      const days = url.searchParams.get('days');

      // Use specified table
      const targetContainer = database.container(tableName);

      // Build query for general table access
      let query = 'SELECT * FROM c';
      const parameters = [];
      const conditions = [];

      // Add time-based filter if days parameter is provided (for analytics dashboard)
      if (days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
        conditions.push('c.timestamp >= @startDate');
        parameters.push({ name: '@startDate', value: daysAgo.toISOString() });
      }

      // Add filters if provided
      const filterKeys = Array.from(url.searchParams.keys()).filter(k => k.startsWith('filter'));
      if (filterKeys.length > 0) {
        filterKeys.forEach((key, index) => {
          try {
            const filter = JSON.parse(url.searchParams.get(key));
            conditions.push(`c.${filter.column} = @filter${index}`);
            parameters.push({ name: `@filter${index}`, value: filter.value });
          } catch (e) {
            context.error('Invalid filter:', e);
          }
        });
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add ordering (whitelist allowed columns to prevent injection)
      const ALLOWED_ORDER_COLUMNS = ['timestamp', 'createdAt', 'updatedAt', 'eventType', 'page', 'type', 'name', 'status', 'date', 'title'];
      if (orderBy && ALLOWED_ORDER_COLUMNS.includes(orderBy)) {
        const direction = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY c.${orderBy} ${direction}`;
      }

      // Execute query
      const start = Date.now();
      let resources = [];
      try {
        const result = await targetContainer.items.query({ query, parameters }).fetchAll();
        resources = result.resources || [];
        logDiagnostics(context, 'query-analytics', start, result.headers || {});
      } catch (err) {
        context.warn('Analytics query failed:', err && err.message ? err.message : err);
        // If local fallback is allowed, return empty dataset instead of failing hard
        if (process.env.ALLOW_INMEMORY_FALLBACK === 'true') {
          resources = [];
          // continue and return empty result
        } else {
          throw err;
        }
      }

      // Apply limit if needed
      const limitedResources = limitCount ? resources.slice(0, limitCount) : resources;

      // For analytics dashboard requests (when days param is provided), return enhanced response
      if (days) {
        // Calculate summary statistics
        const eventTypes = {};
        const uniquePages = new Set();

        limitedResources.forEach(event => {
          if (event.eventType) {
            eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
          }
          if (event.page) {
            uniquePages.add(event.page);
          }
        });

        return {
          status: 200,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            data: limitedResources,
            summary: {
              totalEvents: limitedResources.length,
              uniquePages: uniquePages.size,
              eventTypes
            }
          })
        };
      }

      // For general queries (backward compatibility), return raw array
      return {
        status: 200,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(limitedResources)
      };
    } catch (error) {
      context.error('Error fetching analytics:', error);
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
