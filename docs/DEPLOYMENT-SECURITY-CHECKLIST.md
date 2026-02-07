# Security Deployment Checklist

Use this checklist when deploying your security improvements to production.

## Pre-Deployment

### ✅ Local Testing
- [x] Build completed successfully (`npm run build`)
- [ ] Test dev server locally (`npm run dev`)
- [ ] Check browser console for CSP violations
- [ ] Verify Google OAuth still works
- [ ] Test admin dashboard functionality

### ✅ Environment Variables Check
Make sure these are set in your Azure environment:

**Azure Static Web App (Frontend):**
```bash
VITE_BASE_PATH=/
VITE_API_BASE_URL=https://your-api.azurewebsites.net
VITE_GOOGLE_CLIENT_ID=<your-client-id>
```

**Azure Functions (Backend):**
```bash
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_ALLOWED_DOMAIN=<your-company-domain>
COSMOS_ENDPOINT=<your-cosmos-endpoint>
COSMOS_KEY=<your-cosmos-key>
COSMOS_DATABASE_NAME=CreedaVA
CORS_ORIGIN=https://creedava.com
APP_ORIGIN=https://creedava.com
```

## Deployment Steps

### 1. Commit Changes
```bash
git add public/staticwebapp.config.json public/_headers docs/SECURITY.md scripts/verify-security.sh
git commit -m "feat: add enterprise-grade security headers (CSP, HSTS, Permissions-Policy)"
git push origin main
```

### 2. Monitor Deployment
- [ ] Check GitHub Actions workflow
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors

### 3. Post-Deployment Testing

#### A. Security Headers Verification
```bash
# Run the automated script
./scripts/verify-security.sh https://creedava.com

# Or manually check
curl -I https://creedava.com | grep -i "content-security\|strict-transport\|x-frame"
```

#### B. Online Security Scanners
Run these and aim for **A+ ratings**:

1. **SSL Labs** (HTTPS/TLS):
   - URL: https://www.ssllabs.com/ssltest/
   - Enter: `creedava.com`
   - Expected: A+ rating
   
2. **Security Headers**:
   - URL: https://securityheaders.com/
   - Enter: `https://creedava.com`
   - Expected: A+ rating

3. **Mozilla Observatory**:
   - URL: https://observatory.mozilla.org/
   - Enter: `creedava.com`
   - Expected: A+ rating

#### C. Functionality Tests
- [ ] Homepage loads correctly
- [ ] No CSP errors in browser console (F12)
- [ ] Admin login works (Google OAuth)
- [ ] Admin dashboard loads
- [ ] Contact form submits
- [ ] ChatBot widget works
- [ ] Analytics tracking works

#### D. Corporate Network Test
- [ ] Access site from work network
- [ ] Verify no security warnings
- [ ] Test all major features work

## Troubleshooting

### Issue: CSP Violations in Console

**Symptoms:** Browser console shows "Refused to load..."

**Solution:**
1. Open browser DevTools (F12) → Console
2. Note which resource is blocked
3. Check if it's legitimate:
   - **External script?** Add domain to `script-src` in CSP
   - **External font?** Add domain to `font-src` in CSP
   - **External image?** Already allowed via `https:`
   - **Inline style?** May need `'unsafe-inline'` (already included)

4. Update `public/staticwebapp.config.json` and `public/_headers`:
```json
"Content-Security-Policy": "... script-src 'self' https://new-domain.com ..."
```

### Issue: Google OAuth Doesn't Work

**Symptoms:** Login popup fails or shows error

**Check:**
1. `https://accounts.google.com` is in `frame-src`? ✅ (already added)
2. Google Client ID is correct in environment variables
3. Authorized JavaScript origins include your domain
4. Authorized redirect URIs include your domain

**Fix:**
- Go to Google Cloud Console → APIs & Services → Credentials
- Edit your OAuth client
- Add your production URL to authorized origins

### Issue: CORS Errors on API Calls

**Symptoms:** "CORS policy" errors in console

**Fix:**
1. Check `api/shared/cors.js` includes your production domain
2. Verify `CORS_ORIGIN` environment variable is set in Azure Functions
3. Restart Azure Functions app

### Issue: Site Still Blocked at Work

**After confirming A+ ratings on all scanners:**

1. **Check with IT department:**
   - Share security scanner results
   - Provide [docs/SECURITY.md](./SECURITY.md)
   - Show CSP and HSTS compliance

2. **Possible corporate blocklist:**
   - Domain may need whitelisting
   - Request IT to check firewall/proxy logs
   - May need to submit security review

3. **Certificate issues:**
   - Verify SSL certificate is valid
   - Check certificate chain is complete
   - Some corporate proxies require specific CA

## Rollback Plan

If issues arise in production:

```bash
# Revert the commit
git revert HEAD
git push origin main

# Or temporarily disable CSP (EMERGENCY ONLY)
# Remove Content-Security-Policy from globalHeaders
# Redeploy
```

## Success Criteria

You're done when:
- ✅ All security scanners show A+ ratings
- ✅ Site accessible from work network
- ✅ No console errors on homepage
- ✅ Google OAuth login works
- ✅ Admin dashboard functions normally
- ✅ Contact form submits successfully
- ✅ No user complaints about blocked features

## Monitoring Post-Deployment

**Week 1:**
- Monitor error rates in Azure Application Insights
- Check for CSP violation reports (if configured)
- Watch for user complaints
- Verify analytics data still flowing

**Ongoing:**
- Monthly security header checks
- Quarterly full security scans
- Update CSP as new services are added
- Review OWASP Top 10 annually

## Reference Links

- Security Documentation: [SECURITY.md](./SECURITY.md)
- Verification Script: `scripts/verify-security.sh`
- CSP Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- HSTS Preload: https://hstspreload.org/
- OWASP Cheat Sheet: https://cheatsheetseries.owasp.org/

---

**Questions or Issues?**
- Check [SECURITY.md](./SECURITY.md) for detailed configuration
- Review browser console for specific errors
- Contact Azure support for infrastructure issues
