# LinkedIn API Integration Guide

## Overview
The Social Media management page is already prepared for LinkedIn API integration with dedicated database fields and UI components.

## Current Status
✅ **Database Ready**: `linkedin_post_id` and `linkedin_author_urn` fields in `social_posts` table  
✅ **UI Ready**: LinkedIn prominently featured as primary platform  
⏳ **API Integration**: Requires LinkedIn Developer Application approval

## LinkedIn Lead Sync API
**Documentation**: https://learn.microsoft.com/en-us/linkedin/marketing/lead-sync/leadsync

### What is Lead Sync?
LinkedIn Lead Sync allows you to automatically sync leads from LinkedIn Lead Gen Forms into your CRM (CreedaVA). When someone fills out a form on your LinkedIn ad campaign, their information is automatically sent to your database.

### Key Features:
- **Automatic Lead Capture**: No manual CSV downloads
- **Real-time Sync**: Leads appear in your CRM within minutes
- **Form Integration**: Works with LinkedIn Lead Gen Forms
- **Campaign Attribution**: Track which LinkedIn campaigns generate leads

## Required API Scopes

To integrate LinkedIn posting and lead sync, you'll need:

### For Posting Content:
- `w_member_social` - Post content as a member
- `r_basicprofile` - Read basic profile information

### For Organization Pages:
- `r_organization_social` - Read organization posts and analytics
- `w_organization_social` - Post content on behalf of organization
- `rw_organization_admin` - Manage organization page

### For Lead Sync:
- `r_ads_leadgen_automation` - Access to lead gen form data
- `r_ads_reporting` - Access to campaign performance data

## Implementation Steps

### Phase 1: LinkedIn Developer Setup
1. **Create LinkedIn App**
   - Go to https://www.linkedin.com/developers/apps
   - Click "Create App"
   - Fill in app details (CreedaVA, logo, etc.)
   - Select appropriate LinkedIn Page for organization

2. **Request API Access**
   - Navigate to Products tab
   - Request "Share on LinkedIn" product
   - Request "Advertising API" product (for Lead Sync)
   - Wait for LinkedIn approval (typically 1-3 days)

3. **Configure OAuth**
   - Add redirect URLs: `https://creedava.com/api/linkedin/callback`
   - Note down Client ID and Client Secret

### Phase 2: Backend API Integration

```typescript
// Example: Post to LinkedIn
async function postToLinkedIn(content: string, accessToken: string) {
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify({
      author: 'urn:li:person:YOUR_PERSON_ID',
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    })
  });
  
  const data = await response.json();
  return data.id; // This is the linkedin_post_id to store in database
}
```

### Phase 3: Lead Sync Integration

```typescript
// Example: Fetch leads from LinkedIn Lead Gen Forms
async function syncLinkedInLeads(accessToken: string) {
  const response = await fetch(
    'https://api.linkedin.com/v2/leadFormResponses?' +
    'q=owner&owner=urn:li:sponsoredAccount:YOUR_ACCOUNT_ID',
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
