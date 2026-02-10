const { app } = require('@azure/functions');
const { validateBearer } = require('../shared/auth');
const { corsHeaders } = require('../shared/cors');

/**
 * Diagnostic endpoint to check authentication configuration
 * GET /api/diagnose — requires admin bearer token
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

    // Require authentication — this endpoint exposes internal config
    try {
      await validateBearer(request);
    } catch (authError) {
      return {
        status: 401,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ success: false, error: 'Unauthorized' })
      };
    }

    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleAllowedDomain: !!process.env.GOOGLE_ALLOWED_DOMAIN,
        hasAADClientId: !!process.env.AAD_CLIENT_ID,
        hasAADTenantId: !!process.env.AAD_TENANT_ID,
        hasCosmosEndpoint: !!process.env.COSMOS_ENDPOINT,
        hasCosmosKey: !!process.env.COSMOS_KEY,
        cosmosDatabase: process.env.COSMOS_DATABASE || 'not set',
        allowDevToken: process.env.ALLOW_DEV_TOKEN === 'true',
      },
      headers: {
        hasAuthorization: !!request.headers.get('authorization'),
        origin: request.headers.get('origin') || 'not provided'
      }
    };

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
