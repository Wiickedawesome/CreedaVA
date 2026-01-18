# Google Services Setup Guide for CreedaVA

This guide covers all Google integrations for the CreedaVA platform.

## 🎯 Overview

Your CreedaVA site uses three Google services:

1. **Google Analytics 4 (GA4)** - Track website traffic and user behavior
2. **Google Tag Manager (GTM)** - Manage tracking tags without code changes
3. **Google OAuth 2.0** - Secure admin login

---

## 📊 Current Configuration

### Google Analytics 4
- **Measurement ID**: `G-0EPSFYFWZQ`
- **Stream Name**: CreedaVA
- **Stream URL**: https://creedava.com
- **Stream ID**: 13324400240

### Google Tag Manager
- **Container ID**: `GTM-M3SSWZDG`

### Google OAuth 2.0
- **Client ID**: `848560364888-odta7t8v7e7s70rtjojn7fapm5pbukqu.apps.googleusercontent.com`
- **Allowed Domain**: `creedava.com`
- **Authorized Emails**:
  - johnchuc@outlook.com
  - john@creedava.com
  - admin@creedava.com
  - info@creedava.com

---

## 🔧 Local Development Setup

### 1. Environment Variables (.env file)

Create or update your `.env` file in the project root:

```bash
# Google OAuth for Admin Login
VITE_GOOGLE_CLIENT_ID=848560364888-odta7t8v7e7s70rtjojn7fapm5pbukqu.apps.googleusercontent.com
VITE_ENABLE_GOOGLE_LOGIN=true

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-0EPSFYFWZQ

# API Configuration
VITE_API_BASE_URL=/api
```

### 2. API Local Settings (api/local.settings.json)

Your API needs these settings:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "APP_ORIGIN": "http://localhost:5173",
    "CORS_ORIGIN": "http://localhost:5173",
    
    "GOOGLE_CLIENT_ID": "848560364888-odta7t8v7e7s70rtjojn7fapm5pbukqu.apps.googleusercontent.com",
    "GOOGLE_ALLOWED_DOMAIN": "creedava.com",
    "ALLOW_DEV_TOKEN": "true",
    
    "COSMOS_ENDPOINT": "https://creedava-db.documents.azure.com:443/",
    "COSMOS_KEY": "[YOUR_COSMOS_KEY]",
    "COSMOS_DATABASE": "creedava",
    "USE_COSMOS_EMULATOR": "false"
  }
}
```

---

## ☁️ Azure Production Setup

### Required Azure Function App Settings

In Azure Portal → Your Function App → Configuration → Application Settings:

```
GOOGLE_CLIENT_ID = 848560364888-odta7t8v7e7s70rtjojn7fapm5pbukqu.apps.googleusercontent.com
GOOGLE_ALLOWED_DOMAIN = creedava.com
ALLOW_DEV_TOKEN = false
APP_ORIGIN = https://creedava.com
CORS_ORIGIN = https://creedava.com
COSMOS_ENDPOINT = https://creedava-db.documents.azure.com:443/
COSMOS_KEY = [YOUR_PRODUCTION_KEY]
COSMOS_DATABASE = creedava
```

---

## 🔐 GitHub Secrets for CI/CD

In GitHub → Repository Settings → Secrets and variables → Actions:

### Required Secrets

```
VITE_GOOGLE_CLIENT_ID = 848560364888-odta7t8v7e7s70rtjojn7fapm5pbukqu.apps.googleusercontent.com
VITE_GA_MEASUREMENT_ID = G-0EPSFYFWZQ
AZURE_STATIC_WEB_APPS_API_TOKEN = [Your Azure SWA deployment token]
```

### Optional Secrets

```
VITE_GOOGLE_SEARCH_CONSOLE_CLIENT_ID = [If using Search Console API]
```

---

## 🔑 Google OAuth Setup

### Current OAuth Configuration

Your OAuth client is configured with:

**Authorized JavaScript origins:**
- `https://creedava.com`
- `http://localhost:5173` (for development)

**Authorized redirect URIs:**
- `https://creedava.com/google-callback.html`
- `http://localhost:5173/google-callback.html`

### How Login Works

