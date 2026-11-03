# CreedaVA — Integration Setup Guide

All integrations can be configured in **two ways** (they merge together):

| Method | Where | Best for |
|--------|-------|----------|
| **Admin UI** | Settings → Integrations | Quick setup, easy updates |
| **Environment Variables** | `functions/.env` | Hardcoded fallback, CI/CD, never loses connection |

> **Priority**: Firestore (Admin UI) values win. Env vars fill any gaps.

---

## Quick Start

```bash
# 1. Copy the env template
cp functions/.env.example functions/.env

# 2. Fill in your credentials (see sections below)
nano functions/.env

# 3. Deploy Cloud Functions
firebase deploy --only functions

# 4. Visit Admin → Settings → "Verify All" to confirm everything works
```

---

## Email (SMTP)

**What it does**: Sends emails from the dashboard — lead follow-ups, campaigns, notifications.

### Setup via Environment Variables
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@creedava.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
SMTP_ALIASES=hello@creedava.com, team@creedava.com
```

### Getting a Gmail App Password
1. Go to [Google Account → Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already active
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" → "Other (Custom name)" → "CreedaVA CRM"
5. Copy the 16-character password → paste as `SMTP_PASS`

### Aliases
If you want to send from `hello@creedava.com` or `team@creedava.com`:
1. Go to [Google Admin Console](https://admin.google.com) → Users → admin@creedava.com
2. Add the alias emails
3. Add them to `SMTP_ALIASES` (comma-separated)

---

## Google Calendar

**What it does**: Auto-syncs confirmed bookings to a Google Calendar.

### Setup
```env
GCAL_CALENDAR_ID=admin@creedava.com
GCAL_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"creeda-va",...}
```

### Getting Service Account Credentials
1. Go to [Google Cloud Console → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=creeda-va)
2. Create a service account (e.g., `cal@creeda-va.iam.gserviceaccount.com`)
3. Create a JSON key → Download the file
4. Enable the [Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com)
5. Share the target calendar with the service account email (Editor permission)
6. Paste the full JSON key as the value of `GCAL_SERVICE_ACCOUNT_KEY`

---

## Google Ads

**What it does**: Syncs campaign data — impressions, clicks, conversions, spend.

### Setup
```env
GADS_DEVELOPER_TOKEN=your-developer-token
GADS_CLIENT_ID=xxx.apps.googleusercontent.com
GADS_CLIENT_SECRET=GOCSPX-xxx
GADS_REFRESH_TOKEN=1//0xxx
GADS_CUSTOMER_ID=123-456-7890
```

### Getting Credentials
1. [Apply for Google Ads API access](https://developers.google.com/google-ads/api/docs/first-call/dev-token)
2. Create OAuth 2.0 credentials in [Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
3. Use the [OAuth Playground](https://developers.google.com/oauthplayground/) with scope `https://www.googleapis.com/auth/adwords` to get a refresh token
4. Find your Customer ID in [Google Ads → Settings → Account](https://ads.google.com)

---

## Search Console

**What it does**: Fetches real SEO data — search queries, impressions, CTR, positions.

### Setup
```env
GSC_SITE_URL=https://creedava.com
GSC_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"creeda-va",...}
```

### Getting Credentials
1. Enable the [Search Console API](https://console.cloud.google.com/apis/library/searchconsole.googleapis.com)
2. Use the same service account as Calendar (or create a new one)
3. Go to [Search Console → Settings → Users and permissions](https://search.google.com/search-console)
4. Add the service account email as a **Full** user
5. Paste the JSON key as `GSC_SERVICE_ACCOUNT_KEY`

---

## Google Business Profile

**What it does**: Manages reviews, local SEO metrics, business posts.

### Setup
```env
GBP_ACCOUNT_ID=accounts/123456789
GBP_LOCATION_ID=locations/987654321
GBP_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"creeda-va",...}
```

### Getting Credentials
1. Enable the [Business Profile APIs](https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com)
2. Create/use a service account
3. Grant the service account access to the Business Profile (Owner/Manager)
4. Find Account ID and Location ID via the [Business Profile API Explorer](https://developers.google.com/my-business/reference/rest)

---

## Google Analytics (GA4)

**What it does**: Fetches GA4 reports — active users, pageviews, referrers, real-time data.

### Setup
```env
GA4_PROPERTY_ID=properties/123456789
GA4_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"creeda-va",...}
```

### Getting Credentials
1. Enable the [Analytics Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com)
2. Go to [Google Analytics → Admin → Property Access Management](https://analytics.google.com)
3. Add the service account email with **Viewer** role
4. Find your Property ID in Admin → Property Settings

---

## Google Sheets

**What it does**: Exports CRM data and reports to Google Sheets.

### Setup
```env
GSHEETS_SPREADSHEET_ID=                      # Leave blank to auto-create
GSHEETS_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"creeda-va",...}
```

### Getting Credentials
1. Enable the [Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com)
2. Use an existing service account
3. If using an existing spreadsheet, share it with the service account email (Editor)

---

## Google Drive

**What it does**: Stores client files, proposals, reports in shared folders.

### Setup
```env
GDRIVE_FOLDER_ID=1ABCdef...
GDRIVE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"creeda-va",...}
```

### Getting Credentials
1. Enable the [Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)
2. Create a folder in Google Drive for CreedaVA
3. Share it with the service account email (Editor)
4. Copy the folder ID from the URL: `drive.google.com/drive/folders/{THIS_IS_THE_ID}`

---

## Shared Service Account Tip

Most Google integrations (Calendar, Search Console, Analytics, Sheets, Drive, Business Profile) can share **one service account**. Just:

1. Create one service account in [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Enable all required APIs
3. Grant it access to each service (share calendars, add to Search Console, etc.)
4. Use the same JSON key everywhere

```env
# Shared service account for all Google services
GCAL_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GSC_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GA4_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GSHEETS_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GDRIVE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GBP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

## Social media and LinkedIn — deliberately removed

Neither is part of the product. Both were built, neither worked properly, both were
removed. Recorded here so nobody rebuilds them without knowing why.

### What was removed, and when

| Removed | When | Reason |
| --- | --- | --- |
| `app/api/linkedin/{authorize,callback,publish}` | 2026-11-02 | Posts to a personal profile, never the company page |
| `LINKEDIN_*` env vars, `LINKEDIN_CLIENT_SECRET` | 2026-11-02 | No longer referenced |
| `app/(admin)/admin/marketing/social` page | 2026-11-02 | Duplicated LinkedIn's own composer, worse |
| Sidebar "Social Media" entry | 2026-11-02 | Page is gone |
| `create_social_draft` AI tool | 2026-11-02 | Wrote to a collection with no UI left to manage it |
| `generateSocialPosts` / `buildSocialEngagementContext` | 2026-11-02 | Dead once the page was gone |
| `SocialPost` type, `social-posts` fetcher and AI context | 2026-11-02 | Nothing could write to the collection |
| `social-posts` Firestore rule | 2026-11-02 | Removed with the type |

### Why LinkedIn cannot be integrated the way it would need to be

Everything available with a normal OAuth token posts as the *authorising member's personal
profile*, never as the CreedaVA company page. Posting as the page needs
`w_organization_social`, which requires the LinkedIn partner product plus an ADMINISTRATOR
role on the page — approval takes weeks and is not guaranteed.

| Scope | Availability |
| --- | --- |
| `w_member_social` — post as a person | Self-serve, instant |
| `r_member_social` — read back your own posts, comments, likes | Private permission, approved users only |
| `r_organization_social` — read company posts, engagement, insights | Partner only |

So even with a working token we could write posts and never read a single impression,
click, comment or follower count. Any scheduling or analytics UI would have no data to
populate it.

### Why the AI drafting page went too

It generated copy for four platforms in one JSON blob, which is not how anyone actually
posts. LinkedIn's own composer has better preview, mention autocomplete and image handling
than anything we would build, and it costs nothing to maintain. The AI prompt was doing
the only valuable part, and that is available directly from the assistant.

### Do not reintroduce

- OAuth routes, tokens, or a `LINKEDIN_CLIENT_SECRET`
- Any "publish to LinkedIn" button — it would publish to a personal profile
- Any social scheduling or analytics dashboard — no read access exists to populate it
- Browser-automation or rented-account approaches (the sbl.so/Expandi model): they breach
  LinkedIn's User Agreement and the ban lands on the account, not the vendor

### Left in place on purpose

**`social-posts` documents.** The Firestore collection may contain historical records. No
code reads or writes it any more and its rules are gone, so it is unreachable from the app.
The data still exists and is visible in the Firebase console — delete the collection there
once you have confirmed nothing in it is worth keeping. Deleting a collection is not a code
change, so it is not something a commit can do.

---

## Verification

### From the Admin UI
1. Go to **Settings → Integrations**
2. Click **"Verify All"** — tests every enabled integration
3. Each provider shows: ✓ Verified / ✗ Failed / ● Untested

### From the CLI
```bash
# Test all integrations from the Firebase emulator
firebase emulators:start --only functions
# Then call the testIntegration function via the emulator shell
```

### Troubleshooting
- **"Not configured"** → No credentials in Firestore AND no env vars set
- **"Disabled"** → Integration exists but `enabled: false` — click Enable
- **"Connection failed"** → Credentials exist but API call failed — check error message
- **Status resets to Untested** → This is fixed! The page now auto-verifies on load

---

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│  Admin UI (Next.js)  │────▶│  Firestore           │
│  Settings → Integ.   │     │  integrations/{id}   │
│  - Save credentials  │     │  - config: {...}     │
│  - Test connection   │     │  - enabled: boolean  │
│  - Verify All        │     │  - lastTestSuccess   │
└─────────┬───────────┘     └──────┬───────────────┘
          │                          │
          │ httpsCallable            │ Real-time listener
          ▼                          │ (onSnapshot)
┌─────────────────────┐             │
│  Cloud Functions     │◀────────────┘
│  - testIntegration   │
│  - verifyAll         │     ┌──────────────────────┐
│  - sendEmail, etc.   │────▶│  Environment Vars    │
│                      │     │  functions/.env      │
│  getIntegrationConfig│     │  (hardcoded fallback)│
│  1. Firestore first  │     └──────────────────────┘
│  2. Env vars fill gaps│
└──────────────────────┘
```
