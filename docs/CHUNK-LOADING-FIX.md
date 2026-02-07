# Fixing "Failed to fetch dynamically imported module" Error

## Problem
The error "Failed to fetch dynamically imported module" occurs when:
1. **Base path mismatch**: Vite builds with one base path but deploys to another
2. **Stale browser cache**: Old chunks referenced in HTML but files changed
3. **Network issues**: Temporary connection problems during chunk loading

## Root Cause (in this project)
The app was building with `base: '/CreedaVA/'` (default) but deploying to `creedava.com` (root `/`), causing chunk URLs to be incorrect:
- Built expects: `https://creedava.com/CreedaVA/assets/js/Services-abc123.js`
- Actually at: `https://creedava.com/assets/js/Services-abc123.js`

## Solution Applied

### 1. Fixed Default Base Path
Changed `vite.config.ts` to default to `/` instead of `/CreedaVA/`:
```typescript
const base = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/'
```

### 2. Environment-Specific Configuration
- **Production** (`.env.production`): `VITE_BASE_PATH=/` ✅ 
- **GitHub Pages** (`.env.github-pages`): `VITE_BASE_PATH=/CreedaVA/` ✅
- **Local dev**: Uses Vite defaults (typically `/`)

### 3. Retry Logic Already Implemented
The `lazyWithRetry` utility already handles:
- 3 retry attempts with exponential backoff
- Automatic cache clearing on persistent failures
- Forced page reload to fetch fresh chunks

## Deployment Checklist

### For creedava.com (Azure/Custom Domain)
```bash
# 1. Build with correct base path
VITE_BASE_PATH=/ npm run build

# 2. Or use production env file
npm run build  # Automatically uses .env.production

# 3. Verify dist/index.html has correct paths
cat dist/index.html | grep 'src="/assets'  # Should be /assets, not /CreedaVA/assets
```

### For GitHub Pages (github.io/CreedaVA)
```bash
# Build with repository path
VITE_BASE_PATH=/CreedaVA/ npm run build

# Or use the GitHub Pages env file
cp .env.github-pages .env.production
npm run build
```

## Verification Steps

1. **Check build output**:
   ```bash
   # After build, verify index.html uses correct paths
   grep -E '(href|src)=' dist/index.html
   ```

2. **Test locally** (simulates production):
   ```bash
   npm run build
   npm run preview
   # Should open at http://localhost:4173
   # Navigate to /services and other routes
   ```

3. **Check deployed site**:
   - Open DevTools Console
   - Navigate to different pages (Services, About, Admin, etc.)
   - Should see NO "Failed to fetch" errors
   - Chunks should load from correct paths

## Quick Fix for Immediate Relief

If you need immediate relief without rebuilding:

1. **Clear browser cache**: Hard refresh (`Ctrl+Shift+R` / `Cmd+Shift+R`)
2. **Clear all site data**: DevTools > Application > Clear storage
3. **Try incognito/private mode**: Bypasses all caching

## For Future Deployments

Always set `VITE_BASE_PATH` in CI/CD:

### Azure Static Web Apps Workflow
```yaml
- name: Build
  env:
    VITE_BASE_PATH: /
    VITE_API_BASE_URL: https://creedava.com/api
  run: npm run build
```

### GitHub Pages Workflow
```yaml
- name: Build
  env:
    VITE_BASE_PATH: /CreedaVA/
    VITE_API_BASE_URL: https://wiickedawesome.github.io/CreedaVA/api
  run: npm run build
```

## Testing the Fix

1. Rebuild with new config:
   ```bash
   npm run build
   ```

2. Test locally:
   ```bash
   npm run preview
   ```

3. Deploy and verify all routes load chunks correctly

## Related Files
- `vite.config.ts`: Base path configuration
- `src/utils/lazyWithRetry.ts`: Chunk retry logic
- `.env.production`: Production environment vars
- `public/staticwebapp.config.json`: Azure SWA routing
