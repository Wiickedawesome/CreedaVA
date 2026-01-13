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

      // Filter out admin pages - don't track internal pages
      if (page && page.startsWith('/admin')) {
        return {
          status: 200,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ success: true, message: 'Admin page not tracked' })
        };
      }

      // Extract geo data from headers (provided by Azure/CDN)
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       request.headers.get('x-real-ip') ||
                       request.headers.get('x-client-ip') || 'unknown';
      
      // Try multiple header sources for country detection
      let country = request.headers.get('cloudflare-ipcountry') ||
                    request.headers.get('x-vercel-ip-country') ||
                    request.headers.get('x-country-code') || null;
      
      // If still no country and we have an IP, use a simple geolocation lookup
      if (!country && clientIp && clientIp !== 'unknown' && !clientIp.startsWith('127.') && !clientIp.startsWith('192.168.')) {
        try {
          // Use free ipapi.co service for geolocation
          const geoResponse = await fetch(`https://ipapi.co/${clientIp}/country_code/`, {
            headers: { 'User-Agent': 'CreedaVA/1.0' },
            signal: AbortSignal.timeout(2000) // 2 second timeout
          });
          if (geoResponse.ok) {
            country = await geoResponse.text();
          }
        } catch (geoError) {
          context.log('Geolocation lookup failed:', geoError.message);
        }
      }
      
      const region = request.headers.get('x-vercel-ip-city') ||
                     request.headers.get('x-region') || null;

      const item = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'event',
        clientIp: clientIp || null,
        country: country || 'Unknown',
        region: region || null,
        eventType,
        eventData: eventData || {},
        page,
        userAgent: userAgent || null,
        referrer: referrer || null,
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
