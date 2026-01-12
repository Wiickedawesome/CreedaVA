const { app } = require('@azure/functions');
const { corsHeaders } = require('../shared/cors');

/**
 * Diagnostic endpoint to check authentication configuration
 * GET /api/diagnose
 */
app.http('diagnose', {
  methods: ['GET', 'OPTIONS'],
  route: 'diagnose',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: corsHeaders()
      };
    }

    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleAllowedDomain: !!process.env.GOOGLE_ALLOWED_DOMAIN,
        googleAllowedDomain: process.env.GOOGLE_ALLOWED_DOMAIN || 'creedava.com',
        hasAADClientId: !!process.env.AAD_CLIENT_ID,
        hasAADTenantId: !!process.env.AAD_TENANT_ID,
        hasCosmosEndpoint: !!process.env.COSMOS_ENDPOINT,
        hasCosmosKey: !!process.env.COSMOS_KEY,
        cosmosDatabase: process.env.COSMOS_DATABASE || 'not set',
        allowDevToken: process.env.ALLOW_DEV_TOKEN === 'true',
        appOrigin: process.env.APP_ORIGIN || 'not set',
        corsOrigin: process.env.CORS_ORIGIN || 'not set'
      },
      headers: {
        hasAuthorization: !!request.headers.get('authorization'),
        origin: request.headers.get('origin') || 'not provided'
      }
    };

    // Only show sensitive info in non-production
    if (process.env.ALLOW_DEV_TOKEN === 'true') {
      diagnosticInfo.devModeWarning = '⚠️ DEV_TOKEN is enabled - this should be false in production!';
    }

    return {
      status: 200,
      headers: corsHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        success: true,
        message: 'Diagnostic information',
        data: diagnosticInfo
      }, null, 2)
    };
  }
});
