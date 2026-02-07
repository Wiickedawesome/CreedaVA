# CreedaVA Security Configuration

## Overview
CreedaVA implements enterprise-grade security measures to ensure safe operation in high-security environments like corporate networks.

## Security Headers Implemented

### 1. **Strict-Transport-Security (HSTS)**
```
max-age=31536000; includeSubDomains; preload
```
- Forces HTTPS connections for 1 year
- Applies to all subdomains
- Eligible for browser preload list

### 2. **Content-Security-Policy (CSP)**
Prevents XSS, injection attacks, and unauthorized resource loading:
- **default-src**: Only allows resources from same origin
- **script-src**: Self + Google OAuth + Analytics (with inline/eval for React)
- **style-src**: Self + Google Fonts (with inline for Tailwind)
- **font-src**: Self + Google Fonts + data URIs
- **img-src**: Self + data URIs + HTTPS images
- **connect-src**: Self + Google services + Azure APIs
- **frame-src**: Google OAuth only
- **object-src**: Blocked (prevents Flash, Java plugins)
- **upgrade-insecure-requests**: Auto-upgrades HTTP to HTTPS

### 3. **X-Content-Type-Options**
```
nosniff
```
Prevents MIME-type sniffing attacks.

### 4. **X-Frame-Options**
```
SAMEORIGIN
```
Prevents clickjacking by only allowing same-origin iframes.

### 5. **X-XSS-Protection**
```
1; mode=block
```
Enables browser's XSS filter (legacy support).

### 6. **Referrer-Policy**
```
strict-origin-when-cross-origin
```
Only sends origin (not full URL) to external sites.

### 7. **Permissions-Policy**
```
geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()
```
Blocks unnecessary browser features that could be exploited.

## Authentication & Authorization

### Google OAuth Integration
- **Frontend**: `src/lib/auth.ts` - Popup-based OAuth flow
- **Backend**: `api/shared/auth.js` - JWT validation via Google JWKS
- **Validation**: 
  - Verifies token signature
  - Checks domain restrictions (`GOOGLE_ALLOWED_DOMAIN`)
  - Validates audience (`GOOGLE_CLIENT_ID`)

### Admin API Protection
All admin endpoints require:
1. Valid Google ID token in `Authorization: Bearer <token>` header
2. Token validation against Google's public keys
3. Domain verification (if configured)

## CORS Configuration

### Backend (`api/shared/cors.js`)
- Whitelist-based origin validation
- Explicitly defined allowed origins
- No wildcard in production
- Credentials not allowed (stateless auth)

### Allowed Origins
- `https://creedava.com`
- `https://www.creedava.com`
- Localhost (dev only)

## Data Security

### Cosmos DB
- Partition key strategy prevents data leakage between entities
- Connection strings stored in Azure Key Vault or environment variables
- TLS enforced for all connections
- Emulator uses self-signed cert (dev only)

### Sensitive Data Handling
- No credentials in frontend code
- API keys in environment variables only
- Google tokens validated server-side
- No localStorage for sensitive data (except dev mode)

## HTTPS/TLS Requirements

### Production
- ✅ Must use HTTPS
- ✅ Valid SSL certificate required
- ✅ HSTS forces HTTPS for 1 year
- ✅ Mixed content blocked by CSP

### Development
- Uses `http://localhost` (allowed exception)
- Cosmos emulator uses self-signed cert
- `NODE_TLS_REJECT_UNAUTHORIZED=0` for local Cosmos only

## Compliance Features

### Corporate Network Compatibility
✅ **No Mixed Content**: All resources load over HTTPS  
✅ **CSP Compliant**: Strict content policy prevents injection  
✅ **HSTS Enabled**: Forces secure connections  
✅ **Privacy Controls**: Referrer policy limits data leakage  
✅ **No Unsafe Features**: Plugins, geolocation, camera blocked  
✅ **XSS Protection**: Multiple layers of XSS prevention  
✅ **Clickjacking Prevention**: Frame-ancestors restricted  

### Security Scanning
The site should pass:
- SSL Labs (A+ rating)
- Mozilla Observatory (A+ rating)
- Security Headers (A+ rating)
- OWASP ZAP scans
- Corporate firewall/proxy inspections

## Deployment Checklist

### Before Production Deployment
- [ ] Verify HTTPS is enabled
- [ ] Test CSP doesn't block legitimate resources
- [ ] Confirm Google OAuth works
- [ ] Check CORS allows production domain
- [ ] Validate all API endpoints require auth
- [ ] Test with corporate proxy/firewall
- [ ] Run security header scanner
- [ ] Verify no console errors in production build

### Environment Variables
Required for production:
```bash
# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_ALLOWED_DOMAIN=<your-company-domain>

# Cosmos DB
COSMOS_ENDPOINT=<your-cosmos-endpoint>
COSMOS_KEY=<stored-in-key-vault>
COSMOS_DATABASE_NAME=CreedaVA

# CORS
CORS_ORIGIN=https://creedava.com
APP_ORIGIN=https://creedava.com
```

## Monitoring & Alerts

### Security Monitoring
- Monitor failed auth attempts (`api/shared/auth.js` logs)
- Track CSP violation reports (if configured)
- Alert on unusual API access patterns
- Monitor Cosmos DB access logs

### Recommended Tools
- Azure Application Insights (errors & performance)
- Azure Monitor (infrastructure)
- Google Analytics (user behavior, optional)
- CSP violation reporting (future enhancement)

## Known Limitations

### CSP Inline Scripts
- React requires `'unsafe-inline'` for styles (Tailwind)
- Vite dev mode requires `'unsafe-eval'`
- Production build minimizes inline scripts

### Third-Party Services
- Google OAuth requires frame-src exception
- Analytics requires script-src exception
- Consider removing GA4 in high-security deployments

## Security Hardening (Future)

### Recommended Enhancements
1. **Subresource Integrity (SRI)**: Add integrity hashes to external scripts
2. **CSP Reporting**: Configure report-uri for violation monitoring
3. **Certificate Pinning**: Pin expected TLS certificates
4. **Rate Limiting**: Add API rate limits to prevent abuse
5. **WAF**: Deploy Azure Web Application Firewall
6. **Secrets Rotation**: Automate key rotation via Key Vault
7. **MFA**: Add multi-factor auth for admin users
8. **Audit Logging**: Log all admin actions to immutable store
9. **Vulnerability Scanning**: Automate dependency scanning in CI/CD

## Testing Security

### Manual Tests
```bash
# Check security headers
curl -I https://creedava.com

# Test CSP
# Open browser console, should see no CSP violations

# Test HSTS
# First visit should add to HSTS cache
# Subsequent HTTP requests auto-redirect to HTTPS

# Test CORS
curl -H "Origin: https://evil.com" \
  https://creedava.com/api/health
# Should not return Access-Control-Allow-Origin
```

### Automated Scanning
```bash
# Install Mozilla Observatory CLI
npm install -g observatory-cli

# Scan your site
observatory creedava.com

# SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=creedava.com
```

## Incident Response

### If Security Issue Detected
1. Document the issue (what, when, impact)
2. Assess data exposure risk
3. Rotate credentials if compromised
4. Apply patches/fixes
5. Deploy to production
6. Monitor for continued issues
7. Post-mortem analysis

### Emergency Contacts
- Azure Support: [Azure Portal](https://portal.azure.com)
- Security Team: [Add your team contact]

## Additional Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Azure Security Best Practices](https://learn.microsoft.com/azure/security/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
