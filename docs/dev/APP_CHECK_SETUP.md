# Firebase App Check Setup Guide

## Problem Diagnosis

**Symptoms:**
- Login fails with `auth/internal-error` or `auth/network-request-failed`
- Console shows "Network error" messages
- Google Cloud reCAPTCHA dashboard shows "Incomplete" status with 0 assessments

**Root Cause:**
Firebase App Check was enabled but NOT properly registered with reCAPTCHA Enterprise. This caused all authentication requests to be blocked, resulting in the errors above.

---

## Current Status

✅ **App Check is now DISABLED** to unblock login functionality  
⚠️ **Production Impact**: Your app is currently unprotected against abuse

---

## Proper Setup (Required for Production)

### Step 1: Verify reCAPTCHA Enterprise Key

1. Go to [Google Cloud Console → Security → reCAPTCHA](https://console.cloud.google.com/security/recaptcha)
2. Select project: `creeda-va`
3. Find your key for domain: `creedava.com`
4. **Current Key ID**: `6LdnGGwsAAAAALSLfGUNF4tob4xnSYVkktsVAQrB`
5. Verify the following settings:
   - **Integration Type**: Checkbox (for App Check)/Score-based
   - **Domains**: Must include:
     - `creedava.com`
     - `creeda-va.firebaseapp.com`
     - `creeda-va.web.app`
     - `localhost` (for development)

### Step 2: Register App in Firebase App Check

🚨 **CRITICAL STEP** - This is what was missing!

1. Go to [Firebase Console → App Check](https://console.firebase.google.com/project/creeda-va/appcheck)
2. Under "Apps" section, find your Web app
3. Click **"Register"** or **"Manage"**
4. Choose **"reCAPTCHA Enterprise"** as the provider
5. Enter the **Site Key**: `6LdnGGwsAAAAALSLfGUNF4tob4xnSYVkktsVAQrB`
6. Click **"Save"**

### Step 3: Configure Enforcement (Optional but Recommended)

1. In Firebase Console → App Check
2. Go to the **"APIs"** tab
3. For each service (Firestore, Storage, Functions), choose enforcement level:
   - **Enforced**: Block unauthenticated requests (recommended for production)
   - **Monitoring**: Log but don't block (good for testing)

### Step 4: Enable in Your App

Update `.env.local`:

```bash
# Enable App Check after completing steps 1-3 above
NEXT_PUBLIC_ENABLE_APP_CHECK=true
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY=6LdnGGwsAAAAALSLfGUNF4tob4xnSYVkktsVAQrB
```

### Step 5: Test & Verify

1. Restart your dev server: `npm run dev`
2. Open browser console
3. Look for: `[App Check] Initialized with reCAPTCHA Enterprise`
4. Attempt login
5. Check Google Cloud Console → reCAPTCHA → Your key
   - You should now see assessments being created
   - Status should change from "Incomplete" to active

---

## Development Setup

For local development, you can use App Check debug tokens:

1. Enable debug mode (already configured in code for NODE_ENV === "development")
2. Open browser console, look for debug token: `FIREBASE_APPCHECK_DEBUG_TOKEN`
3. Copy the token
4. In Firebase Console → App Check → Apps → Your app → Debug tokens
5. Add the debug token
6. Restart your dev server

---

## Authorized Domains Checklist

Ensure these domains are authorized in:

### Firebase Console → Authentication → Settings → Authorized domains
- ✅ `creedava.com`
- ✅ `creeda-va.firebaseapp.com`
- ✅ `creeda-va.web.app`
- ✅ `localhost` (for development)

### Google Cloud Console → reCAPTCHA Enterprise → Your key → Domains
- ✅ `creedava.com`
- ✅ `creeda-va.firebaseapp.com`
- ✅ `creeda-va.web.app`
- ✅ `localhost` (for development)

---

## Troubleshooting

### "App Check token is invalid or has expired"
- Clear browser cache and cookies
- Verify the site key matches in both Firebase and Google Cloud
- Check that domains are authorized

### Still seeing "auth/internal-error"
- Ensure `NEXT_PUBLIC_ENABLE_APP_CHECK=false` in `.env.local`
- Restart dev server after changing environment variables
- Check browser console for specific error messages

### reCAPTCHA dashboard still shows "Incomplete"
- This means App Check isn't properly registered in Firebase Console
- Double-check Step 2 above was completed

---

## Security Recommendations

1. ✅ Keep App Check **DISABLED** until Steps 1-3 are complete
2. ✅ Enable App Check in **monitoring mode** first, then enforce
3. ✅ Regularly review assessments in Google Cloud Console
4. ✅ Set up alerts for suspicious activity
5. ✅ Keep authorized domains list minimal (remove unused domains)

---

## References

- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [reCAPTCHA Enterprise Documentation](https://cloud.google.com/recaptcha/docs)
- [Firebase Auth Troubleshooting](https://firebase.google.com/docs/auth/web/troubleshoot)
