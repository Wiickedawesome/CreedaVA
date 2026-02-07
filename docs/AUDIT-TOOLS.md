# Audit Tools - Quick Reference

## Overview

Two automated audit tools help catch configuration mistakes and code issues before they reach production:

1. **Configuration Audit** (`audit-config.sh`) - Checks configuration, env vars, CORS, SEO
2. **Deep Code Audit** (`deep-audit.cjs`) - Analyzes code for anti-patterns and common mistakes

## Usage

```bash
# Run both audits
npm run audit:all

# Run configuration audit only
npm run audit:config

# Run code audit only
npm run audit
```

## What Gets Checked

### Configuration Audit (audit-config.sh)

✅ **API Filters** - Detects blocking logic that filters out important pages
✅ **Environment Setup** - Validates .env files and configuration
✅ **Hardcoded URLs** - Finds localhost URLs and hardcoded endpoints
✅ **SEO Configuration** - Checks robots.txt, sitemap, meta tags
✅ **Analytics Setup** - Verifies GA4 and custom tracking
✅ **Database Patterns** - Cosmos DB partition keys and type fields
✅ **Authentication** - Google OAuth, CORS, dev tokens
✅ **API Naming** - CRUD endpoint consistency
✅ **Error Handling** - try-catch blocks in endpoints
✅ **Build Setup** - TypeScript config, build scripts

### Deep Code Audit (deep-audit.cjs)

🔍 **Blocking Filters** - Early returns that might hide functionality
🔍 **Hardcoded URLs** - localhost references in production code
🔍 **Missing Error Handling** - Async functions without try-catch
🔍 **Debug Code** - console.log in production
🔍 **Fetch Errors** - API calls without .catch()
🔍 **CORS Headers** - Missing headers in API responses
🔍 **Cosmos DB** - Missing partition keys or type fields
🔍 **Environment Variables** - Missing fallbacks
🔍 **SEO Components** - Pages missing <SEO> tags
🔍 **GA4 Events** - Improper event naming patterns
🔍 **Authorization** - Protected endpoints without checks

## Common Issues Found

### Issue: Admin Pages Filtered Out

**Symptom:** Admin analytics not showing up in Cosmos DB
**Detection:** Config audit finds `if (page.startsWith('/admin')) return`
**Fix:** Remove the blocking filter

### Issue: Hardcoded localhost URLs

**Symptom:** Production code breaks when deployed
**Detection:** Code audit finds `http://localhost:7071` in src/
**Fix:** Use `import.meta.env.VITE_API_BASE_URL` or centralized config

### Issue: Missing SEO Components

**Symptom:** Pages don't show in search results properly
**Detection:** Code audit finds pages without `<SEO>` component
**Fix:** Add `<SEO title="..." description="..." />` to each page

### Issue: Cosmos DB Partition Key Missing

**Symptom:** 400 errors when querying Cosmos DB
**Detection:** Code audit finds `container.item(id)` without partition key
**Fix:** Use `container.item(id, partitionKeyValue)`

### Issue: Missing Error Handling

**Symptom:** Unhandled promise rejections crash the app
**Detection:** Code audit finds async functions without try-catch
**Fix:** Wrap async code in try-catch blocks

## Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run Configuration Audit
  run: npm run audit:config

- name: Run Code Quality Audit  
  run: npm run audit
```

## Exit Codes

- `0` - All checks passed
- `1` - Errors found (should block deployment)
- `0 with warnings` - Warnings found (review recommended)

## Example Output

```
╔═══════════════════════════════════════════════════════════════╗
║              CreedaVA Configuration Audit Report              ║
╚═══════════════════════════════════════════════════════════════╝

━━━ 1. API Endpoint Filters & Blocking Logic ━━━
✓ No blocking admin filters in API
✓ No blocking filters in frontend tracking

━━━ 2. Environment Configuration ━━━
✓ api/local.settings.json exists
✓ CORS_ORIGIN configured
⚠ WARNING: DEV_MODE enabled in .env

━━━ Summary ━━━
✓ Passed:   15
⚠ Warnings: 1
✗ Errors:   0
```

## False Positives

Some warnings may be intentional:

- **console.log in logger.js** - Logging utilities need console
- **localhost in tests** - Test files can reference localhost
- **Dev tokens in DevMode** - Development utilities are fine

Review warnings and suppress false positives by adding comments:
```typescript
// audit:ignore - intentional for development
console.log('Debug output');
```

## Maintenance

Run audits:
- ✅ Before every commit (pre-commit hook)
- ✅ In CI/CD pipeline
- ✅ Before deploying to production
- ✅ Weekly as part of code review

## Adding New Checks

To add a new check to `deep-audit.cjs`:

```javascript
// Check for specific pattern
if (line.includes('YOUR_PATTERN')) {
  warning('Your warning message', relPath, lineNum);
}
```

To add a new check to `audit-config.sh`:

```bash
section "Your Check Name"
if [ condition ]; then
  error "Your error message"
fi
```

## Quick Fixes

Common issues and their fixes:

| Issue | Command | Fix |
|-------|---------|-----|
| Missing SEO | Find pages | Add `<SEO>` component |
| Hardcoded URLs | Find & replace | Use env vars |
| Missing try-catch | Wrap async | Add error handling |
| Console.log | Remove/replace | Use proper logging |
| Missing partition key | Update queries | Add 2nd parameter |

## Support

If you encounter false positives or need to add new checks:
1. Review the audit script code
2. Add exceptions if needed
3. Update this documentation
4. Consider contributing improvements

---

**Remember:** The audit tools are your safety net. Run them often! 🛡️
