const { app } = require('@azure/functions');
const { getAccessToken } = require('../shared/linkedin');
const { storeTokens } = require('../shared/cosmos');

app.http('linkedin-auth', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('LinkedIn OAuth callback received');

    try {
      const code = request.query.get('code');
      const state = request.query.get('state');

      if (!code) {
        return {
          status: 400,
          jsonBody: { error: 'Authorization code is required' }
        };
      }

      // Get LinkedIn credentials from environment
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'https://creedava.com/api/linkedin-auth';

      if (!clientId || !clientSecret) {
        return {
          status: 500,
          jsonBody: { error: 'LinkedIn credentials not configured' }
        };
      }

      // Exchange code for access token
      const tokenData = await getAccessToken(code, clientId, clientSecret, redirectUri);

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

      // Store tokens in Cosmos DB (organizationId should come from state or user session)
      const organizationId = state || 'default';
      
      await storeTokens(organizationId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        clientId
      });

      // Redirect back to admin page with success
      return {
        status: 302,
        headers: {
          'Location': '/admin/linkedin-integration?success=true'
        }
      };
    } catch (error) {
      context.log.error('LinkedIn auth error:', error);
      return {
        status: 500,
        jsonBody: { 
          error: 'Failed to authenticate with LinkedIn',
          message: error.message 
        }
      };
    }
  }
});
