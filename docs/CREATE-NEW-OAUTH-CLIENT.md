# 🔑 Create New Google OAuth Client (After Subscription Change)

## Problem
Your old OAuth client (`848560364888-odta...`) was deleted when you changed Google subscriptions.

Error: `The OAuth client was deleted` / `Error 401: deleted_client`

---

## Solution: Create New OAuth 2.0 Client

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com/
2. Select your project (or create one if needed)
3. Go to: **APIs & Services** → **Credentials**

### Step 2: Create OAuth 2.0 Client ID

1. Click: **+ CREATE CREDENTIALS** → **OAuth client ID**

2. **Application type**: Select **Web application**

3. **Name**: Enter `CreedaVA Login` (or any name you want)

4. **Authorized JavaScript origins** - Add BOTH:
   ```
   https://creedava.com
   http://localhost:5173
   ```
   
   Click **+ ADD URI** for each one.

5. **Authorized redirect URIs** - Add BOTH:
   ```
   https://creedava.com/google-callback.html
   http://localhost:5173/google-callback.html
   ```
   
   Click **+ ADD URI** for each one.

6. Click: **CREATE**

### Step 3: Copy Your New Client ID

After creating, Google will show:
- ✅ **Your Client ID** (looks like: `123456789-abc123xyz.apps.googleusercontent.com`)
- Client Secret (you don't need this)

**COPY THE CLIENT ID** - you'll need it in the next steps!

---

## Update Your Configuration

Once you have your new Client ID, you need to update it in **4 places**:

### 1. Local Development (.env)

```bash
cd /home/wicked/CreedaVA
nano .env
```

Update this line:
```
VITE_GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
```

Save and exit (Ctrl+X, Y, Enter)

### 2. Local API (api/local.settings.json)

```bash
nano api/local.settings.json
```

Update this line in the `Values` section:
```json
"GOOGLE_CLIENT_ID": "YOUR_NEW_CLIENT_ID_HERE",
```

Save and exit.

### 3. Azure Function App

Go to: **Azure Portal** → **Function Apps** → **creedava-api** → **Configuration**

Find: `GOOGLE_CLIENT_ID`
- If exists: Edit it
- If not: Click **+ New application setting**

Set value to: `YOUR_NEW_CLIENT_ID_HERE`

Click **Save** at the top!

### 4. Azure Static Web App

Go to: **Azure Portal** → **Static Web Apps** → **CreedaVA** → **Environment variables**

Find: `VITE_GOOGLE_CLIENT_ID`
- If exists: Edit it
- If not: Click **Add**

Set value to: `YOUR_NEW_CLIENT_ID_HERE`

Click **Save**!

### 5. GitHub Secrets

Go to: **GitHub** → **CreedaVA** → **Settings** → **Secrets and variables** → **Actions**

Find: `VITE_GOOGLE_CLIENT_ID`
- Click the pencil icon to edit
- Update value to: `YOUR_NEW_CLIENT_ID_HERE`
- Click **Update secret**

---

## Test the Fix

### Test Locally First

```bash
# 1. Make sure .env has new Client ID
cat .env | grep VITE_GOOGLE_CLIENT_ID

# 2. Make sure API has new Client ID
cat api/local.settings.json | grep GOOGLE_CLIENT_ID

# 3. Start dev environment
./start-dev.sh

# 4. Try logging in
# Open: http://localhost:5173/login
# Click "Sign in with Google"
# Should work now!
```

### Deploy to Production

```bash
# After local test works, deploy
git add .env api/local.settings.json
git commit -m "Update Google OAuth Client ID after subscription change"
git push origin main
```

Wait 2-5 minutes for deployment, then test at https://creedava.com/login

---

## Quick Reference

**What each Client ID setting does:**

| Location | Purpose |
|----------|---------|
| `.env` (local) | Frontend build in local dev |
| `api/local.settings.json` (local) | Backend validation in local dev |
| Azure Static Web App env vars | Frontend build in production |
| Azure Function App settings | Backend validation in production |
| GitHub Secrets | CI/CD builds during deployment |

**All 5 must match for login to work!**

---

## Troubleshooting

### "redirect_uri_mismatch"
- Go back to Google Cloud Console → Credentials
- Make sure redirect URIs include BOTH production and localhost URLs
- Must match EXACTLY (with `/google-callback.html` at the end)

### Login works locally but not in production
- Check Azure Static Web App has `VITE_GOOGLE_CLIENT_ID` set
- Check Azure Function App has `GOOGLE_CLIENT_ID` set
- Both must match the new Client ID

### "Access denied: email not authorized"
- This is different - it means OAuth works but your email isn't allowed
- Check `api/shared/auth.js` allowedEmails list
- Or use an @creedava.com email

---

**After you create the new client and update all 5 locations, login should work again!** ✅
