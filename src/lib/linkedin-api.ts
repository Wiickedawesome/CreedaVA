// LinkedIn API Integration for CreedaVA
// This file contains the functions needed to integrate with LinkedIn's API

interface LinkedInApiConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  accessToken?: string
}

interface LinkedInOrganizationPost {
  id: string
  author: string
  lifecycleState: string
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: string
      }
      shareMediaCategory: string
    }
  }
  visibility: {
    'com.linkedin.ugc.MemberNetworkVisibility': string
  }
  created: {
    time: number
  }
}

interface LinkedInPostStats {
  totalShareStatistics: {
    shareCount: number
    likeCount: number
    commentCount: number
    clickCount: number
    impressionCount: number
  }
}

export class LinkedInApiService {
  private config: LinkedInApiConfig

  constructor(config: LinkedInApiConfig) {
    this.config = config
  }

  /**
   * Get OAuth URL for LinkedIn authentication
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'r_organization_social r_basicprofile w_organization_social'
    })
    
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<string> {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`LinkedIn OAuth error: ${data.error_description}`)
    }

    return data.access_token
  }

  /**
   * Get organization posts from LinkedIn
   */
  async getOrganizationPosts(organizationId: string, accessToken: string): Promise<any[]> {
    try {
      // First get the organization's posts
      const postsResponse = await fetch(
        `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:organization:${organizationId})&sortBy=CREATED&count=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      )

      if (!postsResponse.ok) {
        throw new Error(`LinkedIn API error: ${postsResponse.statusText}`)
      }

      const postsData = await postsResponse.json()
      const posts = []

      // Process each post and get its statistics
      for (const post of postsData.elements) {
        const postStats = await this.getPostStatistics(post.id, accessToken)
        
        posts.push({
          id: post.id,
          text: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
          publishedAt: new Date(post.created.time).toISOString(),
          authorName: 'CreedaVA', // You can fetch actual org name if needed
          authorTitle: 'Bilingual Virtual Assistant Services',
          engagement: {
            likes: postStats.totalShareStatistics.likeCount,
            comments: postStats.totalShareStatistics.commentCount,
            shares: postStats.totalShareStatistics.shareCount
          },
          postUrl: `https://www.linkedin.com/feed/update/${post.id}/`,
          impressions: postStats.totalShareStatistics.impressionCount
        })
      }

      return posts
    } catch (error) {
      console.error('Error fetching LinkedIn posts:', error)
      throw error
    }
  }

  /**
   * Get post statistics/analytics
   */
  async getPostStatistics(postId: string, accessToken: string): Promise<LinkedInPostStats> {
    const response = await fetch(
      `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:ugcPost:${postId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    )

    if (!response.ok) {
      // Return default stats if statistics endpoint fails
      return {
        totalShareStatistics: {
          shareCount: 0,
          likeCount: 0,
          commentCount: 0,
          clickCount: 0,
          impressionCount: 0
        }
      }
    }

    return response.json()
  }

  /**
   * Post content to LinkedIn organization page
   */
  async createPost(
    organizationId: string, 
    content: string, 
    accessToken: string,
    mediaUrls?: string[]
  ): Promise<string> {
    const postData: any = {
      author: `urn:li:organization:${organizationId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: mediaUrls?.length ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }

    // Add media if provided
    if (mediaUrls?.length) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = mediaUrls.map(url => ({
        status: 'READY',
        description: {
          text: 'CreedaVA post media'
        },
        media: url,
        title: {
          text: 'CreedaVA'
        }
      }))
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create LinkedIn post: ${error.message}`)
    }

    const result = await response.json()
    return result.id
  }

  /**
   * Get organization info (for validation)
   */
  async getOrganizationInfo(organizationId: string, accessToken: string): Promise<any> {
    const response = await fetch(
      `https://api.linkedin.com/v2/organizations/${organizationId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get organization info: ${response.statusText}`)
    }

    return response.json()
  }
}

// Environment configuration
export const linkedInConfig: LinkedInApiConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'https://creedava.com/api/linkedin/callback'
}

// Example usage in your backend API route
export async function handleLinkedInPosts() {
  const linkedInApi = new LinkedInApiService(linkedInConfig)
  
  try {
    // This would come from your database where you store the access token
    const accessToken = 'YOUR_STORED_ACCESS_TOKEN'
    const organizationId = 'YOUR_ORGANIZATION_ID' // Get this from LinkedIn
    
    const posts = await linkedInApi.getOrganizationPosts(organizationId, accessToken)
    
    // Store posts in your database
    // await supabase.from('social_posts').upsert(posts.map(post => ({
    //   linkedin_post_id: post.id,
    //   platform: 'linkedin',
    //   content: post.text,
    //   published_at: post.publishedAt,
    //   likes: post.engagement.likes,
    //   comments: post.engagement.comments,
    //   shares: post.engagement.shares,
    //   impressions: post.impressions
    // })))
    
    return posts
  } catch (error) {
    console.error('LinkedIn API Error:', error)
    throw error
  }
}

// Types for TypeScript
export type {
  LinkedInApiConfig,
  LinkedInOrganizationPost,
  LinkedInPostStats
}