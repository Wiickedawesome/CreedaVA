const { app } = require('@azure/functions');

app.http('linkedin-connect', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('Generating LinkedIn OAuth URL');

    try {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'https://creedava.com/api/linkedin-auth';
      const state = request.query.get('state') || 'default';

      if (!clientId) {
        return {
          status: 500,
          jsonBody: { error: 'LinkedIn client ID not configured' }
        };
      }

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'r_organization_social r_basicprofile w_organization_social',
        state: state
      });

      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

      return {
        status: 200,
        jsonBody: { authUrl }
      };
    } catch (error) {
      context.log.error('Error generating auth URL:', error);
      return {
        status: 500,
        jsonBody: { 
          error: 'Failed to generate authentication URL',
          message: error.message 
        }
      };
    }
  }
});
