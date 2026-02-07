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

      // Extract geo data from headers (provided by Azure/CDN/hosting platform)
      // Try multiple header sources for IP address
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       request.headers.get('x-real-ip') ||
                       request.headers.get('x-client-ip') ||
                       request.headers.get('cf-connecting-ip') || // Cloudflare
                       request.headers.get('true-client-ip') ||    // Cloudflare Enterprise
                       request.headers.get('x-azure-clientip') ||  // Azure
                       request.headers.get('x-original-forwarded-for') ||
                       'unknown';
      
      context.log(`Client IP detected: ${clientIp}`);
      
      // Try multiple header sources for country/region detection
      let country = request.headers.get('cloudflare-ipcountry') ||
                    request.headers.get('x-vercel-ip-country') ||
                    request.headers.get('x-azure-fdid') ||        // Azure Front Door
                    request.headers.get('x-ms-client-country') ||  // Azure
                    request.headers.get('x-country-code') || null;
      
      let region = request.headers.get('x-vercel-ip-city') ||
                   request.headers.get('x-azure-clientcity') ||
                   request.headers.get('cf-ipcity') ||
                   request.headers.get('x-region') || null;
      
      let city = request.headers.get('x-vercel-ip-city') ||
                 request.headers.get('x-azure-clientcity') ||
                 request.headers.get('cf-ipcity') || null;
      
      let timezone = request.headers.get('x-vercel-ip-timezone') ||
                     request.headers.get('cf-timezone') || null;
      
      let latitude = request.headers.get('x-vercel-ip-latitude') ||
                     request.headers.get('x-azure-clientlatitude') || null;
      
      let longitude = request.headers.get('x-vercel-ip-longitude') ||
                      request.headers.get('x-azure-clientlongitude') || null;
      
      // If still no country and we have a valid IP, use geolocation API
      const isValidPublicIp = clientIp && 
                              clientIp !== 'unknown' && 
                              !clientIp.startsWith('127.') && 
                              !clientIp.startsWith('192.168.') &&
                              !clientIp.startsWith('10.') &&
                              !clientIp.startsWith('172.16.') &&
                              clientIp !== '::1';
      
      if (!country && isValidPublicIp) {
        try {
          context.log(`Attempting geolocation lookup for IP: ${clientIp}`);
          
          // Use ip-api.com (free, no API key needed, 45 req/min)
          const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,timezone,lat,lon`, {
            headers: { 'User-Agent': 'CreedaVA/1.0' },
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            context.log('Geolocation data received:', JSON.stringify(geoData));
            
            if (geoData.status === 'success') {
              country = geoData.countryCode || country;
              region = geoData.regionName || region;
              city = geoData.city || city;
              timezone = geoData.timezone || timezone;
              latitude = geoData.lat?.toString() || latitude;
              longitude = geoData.lon?.toString() || longitude;
              
              context.log(`Location resolved: ${city}, ${region}, ${country}`);
            } else {
              context.log('Geolocation API returned error:', geoData.message);
            }
          } else {
            context.log(`Geolocation API request failed with status: ${geoResponse.status}`);
          }
        } catch (geoError) {
          context.log('Geolocation lookup failed:', geoError.message);
        }
      } else if (!isValidPublicIp) {
        context.log(`Skipping geolocation for IP: ${clientIp} (private/invalid)`);
      }

      const item = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'event',
        clientIp: clientIp || null,
        country: country || 'Unknown',
        region: region || null,
        city: city || null,
        timezone: timezone || null,
        latitude: latitude || null,
        longitude: longitude || null,
        eventType,
        eventData: eventData || {},
        page,
        userAgent: userAgent || null,
        referrer: referrer || null,
        timestamp: new Date().toISOString(),
        ttl: 7776000, // 90 days
        // Include the rest of the body for additional context
        ...body
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
