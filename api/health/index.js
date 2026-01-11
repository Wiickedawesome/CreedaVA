const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const { corsHeadersForOrigin } = require('../shared/cors');

// Polyfill crypto for Cosmos SDK
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

function mask(value) {
  if (!value) return null;
  const s = String(value);
  if (s.length <= 8) return '***';
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function safeHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

app.http('health', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: corsHeadersForOrigin(request.headers.origin)
      };
    }

    const tenantId = process.env.AAD_TENANT_ID || process.env.AUTH_TENANT_ID;
    const clientId = process.env.AAD_CLIENT_ID || process.env.AUTH_CLIENT_ID;
    const authority = process.env.AAD_AUTHORITY || (tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : null);

    const endpoint = process.env.COSMOS_ENDPOINT || process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_KEY || process.env.COSMOS_DB_KEY;
    const dbName = process.env.COSMOS_DATABASE || 'creedava';

    const googleClientId = process.env.GOOGLE_CLIENT_ID || null;
    const googleAllowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN || null;

    const result = {
      ok: true,
      time: new Date().toISOString(),
      auth: {
        aadTenantIdPresent: Boolean(tenantId),
        aadClientIdPresent: Boolean(clientId),
        aadAuthority: authority,
        aadAllowedDomain: process.env.AAD_ALLOWED_DOMAIN || null,
        googleClientIdPresent: Boolean(googleClientId),
        googleAllowedDomain,
        // Masked echoes to help spot “wrong value wired” without leaking secrets.
        tenantId: mask(tenantId),
        clientId: mask(clientId),
        googleClientId: mask(googleClientId)
      },
      cosmos: {
        configured: Boolean(endpoint && key),
        endpointHost: safeHost(endpoint),
        database: dbName,
        ok: false,
        error: null
      }
    };

    if (endpoint && key) {
      try {
        const connectionPolicy = {};
        if (endpoint.includes('localhost')) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
          connectionPolicy.DisableSSLVerification = true;
          connectionPolicy.enableEndpointDiscovery = false;
        }

        const client = new CosmosClient({ endpoint, key, connectionPolicy });
        const database = client.database(dbName);
        await database.read();
        result.cosmos.ok = true;
      } catch (e) {
        result.cosmos.ok = false;
        result.cosmos.error = e?.message || String(e);
        context.warn('Health check Cosmos read failed:', result.cosmos.error);
      }
    }

    return {
      status: 200,
      headers: {
        ...corsHeadersForOrigin(request.headers.origin),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    };
  }
});
