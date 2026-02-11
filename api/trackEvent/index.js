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

      // Track all pages including admin (like Google Analytics)

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
      // Note: x-azure-fdid is Azure Front Door ID, NOT country — do not use it for geo
      let country = request.headers.get('cloudflare-ipcountry') ||
                    request.headers.get('cf-ipcountry') ||
                    request.headers.get('x-vercel-ip-country') ||
                    request.headers.get('x-ms-client-country') ||  // Azure
                    request.headers.get('x-country-code') || null;
      
      let countryName = null;
      
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
          
          // Try ip-api.com first (free, no API key needed, 45 req/min)
          let geoResolved = false;
          try {
            const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,timezone,lat,lon`, {
              headers: { 'User-Agent': 'CreedaVA/1.0' },
              signal: AbortSignal.timeout(3000)
            });
            
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              context.log('ip-api.com data:', JSON.stringify(geoData));
              
              if (geoData.status === 'success') {
                country = geoData.countryCode || country;
                countryName = geoData.country || null;
                region = geoData.regionName || region;
                city = geoData.city || city;
                timezone = geoData.timezone || timezone;
                latitude = geoData.lat?.toString() || latitude;
                longitude = geoData.lon?.toString() || longitude;
                geoResolved = true;
                context.log(`Location resolved (ip-api): ${city}, ${region}, ${country}`);
              }
            }
          } catch (primaryError) {
            context.log('ip-api.com failed:', primaryError.message);
          }

          // Fallback: try ipwho.is (free, no key, higher rate limit)
          if (!geoResolved) {
            try {
              const fallbackResponse = await fetch(`https://ipwho.is/${clientIp}`, {
                headers: { 'User-Agent': 'CreedaVA/1.0' },
                signal: AbortSignal.timeout(3000)
              });
              if (fallbackResponse.ok) {
                const fbData = await fallbackResponse.json();
                context.log('ipwho.is data:', JSON.stringify(fbData));
                if (fbData.success !== false) {
                  country = fbData.country_code || country;
                  countryName = fbData.country || null;
                  region = fbData.region || region;
                  city = fbData.city || city;
                  timezone = fbData.timezone?.id || timezone;
                  latitude = fbData.latitude?.toString() || latitude;
                  longitude = fbData.longitude?.toString() || longitude;
                  geoResolved = true;
                  context.log(`Location resolved (ipwho.is): ${city}, ${region}, ${country}`);
                }
              }
            } catch (fallbackError) {
              context.log('ipwho.is fallback failed:', fallbackError.message);
            }
          }
        } catch (geoError) {
          context.log('Geolocation lookup failed:', geoError.message);
        }
      } else if (!isValidPublicIp) {
        context.log(`Skipping geolocation for IP: ${clientIp} (private/invalid)`);
      }

      // Last resort: try to infer country from client-supplied timezone
      if (!country || country === 'Unknown') {
        const clientTimezone = body.timezone || timezone;
        if (clientTimezone) {
          const tzCountryMap = {
            'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
            'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
            'Pacific/Honolulu': 'US', 'America/Belize': 'BZ', 'America/Toronto': 'CA',
            'America/Vancouver': 'CA', 'Europe/London': 'GB', 'Europe/Berlin': 'DE',
            'Europe/Paris': 'FR', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
            'Europe/Amsterdam': 'NL', 'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN',
            'Asia/Seoul': 'KR', 'Asia/Kolkata': 'IN', 'Asia/Singapore': 'SG',
            'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
            'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR',
            'America/Argentina/Buenos_Aires': 'AR',
          };
          const inferredCountry = tzCountryMap[clientTimezone];
          if (inferredCountry) {
            country = inferredCountry;
            context.log(`Country inferred from timezone ${clientTimezone}: ${country}`);
          }
        }
      }

      const item = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'event',
        clientIp: clientIp || null,
        country: country || 'Unknown',
        countryName: countryName || null,
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
