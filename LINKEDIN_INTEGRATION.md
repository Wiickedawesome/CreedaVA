# LinkedIn API Integration - Azure Functions Implementation

## Overview
CreedaVA uses Azure Functions as a secure backend to handle LinkedIn OAuth and API interactions. This architecture keeps credentials server-side and provides persistent token storage via Azure Cosmos DB.

## Architecture

```
User → Frontend (React) → Azure Functions API → LinkedIn API
                              ↓
                        Azure Cosmos DB
                        (Token Storage)
```

## Current Status
✅ **Azure Functions API**: Deployed at `/api/*` endpoints  
✅ **Cosmos DB Storage**: Tokens and posts cached with 1-hour TTL  
✅ **OAuth Flow**: Complete authentication with token refresh  
✅ **Admin UI**: LinkedIn integration page at `/admin/linkedin-integration`

## API Endpoints

### 1. `/api/linkedin-connect`
**Purpose**: Generate LinkedIn OAuth authorization URL  
**Method**: GET  
**Response**: `{ authUrl: "https://www.linkedin.com/oauth/v2/authorization?..." }`

**Frontend Usage**:
```typescript
const response = await fetch('/api/linkedin-connect');
const { authUrl } = await response.json();
window.location.href = authUrl; // Redirect to LinkedIn
```

### 2. `/api/linkedin-auth`
**Purpose**: OAuth callback handler (LinkedIn redirects here)  
**Method**: GET  
**Query Params**: `code`, `state`  
**Flow**:
1. Exchange authorization code for access token
2. Calculate token expiration time
3. Store tokens in Cosmos DB
4. Redirect to `/admin/linkedin-integration?success=true`

**Security**: This endpoint handles sensitive token exchange and should never be called directly from client code.

### 3. `/api/linkedin-posts`
**Purpose**: Fetch organization posts with caching  
**Method**: GET  
**Query Params**: `refresh=true` (optional - force cache refresh)  
**Response**:
```json
{
  "posts": [
    {
      "id": "urn:li:share:123",
      "text": "Post content...",
      "created": 1234567890,
      "stats": {
        "likes": 42,
        "comments": 5,
        "shares": 3,
        "impressions": 1250
      }
    }
  ],
  "cached": true,
  "cacheAge": 1800
}
```

**Frontend Usage**:
```typescript
// Normal fetch (uses cache if available)
const response = await fetch('/api/linkedin-posts');

// Force refresh
const response = await fetch('/api/linkedin-posts?refresh=true');
```

## Database Schema (Cosmos DB)

### Container: `linkedin-data`
**Partition Key**: `/id`  
**TTL**: Enabled (1 hour for cached posts)

**Token Document**:
```json
{
  "id": "linkedin-token",
  "accessToken": "AQV...",
  "refreshToken": "AQW...",
  "expiresAt": 1234567890,
  "organizationId": "12345678",
  "type": "token"
}
```

**Cached Posts Document**:
```json
{
  "id": "posts-cache",
  "posts": [...],
  "cachedAt": 1234567890,
  "ttl": 3600,
  "type": "cache"
}
```

## Required LinkedIn API Scopes

Configure these in your LinkedIn Developer App:
- `r_organization_social` - Read organization posts and analytics
- `w_organization_social` - Post content on behalf of organization  
- `rw_organization_admin` - Manage organization page

## Environment Variables

### Azure Static Web App Settings
Configure via Azure Portal or CLI:
```bash
COSMOS_ENDPOINT=https://creedava-db.documents.azure.com:443/
COSMOS_KEY=<your-cosmos-primary-key>
LINKEDIN_CLIENT_ID=<your-linkedin-client-id>
LINKEDIN_CLIENT_SECRET=<your-linkedin-client-secret>
LINKEDIN_REDIRECT_URI=https://www.creedava.com/api/linkedin-auth
```

### Local Development (`api/local.settings.json`)
```json
{
  "Values": {
    "COSMOS_ENDPOINT": "https://creedava-db.documents.azure.com:443/",
    "COSMOS_KEY": "...",
    "COSMOS_DATABASE": "website-data",
    "COSMOS_CONTAINER": "linkedin-data",
    "LINKEDIN_CLIENT_ID": "...",
    "LINKEDIN_CLIENT_SECRET": "...",
    "LINKEDIN_REDIRECT_URI": "http://localhost:4280/api/linkedin-auth"
  }
}
```

## Token Refresh Flow

The API automatically refreshes expired tokens:
1. Check if `expiresAt < Date.now()`
2. If expired, call `refreshAccessToken(refreshToken)`
3. Update Cosmos DB with new token and expiration
4. Proceed with API request

## Security Best Practices

✅ **Never expose credentials in frontend**: All LinkedIn API calls go through Azure Functions  
✅ **Token storage**: Tokens stored server-side in Cosmos DB, not localStorage  
✅ **HTTPS only**: OAuth redirects require HTTPS in production  
✅ **State parameter**: OAuth flow includes state validation  
✅ **Token expiration**: Automatic refresh prevents stale credentials

## Testing Locally

1. **Install Azure Functions Core Tools**:
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. **Configure local settings**: Update `api/local.settings.json`

3. **Run Functions locally**:
   ```bash
   cd api
   func start
   ```

4. **Run frontend** (separate terminal):
   ```bash
   npm run dev
   ```

5. **Test OAuth**: Navigate to `http://localhost:5173/admin/linkedin-integration`

## Deployment

Deployment happens automatically via GitHub Actions when pushing to `main`:
1. Workflow builds React app with environment variables
2. Deploys `/api` folder to Azure Functions
3. Frontend deployed to Azure Static Web Apps
4. API accessible at `https://www.creedava.com/api/*`

