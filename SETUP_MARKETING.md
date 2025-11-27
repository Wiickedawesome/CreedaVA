# Quick Start: Marketing Expansion Setup

## ⚠️ CRITICAL: Execute Database Schema First

Before the new marketing pages will work, you **MUST** run the SQL schema to create the database tables.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your CreedaVA project
3. Navigate to **SQL Editor** in the left sidebar

### 2. Create New Query
1. Click **New Query** button (top right)
2. Name it: "Marketing Automation Schema"

### 3. Execute Schema
1. Open the file: `supabase-marketing-schema.sql` (in project root)
2. Copy ALL 307 lines
3. Paste into the SQL Editor
4. Click **Run** button

You should see success messages for:
- ✅ 7 tables created (landing_pages, social_posts, blog_posts, ad_campaigns, customer_journeys, marketing_reports, + junction table)
- ✅ 13 indexes created
- ✅ 6 triggers created
- ✅ RLS policies enabled

### 4. Regenerate TypeScript Types (Optional but recommended)

If you have Supabase CLI installed:
```bash
npx supabase gen types typescript --project-id epgbfcvmkncgcmjfqleu > src/lib/database.types.ts
```

If you don't have CLI, the app will still work - TypeScript just won't have autocomplete for the new tables.

### 5. Test the New Features

Login to admin panel and navigate to new pages:
- **Social Media**: http://creedava.com/admin/social
- **Blog**: http://creedava.com/admin/blog
- **Ad Campaigns**: http://creedava.com/admin/ad-campaigns
- **Landing Pages**: http://creedava.com/admin/landing-pages
- **Customer Journey**: http://creedava.com/admin/customer-journey
- **Reports**: http://creedava.com/admin/reports

## Features Available Immediately

### Social Media Management
- Schedule posts for LinkedIn (primary platform)
- Support for Twitter, Facebook, Instagram
- Track engagement: likes, comments, shares
- Manage hashtags
- Monitor post performance

### Blog & News
- Replace static News page with dynamic blog
- Create featured articles
- SEO optimization (meta titles/descriptions)
- Auto-generate URL slugs
- Track article views

### Ad Campaign Tracker
- Track Google Ads, Facebook, LinkedIn, Instagram, Twitter campaigns
- Budget vs spend monitoring
- Real-time ROI calculation
- Performance metrics (impressions, clicks, conversions)

### Landing Pages
- Create multiple landing pages
- A/B testing (Variant A vs B)
- Conversion rate tracking
- Visit counting
- Form submission monitoring

### Customer Journey
- Map 5-stage funnel (awareness → consideration → decision → retention → advocacy)
- UTM tracking (source, medium, campaign)
- Touchpoint counting
- Conversion value tracking

### Marketing Reports
- Custom report builder
- Schedule daily/weekly/monthly reports
- Track campaign, attribution, content, social performance

## Troubleshooting

### Error: "relation social_posts does not exist"
- You haven't run the SQL schema yet
- Go back to Step 3 and execute the schema

### Error: "permission denied for table social_posts"
- RLS policies may not have been created
- Re-run the entire schema file
- Check Supabase dashboard → Authentication → Policies

### Pages are blank or spinning
- Check browser console (F12) for errors
- Verify you're logged in with valid credentials
- Confirm schema was executed successfully

## Next Steps

After verifying everything works:

1. **Customize for your business**
   - Add your social media accounts
   - Create your first blog posts
   - Set up ad campaign tracking
   - Configure landing pages

2. **LinkedIn Integration (Future)**
   - The schema includes `linkedin_post_id` and `linkedin_author_urn` fields
   - These are prepared for LinkedIn API integration
   - Can automate posting and pull engagement data

3. **Analytics Integration**
   - Connect Google Analytics data to ad campaigns
   - Link UTM parameters from Customer Journey to Analytics
   - Generate comprehensive marketing reports

4. **Export Functionality**
   - Reports page has Download button ready
   - Can implement PDF/Excel exports
   - Schedule automated email delivery

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify SQL schema executed successfully
3. Confirm you're using the latest code from GitHub
4. Check Supabase project logs in dashboard

All features were designed to integrate seamlessly with your existing CRM data!
