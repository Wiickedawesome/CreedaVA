const fetch = require('node-fetch');

/**
 * Exchange LinkedIn authorization code for access token
 */
async function getAccessToken(code, clientId, clientSecret, redirectUri) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri
  });

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`LinkedIn OAuth error: ${error.error_description || error.error}`);
  }

  return response.json();
}

/**
 * Refresh LinkedIn access token
 */
async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`LinkedIn token refresh error: ${error.error_description || error.error}`);
  }

  return response.json();
}

/**
 * Fetch organization posts from LinkedIn
 */
async function getOrganizationPosts(organizationId, accessToken, count = 10) {
  const response = await fetch(
    `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:organization:${organizationId})&sortBy=CREATED&count=${count}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.statusText}`);
  }

  const data = await response.json();
  const posts = [];

  for (const post of data.elements || []) {
    const stats = await getPostStatistics(post.id, accessToken);
    
    posts.push({
      id: post.id,
      text: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
      publishedAt: new Date(post.created.time).toISOString(),
      authorName: 'CreedaVA',
      authorTitle: 'Bilingual Virtual Assistant Services',
      engagement: {
        likes: stats.totalShareStatistics.likeCount || 0,
        comments: stats.totalShareStatistics.commentCount || 0,
        shares: stats.totalShareStatistics.shareCount || 0
      },
      postUrl: `https://www.linkedin.com/feed/update/${post.id}/`,
      impressions: stats.totalShareStatistics.impressionCount || 0
    });
  }

  return posts;
}

/**
 * Get post statistics
 */
async function getPostStatistics(postId, accessToken) {
  const response = await fetch(
    `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:ugcPost:${postId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    }
  );

  if (!response.ok) {
    return {
      totalShareStatistics: {
        shareCount: 0,
        likeCount: 0,
        commentCount: 0,
        clickCount: 0,
        impressionCount: 0
      }
    };
  }

  return response.json();
}

module.exports = {
  getAccessToken,
  refreshAccessToken,
  getOrganizationPosts
};
