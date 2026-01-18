# 🔍 Verification Steps - CreedaVA Deployment

**Deployed**: January 18, 2026  
**Commit**: c500dde  
**Changes**: Updated Google Analytics & Tag Manager

---

## ✅ Step-by-Step Verification

### 1. Check GitHub Actions Status (NOW)

**Do this first:**

1. Go to: https://github.com/Wiickedawesome/CreedaVA/actions
2. Look for the workflow run that just started
3. Wait for it to complete (usually 2-5 minutes)
4. Should show green checkmark ✅

**What's happening?**
- GitHub is building your app with the new GA ID
- Deploying to Azure Static Web App
- Deploying API functions

---

### 2. Test Google Analytics (After Deployment)

**Visit the site:**

1. Open: https://creedava.com
2. Browse a few pages (Home, About, Services, Contact)

**Check real-time data:**

1. Open: https://analytics.google.com/
2. Select your property: **CreedaVA**
3. Go to: **Reports** → **Realtime**
4. You should see yourself as an active user!

**Expected result:**
- 1 active user (you)
- Pages you visited showing up
- Location data (your city)

---

### 3. Verify Google Tag Manager

**Open Developer Tools:**

1. Visit: https://creedava.com
2. Press **F12** (open DevTools)
3. Go to **Console** tab

**Look for:**
- `dataLayer` object should exist
- GTM container should load
- No GTM errors

**Or use Tag Assistant:**

1. Install: [Google Tag Assistant](https://tagassistant.google.com/)
2. Visit: https://creedava.com
3. Should show: GTM-M3SSWZDG connected ✅

---

### 4. Test Admin Login (Critical)

**Test the OAuth flow:**

1. Visit: https://creedava.com/login
2. Click: **"Sign in with Google"**
3. Popup should open
4. Select your Google account (use @creedava.com or authorized email)
5. Should redirect to: https://creedava.com/admin

**Expected result:**
- ✅ Login succeeds
- ✅ Redirected to admin dashboard
- ✅ Can see admin pages (Leads, Tasks, Projects, etc.)

**If login fails:**
- Check browser console for errors
- Verify popup wasn't blocked
- Check Azure Function App logs

---

### 5. Test Admin API Calls

**Once logged into admin:**

1. Navigate to: https://creedava.com/admin/leads
2. Try creating a test lead
3. Try viewing existing data

**Expected result:**
- ✅ API calls work (no 401 errors)
- ✅ Data loads correctly
- ✅ CRUD operations work

**If API fails:**
- Check browser Network tab for 401/403 errors
- Verify Azure Function App has `GOOGLE_CLIENT_ID` set
- Check Azure Function logs

---

### 6. Check Browser Console (Both Public & Admin)

**Public site (https://creedava.com):**

Should see:
```
Google Analytics initialized: G-0EPSFYFWZQ
```

Should NOT see:
- CORS errors
- 404 errors for tracking scripts
- Any red errors

**Admin site (https://creedava.com/admin):**

Should see:
- Successful API responses (200 status)

Should NOT see:
- 401 Unauthorized errors
- CORS errors
- Token validation errors

---

## 🔧 Azure Verification

### Check Function App Logs

1. Go to: Azure Portal → Function Apps → creedava-api
2. Click: **Log stream** (under Monitoring)
3. Watch for:
   - ✅ "Google sign-in: your-email@creedava.com"
   - ❌ "Authentication failed" errors

### Verify Environment Variables

1. Azure Portal → Function Apps → creedava-api → Configuration
2. Confirm these are set:
   - `GOOGLE_CLIENT_ID` = 848560364888-odta7t8v7e7s70rtjojn7fapm5pbukqu.apps.googleusercontent.com
   - `GOOGLE_ALLOWED_DOMAIN` = creedava.com
   - `APP_ORIGIN` = https://creedava.com
   - `CORS_ORIGIN` = https://creedava.com

---

## 📊 What Success Looks Like

### ✅ All Green
- GitHub Actions: ✅ Workflow succeeded
- Google Analytics: ✅ Real-time data showing
- Google Tag Manager: ✅ Container loading
- Admin Login: ✅ OAuth working
- Admin API: ✅ CRUD operations working
- Console: ✅ No errors

### ⚠️ Partial Success
If some things work but not others:
- Public site works but login doesn't → Check Azure Function `GOOGLE_CLIENT_ID`
- Login works but API calls fail → Check Azure CORS settings
- Analytics not showing → Wait 30 minutes, check GA property settings

### ❌ Nothing Works
If the site is down:
- Check GitHub Actions for deployment errors
- Check Azure Static Web App status
- Check if domain DNS is correct

---

## 🧪 Quick Test Commands

### Test Local Environment (Before Deploying)

```bash
# Check environment variables
cat .env

# Start dev server
./start-dev.sh

# Test local login
open http://localhost:5173/login
```

### Test Production Endpoints

```bash
# Test API health
curl https://creedava.com/api/health

# Test CORS (should return JSON, not error)
curl -H "Origin: https://creedava.com" \
     https://creedava.com/api/health
```

### Check GTM Loading

```bash
# Should return GTM script
curl https://creedava.com/ | grep -i "GTM-M3SSWZDG"
```

---

## 📱 Quick Checklist

Use this for rapid verification:

- [ ] GitHub Actions completed successfully
- [ ] https://creedava.com loads without errors
- [ ] Google Analytics shows real-time visitor (you)
- [ ] Browser console shows GA initialization
- [ ] GTM container loads (check DevTools)
- [ ] Can visit https://creedava.com/login
- [ ] Google OAuth popup opens
- [ ] Login succeeds and redirects to /admin
- [ ] Admin dashboard loads
- [ ] Can view data in admin (Leads, Tasks, etc.)
- [ ] No 401 errors in Network tab
- [ ] No console errors on any page

---

## 🚨 Common Issues & Fixes

### Issue: "data collection isn't active for your website"
**Fix**: Wait 24-48 hours. Use Realtime view for immediate data.

### Issue: Login popup blocked
**Fix**: Allow popups for creedava.com in browser settings

### Issue: "Access denied: email not authorized"
**Fix**: 
1. Check email is in allowed list: `api/shared/auth.js`
2. Or use @creedava.com email
3. Verify `GOOGLE_ALLOWED_DOMAIN=creedava.com` in Azure

### Issue: 401 Unauthorized in admin
**Fix**: 
1. Verify Azure Function has `GOOGLE_CLIENT_ID`
2. Check it matches the frontend value
3. Try logging out and back in

### Issue: CORS errors
**Fix**:
1. Check Azure Function `CORS_ORIGIN=https://creedava.com`
2. Check `APP_ORIGIN=https://creedava.com`
3. Restart Function App

---

## 📞 Need Help?

If something's not working:

1. **Check GitHub Actions logs** - Often shows build/deploy errors
2. **Check browser Console** - Shows frontend errors
3. **Check Azure Function logs** - Shows backend errors
4. **Compare working vs broken** - Did it work locally? Then it's config.

---

**Good luck! 🍀**

Everything should be working now. If you see all green checkmarks above, you're all set!
