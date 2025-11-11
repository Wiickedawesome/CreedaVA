# LinkedIn Integration Guide for CreedaVA News Page

## Current Implementation

The News page is set up to display LinkedIn content with the following features:
- LinkedIn embed SDK loaded automatically
- Direct links to your company page
- Sample post cards with categories
- LinkedIn branding and styling

## Options for Full LinkedIn Integration

### Option 1: LinkedIn Embed Plugins (Easiest - No Backend Required)

LinkedIn provides official embed plugins that display your company content:

#### Company Profile Plugin
Add this to your News page where you want the feed:
```html
<script src="https://platform.linkedin.com/in.js" type="text/javascript">lang: en_US</script>
<script type="IN/CompanyProfile" data-id="creedava" data-format="inline"></script>
```

This will display your company profile with recent posts.

**Pros:**
- No backend needed
- Official LinkedIn integration
- Auto-updates when you post

**Cons:**
- Limited styling customization
- LinkedIn branding required
- Slower load times

---

### Option 2: LinkedIn API with OAuth (Most Control)

Use LinkedIn's official Marketing Developer Platform API to fetch posts programmatically.

#### Steps:
1. Create a LinkedIn App at https://www.linkedin.com/developers/apps
2. Get OAuth 2.0 credentials (Client ID & Secret)
3. Request access to Marketing Developer Platform
4. Use the Organization UGC Posts API endpoint

#### API Endpoint:
```
GET https://api.linkedin.com/v2/ugcPosts?q=authors&authors=urn:li:organization:YOUR_ORG_ID
```

#### Implementation:
Create a backend service (Node.js, Python, etc.) that:
1. Authenticates with LinkedIn OAuth
2. Fetches your posts every hour/day
3. Caches them in your database or JSON file
4. Serves them to your frontend

**Pros:**
- Full customization
- Fast loading (cached data)
- Complete control over display

**Cons:**
- Requires backend development
- Need LinkedIn API approval
- More maintenance

---

### Option 3: RSS Feed to JSON (Recommended Balance)

LinkedIn doesn't provide native RSS, but you can use third-party services:

#### Services:
- **RSS.app** (https://rss.app) - Free plan available
- **Zapier** - Can convert LinkedIn posts to RSS
- **IFTTT** - Automate LinkedIn to RSS

#### Steps with RSS.app:
1. Sign up at https://rss.app
2. Create a feed from your LinkedIn company page
3. Get the RSS feed URL
4. Use a service like `rss-to-json` to convert it
5. Fetch the JSON in your React app

#### Example Code:
```typescript
useEffect(() => {
  const fetchLinkedInPosts = async () => {
    try {
      const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=YOUR_RSS_FEED_URL')
      const data = await response.json()
      
      const formattedPosts = data.items.map(item => ({
        id: item.guid,
        title: item.title,
        excerpt: item.description.substring(0, 200),
        date: new Date(item.pubDate).toLocaleDateString(),
        linkedinUrl: item.link,
        category: 'update'
      }))
      
      setPosts(formattedPosts)
    } catch (error) {
      console.error('Error fetching LinkedIn posts:', error)
    }
  }
  
  fetchLinkedInPosts()
}, [])
```

**Pros:**
- No LinkedIn API approval needed
- Easy to implement
- Auto-updates
- No backend required

**Cons:**
- Depends on third-party service
- May have rate limits on free plans
- Less control over data

---

### Option 4: Manual Updates (Current - Simplest)

Keep the current implementation and manually update the posts array when you publish new content.

#### To Add a Post:
Edit `/src/pages/News.tsx` and add to the `samplePosts` array:
```typescript
{
  id: '5',
  title: 'Your New Post Title',
  excerpt: 'Brief description...',
  date: 'November 11, 2025',
  category: 'announcement', // or 'update', 'insight', 'success-story'
  linkedinUrl: 'https://www.linkedin.com/posts/...',
}
```

**Pros:**
- Full control
- No dependencies
- Fast loading
- No API limits

**Cons:**
- Manual work required
- Updates not automatic
- Need to redeploy

---

## Recommended Approach

For **CreedaVA**, I recommend starting with **Option 3 (RSS Feed)** or **Option 4 (Manual)**:

### Start with Manual (Option 4):
- Zero setup time
- Complete control
- Perfect for low-volume posting
- Easy to maintain

### Graduate to RSS (Option 3) when needed:
- When posting frequency increases
- When you want automatic updates
- When you have budget for RSS service

---

## Implementation Instructions

### To Use LinkedIn Embed (Option 1):

Replace the LinkedIn feed section in `/src/pages/News.tsx` with:

```tsx
<div className="linkedin-embed-container">
  <script src="https://platform.linkedin.com/in.js" type="text/javascript">lang: en_US</script>
  <script type="IN/CompanyProfile" data-id="creedava" data-format="inline" data-related="false"></script>
</div>
```

### To Use RSS Feed (Option 3):

1. Sign up at https://rss.app
2. Add your LinkedIn company page URL
3. Get the RSS feed URL
4. Update the `useEffect` in News.tsx with the fetch code above
5. Install rss parser if needed: `npm install rss-parser`

---

## Current Status

✅ LinkedIn SDK loaded
✅ Direct links to company page
✅ Sample posts displaying correctly
✅ Categories and badges working
✅ Mobile responsive design
⏳ Automatic post fetching - Ready to implement any option above

---

## Support

For questions about LinkedIn API access or integration help:
- LinkedIn Developer Portal: https://www.linkedin.com/developers/
- LinkedIn Marketing API: https://docs.microsoft.com/en-us/linkedin/marketing/
- Contact: hello@creedava.com

---

Last Updated: November 11, 2025
