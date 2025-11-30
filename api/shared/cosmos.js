const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE || 'website-data';
const containerId = process.env.COSMOS_CONTAINER || 'linkedin-data';

if (!endpoint || !key) {
  throw new Error('COSMOS_ENDPOINT and COSMOS_KEY must be set in environment variables');
}

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const container = database.container(containerId);

/**
 * Store LinkedIn OAuth tokens securely in Cosmos DB
 */
async function storeTokens(organizationId, tokens) {
  const item = {
    id: organizationId,
    type: 'linkedin-config',
    organizationId,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    clientId: tokens.clientId,
    updatedAt: new Date().toISOString()
  };

  const { resource } = await container.items.upsert(item);
  return resource;
}

/**
 * Retrieve stored LinkedIn tokens
 */
async function getTokens(organizationId) {
  try {
    const { resource } = await container.item(organizationId, organizationId).read();
    return resource;
  } catch (error) {
    if (error.code === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Cache LinkedIn posts in Cosmos DB
 */
async function cachePosts(organizationId, posts) {
  const item = {
    id: `posts-${organizationId}`,
    type: 'linkedin-posts',
    organizationId,
    posts,
    cachedAt: new Date().toISOString(),
    ttl: 3600 // Cache for 1 hour
  };

  const { resource } = await container.items.upsert(item);
  return resource;
}

/**
 * Get cached LinkedIn posts
 */
async function getCachedPosts(organizationId) {
  try {
    const { resource } = await container.item(`posts-${organizationId}`, `posts-${organizationId}`).read();
    
    // Check if cache is still valid (less than 1 hour old)
    const cacheAge = Date.now() - new Date(resource.cachedAt).getTime();
    const oneHour = 60 * 60 * 1000;
    
    if (cacheAge < oneHour) {
      return resource.posts;
    }
    
    return null;
  } catch (error) {
    if (error.code === 404) {
      return null;
    }
    throw error;
  }
}

module.exports = {
  storeTokens,
  getTokens,
  cachePosts,
  getCachedPosts
};
