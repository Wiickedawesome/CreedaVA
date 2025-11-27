# CRM & SEO Platform Setup Guide

This guide will help you set up the complete CRM and SEO management platform for CreedaVA.

## 🎯 Overview

Your new CRM system includes:
- **Authentication**: Secure email/password login
- **Lead Management**: Track and convert leads
- **Contact Management**: Organize customer information
- **Task & Project Management**: Manage work and deadlines
- **Email Management**: Track communications
- **SEO Content Editor**: Edit meta tags and page content
- **Keyword Tracking**: Monitor search rankings
- **Analytics Dashboard**: View performance metrics
- **Google Search Console Integration**: Real search data

## 📋 Prerequisites

1. **Supabase Account** (free tier available)
2. **Google Cloud Account** (for Search Console API)
3. **Your domain** (creedava.com) - already configured

## 🚀 Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or email
4. Click "New Project"
5. Fill in:
   - **Name**: CreedaVA CRM
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
6. Click "Create new project" (takes ~2 minutes)

### Step 2: Set Up Database

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click "Run" (▶ button)
6. Wait for "Success. No rows returned" message

This creates all tables: leads, contacts, tasks, projects, emails, SEO pages, keywords, and analytics.

### Step 3: Get Supabase Credentials

1. In Supabase, go to **Settings** → **API** (left sidebar)
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string)

### Step 4: Configure Environment Variables

1. Open `/workspaces/CreedaVA/.env` file
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=https://www.creedava.com
```

### Step 5: Set Up Google Search Console API (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "CreedaVA SEO"
3. Enable **Google Search Console API**:
   - Search "Search Console API"
   - Click "Enable"
4. Create credentials:
   - **APIs & Services** → **Credentials**
   - Click "Create Credentials" → "API Key"
   - Copy the API key
5. Set up OAuth:
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: `https://www.creedava.com`
   - Copy **Client ID**

6. Add to `.env`:
```env
VITE_GOOGLE_SEARCH_CONSOLE_CLIENT_ID=your_client_id
VITE_GOOGLE_SEARCH_CONSOLE_API_KEY=your_api_key
```

### Step 6: Test the Setup

1. Build and run the application:
```bash
npm install
npm run dev
```

2. Open your browser to the local URL shown
3. Go to `/signup` to create your first admin account
4. Use your CreedaVA email address
5. Log in and access the dashboard at `/admin`

### Step 7: Create First Admin User

1. After signing up, go to Supabase **Table Editor**
2. Open the `users` table
3. Find your user record
4. Edit the `role` field from `user` to `admin`
5. Save

## 🔒 Security Setup

### Enable Email Confirmations (Recommended)

1. In Supabase, go to **Authentication** → **Settings**
2. Enable "Confirm email" under Email Auth
3. Configure email templates as needed

### Set Up Custom SMTP (Optional)

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Add your email service credentials (e.g., SendGrid, Mailgun)
3. This allows branded confirmation emails

### Configure Row Level Security

Already set up in the SQL schema! Each table has policies to protect data.

## 🌐 Deploy to Azure

### Option 1: Azure Static Web Apps (Recommended)

1. In Azure Portal, create **Static Web App**
2. Connect to your GitHub repository
3. Build settings:
   - **App location**: `/`
   - **Api location**: `` (leave empty)
   - **Output location**: `dist`
4. Environment variables in Azure:
   - Add all your `.env` variables
   - Use Configuration → Application settings

5. Deploy command:
```bash
npm run build
```

### Option 2: Azure App Service

1. Create **App Service** (Node.js runtime)
2. Configure deployment from GitHub
3. Set environment variables in Configuration
4. Deploy

## 📊 Using the CRM

### Access URLs

- **Public Website**: `https://www.creedava.com`
- **Login**: `https://www.creedava.com/login`
- **Admin Dashboard**: `https://www.creedava.com/admin`

### Main Features

#### Lead Management (`/admin/leads`)
- Add new leads from website forms or manually
- Track lead status through sales pipeline
- Assign leads to team members
- Set follow-up dates

#### Contact Management (`/admin/contacts`)
- Store all customer information
- Add tags for organization
- Link to leads and projects
- Track interaction history

#### Tasks (`/admin/tasks`)
- Create to-dos and assignments
- Set priorities and due dates
- Link to leads, contacts, or projects
- Track completion

#### Projects (`/admin/projects`)
- Manage client projects
- Track status and budget
- Associate with contacts
- View project tasks

#### Email Management (`/admin/emails`)
- Track all communications
- Use templates for common emails
- Link to leads/contacts
- View send history

#### SEO Content (`/admin/seo`)
- Edit page meta tags
- Update titles and descriptions
- Manage keywords
- Set OpenGraph tags for social sharing

#### Keyword Tracking (`/admin/keywords`)
- Add keywords to monitor
- Track search rankings
- View search volume
- Monitor competition

#### Analytics (`/admin/analytics`)
- View page performance
- Track clicks and impressions
- See search positions
- Google Search Console data

## 🔄 Regular Maintenance

### Weekly
- Review new leads
- Update keyword positions (manually or via API)
- Check task deadlines

### Monthly
- Analyze SEO performance
- Review closed leads (won/lost)
- Update project statuses

### Quarterly
- Audit SEO content
- Review keyword strategy
- Clean up old data

## 🆘 Troubleshooting

### "Missing Supabase environment variables"
- Check `.env` file exists
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
- Restart dev server after changing .env

### Can't log in
- Check Supabase project is running
- Verify email/password are correct
- Check browser console for errors

### Tables not found
- Run the SQL schema in Supabase SQL Editor
- Verify all tables exist in Table Editor
- Check RLS policies are enabled

### Google Search Console not working
- Verify API is enabled in Google Cloud
- Check API key is valid
- Ensure domain is verified in Search Console

## 📞 Support

For issues or questions:
- Check Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Google Search Console API: [developers.google.com/webmaster-tools](https://developers.google.com/webmaster-tools)
- Email your development team

## 🎉 Next Steps

1. ✅ Complete setup following this guide
2. ✅ Create your admin account
3. ✅ Import existing customer data (if any)
4. ✅ Set up email templates
5. ✅ Configure SEO for all pages
6. ✅ Add keywords to track
7. ✅ Connect Google Search Console
8. ✅ Train your team on the CRM

Your CRM is now ready to use! 🚀