## Troubleshooting

### "Access token expired"
- Check if token refresh is working in `/api/linkedin-posts`
- Verify `expiresAt` timestamp in Cosmos DB
- Re-authenticate via `/admin/linkedin-integration`

### "Organization not found"
- Ensure LinkedIn app has organization page selected
- Verify `rw_organization_admin` scope is approved
- Check organization ID in stored token

### "CORS errors"
- Azure Functions handle CORS automatically for Static Web Apps
- Verify `VITE_API_URL=/api` is set correctly

### "Cached data too old"
- Use `?refresh=true` to force cache invalidation
- Check TTL settings in Cosmos DB container

## Future Enhancements

- [ ] Posting content to LinkedIn from admin panel
- [ ] Lead Gen Form sync integration
- [ ] Multi-organization support
- [ ] Analytics dashboard with engagement metrics
- [ ] Scheduled post publishing
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    }
  );
  
  const data = await response.json();
  
  // Map LinkedIn lead to CreedaVA leads table
  for (const lead of data.elements) {
    await supabase.from('leads').insert({
      company_name: lead.formResponse.answers.find(a => a.questionId === 'company')?.value,
      email: lead.formResponse.answers.find(a => a.questionId === 'emailAddress')?.value,
      source: 'linkedin_lead_gen',
      utm_source: 'linkedin',
      utm_medium: 'paid_social',
      utm_campaign: lead.campaignId
    });
  }
}
```

### Phase 4: Analytics Integration

```typescript
// Fetch engagement metrics for posted content
async function updateLinkedInMetrics(postId: string, accessToken: string) {
  const response = await fetch(
    `https://api.linkedin.com/v2/socialActions/${postId}/statistics`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    }
  );
  
  const stats = await response.json();
  
  // Update social_posts table with real metrics
  await supabase.from('social_posts')
    .update({
      likes: stats.likeCount,
      comments: stats.commentCount,
      shares: stats.shareCount,
      impressions: stats.impressionCount
    })
    .eq('linkedin_post_id', postId);
}
```

## Database Fields Already Prepared

### social_posts table:
- ✅ `linkedin_post_id` - Stores LinkedIn's unique post identifier
- ✅ `linkedin_author_urn` - Stores author URN for organization posts
- ✅ `likes`, `comments`, `shares`, `impressions` - Engagement metrics
- ✅ `platform` enum includes 'linkedin'
- ✅ `scheduled_for` - For scheduled posting via LinkedIn API

### leads table (existing):
- ✅ `source` - Can be set to 'linkedin_lead_gen'
- ✅ `utm_source`, `utm_medium`, `utm_campaign` - Attribution tracking

## Cost Considerations

### LinkedIn API Pricing:
- **Developer Application**: FREE
- **API Access**: FREE (with approved app)
- **Rate Limits**: 
  - 100 requests per user per day (member posts)
  - 1,000 requests per day for organizations
  - Lead Gen: 10,000 requests per day

### LinkedIn Advertising Costs:
- **Lead Gen Forms**: Varies by industry, typically $30-100 per lead
- **Sponsored Content**: CPC $5-15 in B2B space
- **InMail Campaigns**: $0.70-$1.50 per send

## Alternative: No-Code Integration

If you don't want to build custom API integration, consider:

### Zapier Integration ($20-50/month):
1. LinkedIn Lead Gen → Zapier → Supabase
2. Auto-sync leads every 15 minutes
3. Map form fields to CreedaVA database
4. No coding required

### Make.com Integration ($9-30/month):
- Similar to Zapier but cheaper
- More complex workflows
- Better for high-volume lead sync

## Recommendation

For CreedaVA's current stage:

### Option 1: Start Simple (Recommended)
1. **Manual LinkedIn Posting**: Use CreedaVA to draft posts, copy/paste to LinkedIn
2. **Zapier for Leads**: Auto-sync LinkedIn leads via Zapier ($20/mo)
3. **Manual Metrics**: Update engagement metrics weekly
4. **Total Cost**: $20/month + LinkedIn ad spend

### Option 2: Full Automation (Future)
1. Build custom LinkedIn OAuth integration
2. Auto-post from CreedaVA Social page
3. Real-time lead sync via webhook
4. Automatic metrics updates (hourly)
5. **Development Time**: 40-60 hours
6. **Total Cost**: Development time + LinkedIn ad spend

## Next Steps

**Immediate** (No API needed):
1. ✅ Use Social page to draft LinkedIn posts
2. ✅ Track manual engagement metrics
3. ✅ Monitor which posts perform best

**Short-term** (1-2 weeks):
1. Set up Zapier LinkedIn → Supabase integration for leads
2. Create LinkedIn Lead Gen Form campaigns
3. Test lead sync flow

**Long-term** (3-6 months):
1. Apply for LinkedIn Developer access
2. Build OAuth flow for auto-posting
3. Implement real-time analytics sync
4. Add scheduled posting automation

## Resources

- **LinkedIn Marketing API**: https://learn.microsoft.com/en-us/linkedin/marketing/
- **Share on LinkedIn**: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
- **Lead Sync API**: https://learn.microsoft.com/en-us/linkedin/marketing/lead-sync/leadsync
- **OAuth 2.0**: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
- **API Playground**: https://www.linkedin.com/developers/tools

## Support

Your Social Media page is already built and ready to use! You can:
- Draft and schedule LinkedIn posts
- Track engagement metrics manually
- Plan content calendar
- Monitor which content performs best

The LinkedIn API integration is **optional** - the current system works great for manual posting and tracking.
