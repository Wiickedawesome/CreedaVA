const { app } = require('@azure/functions');
const { getTokens, getCachedPosts, cachePosts } = require('../shared/cosmos');
const { getOrganizationPosts, refreshAccessToken } = require('../shared/linkedin');

app.http('linkedin-posts', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    context.log('Fetching LinkedIn posts');

    try {
      const organizationId = request.query.get('org') || 'default';
      const forceRefresh = request.query.get('refresh') === 'true';

      // Check cache first
      if (!forceRefresh) {
        const cachedData = await getCachedPosts(organizationId);
        if (cachedData) {
          context.log('Returning cached posts');
          return {
            status: 200,
            jsonBody: {
              posts: cachedData,
              cached: true
            }
          };
        }
      }

      // Get stored tokens
      const tokenData = await getTokens(organizationId);
      
      if (!tokenData) {
        return {
          status: 401,
          jsonBody: { 
            error: 'LinkedIn not connected',
            message: 'Please connect your LinkedIn account in the admin panel'
          }
        };
      }

      // Check if token is expired and refresh if needed
      let accessToken = tokenData.accessToken;
      const now = new Date();
      const expiresAt = new Date(tokenData.expiresAt);

      if (now >= expiresAt && tokenData.refreshToken) {
        context.log('Refreshing expired access token');
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        
        const newTokenData = await refreshAccessToken(
          tokenData.refreshToken,
          clientId,
          clientSecret
        );

        accessToken = newTokenData.access_token;
        
        // Update stored tokens
        await storeTokens(organizationId, {
          accessToken: newTokenData.access_token,
          refreshToken: newTokenData.refresh_token || tokenData.refreshToken,
          expiresAt: new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString(),
          clientId: tokenData.clientId
        });
      }

      // Fetch posts from LinkedIn
      const posts = await getOrganizationPosts(organizationId, accessToken);

      // Cache the posts
      await cachePosts(organizationId, posts);

      return {
        status: 200,
        jsonBody: {
          posts,
          cached: false
        }
      };
    } catch (error) {
      context.log.error('Error fetching LinkedIn posts:', error);
      return {
        status: 500,
        jsonBody: { 
          error: 'Failed to fetch LinkedIn posts',
          message: error.message 
        }
      };
    }
  }
});