1. User clicks "Sign in with Google" on [/login](https://creedava.com/login)
2. Popup opens Google OAuth consent screen
3. User selects Google account
4. Google redirects to `/google-callback.html` with ID token
5. Frontend receives token via `postMessage`
6. Token stored in localStorage as `google_id_token`
7. All admin API calls include token: `Authorization: Bearer <token>`
8. Backend validates token against Google's JWKS
9. Backend checks email domain and allowed list

### Testing OAuth Locally

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to http://localhost:5173/login
# 3. Click "Sign in with Google"
# 4. Use one of the authorized emails
# 5. Should redirect to /admin
```

---

## 📈 Google Analytics Setup

### Verification

After deploying, verify GA is working:

1. Visit your site: https://creedava.com
2. Open Google Analytics → Reports → Realtime
3. You should see your visit in real-time

### Tag Assistant

Use [Google Tag Assistant](https://tagassistant.google.com/) to verify:
- GA4 tag fires on page load
- GTM container loads correctly
- Events are tracked properly

---

## 🏷️ Google Tag Manager Setup

### What GTM Does

GTM is installed on your site and lets you:
- Add/modify tracking tags without code deployments
- Track custom events (button clicks, form submissions)
- Set up conversion tracking for ads
- Add third-party scripts (Facebook Pixel, LinkedIn Insight, etc.)

### Current Installation

GTM code is in two places in `index.html`:

**In `<head>`:**
```html
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M3SSWZDG');</script>
```

**After opening `<body>`:**
```html
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M3SSWZDG"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

---

## ✅ Verification Checklist

### Local Development

- [ ] `.env` file has `VITE_GOOGLE_CLIENT_ID` and `VITE_GA_MEASUREMENT_ID`
- [ ] `api/local.settings.json` has `GOOGLE_CLIENT_ID`
- [ ] Can run `npm run dev` without errors
- [ ] Can sign in at http://localhost:5173/login with Google
- [ ] Can access http://localhost:5173/admin after login

### Production (Azure)

- [ ] Azure Function App has `GOOGLE_CLIENT_ID` setting
- [ ] GitHub secrets include `VITE_GOOGLE_CLIENT_ID` and `VITE_GA_MEASUREMENT_ID`
- [ ] CI/CD workflow passes
- [ ] Can sign in at https://creedava.com/login
- [ ] Google Analytics shows real-time traffic
- [ ] Google Tag Manager container loads (check browser DevTools)

### Google Console Checks

- [ ] Google Analytics shows data collection active
- [ ] Google Tag Manager shows container published
- [ ] Google Cloud Console shows OAuth client active
- [ ] Authorized redirect URIs include your domains

---

## 🚨 Troubleshooting

### "Google sign-in is not configured"

**Cause**: `VITE_GOOGLE_CLIENT_ID` not set in `.env`

**Fix**:
```bash
echo 'VITE_GOOGLE_CLIENT_ID=848560364888-odta7t8v7e7s70rtjojn7fapm5pbukqu.apps.googleusercontent.com' >> .env
```

### "Access denied: email is not authorized"

**Cause**: Your email isn't in the allowed list

**Fix**: Add your email to `api/shared/auth.js` in the `allowedEmails` array

### "Authentication failed: invalid token"

**Cause**: Backend can't validate Google token

**Fix**: Check `GOOGLE_CLIENT_ID` matches in both frontend and backend

### Analytics not showing data

**Cause**: GA4 Measurement ID not configured

**Fix**:
1. Check `.env` has `VITE_GA_MEASUREMENT_ID=G-0EPSFYFWZQ`
2. Rebuild: `npm run build`
3. Check browser console for GA initialization log

---

## 📚 Additional Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Google Tag Manager Guide](https://support.google.com/tagmanager/answer/6102821)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [CreedaVA Operations Guide](./OPERATIONS.md)

---

## 🔄 What Changed in Your Subscription Update

Based on your subscription change, these IDs were updated:

| Service | Old Value | New Value |
|---------|-----------|-----------|
| Google Analytics | `G-MX1D5RQMQS` | `G-0EPSFYFWZQ` |
| Google Tag Manager | *(not previously configured)* | `GTM-M3SSWZDG` |
| Google OAuth Client | *(unchanged)* | `848560364888-odta...` |

### Files Updated

- ✅ `.env` - Added new GA ID
- ✅ `index.html` - Updated GA tag and added GTM
- ⚠️ Azure Function App settings - **You need to verify**
- ⚠️ GitHub Secrets - **You need to update**

---

**Last Updated**: January 18, 2026
