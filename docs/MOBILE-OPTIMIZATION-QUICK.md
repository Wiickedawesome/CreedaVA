# Mobile Optimization Quick Reference

## Quick Wins Checklist ✅

Use this checklist when adding new features to maintain mobile performance.

### Images
- [ ] Use WebP format
- [ ] Use `<LazyImage>` component for below-fold images
- [ ] Add `fetchpriority="high"` for LCP image
- [ ] Provide responsive sizes for different viewports
- [ ] Keep images under 200KB (compressed)

### Components
- [ ] Lazy load with `React.lazy()` if > 50KB
- [ ] Use `useOptimizedMotion()` for animations
- [ ] Wrap in `<Suspense>` with fallback
- [ ] Add `loading` states for async content
- [ ] Keep bundle chunks under 100KB

### CSS
- [ ] Use GPU-accelerated properties (`transform`, `opacity`)
- [ ] Avoid `box-shadow` on scrolling elements
- [ ] Use `will-change` sparingly (only during animations)
- [ ] Test with `prefers-reduced-motion`
- [ ] Keep critical CSS under 15KB

### JavaScript
- [ ] Defer non-critical scripts
- [ ] Use `useCallback` and `useMemo` for expensive operations
- [ ] Debounce scroll/resize handlers
- [ ] Keep main thread idle for input responsiveness
- [ ] Remove console.logs (automatically stripped in production)

### API Calls
- [ ] Implement loading states
- [ ] Add error boundaries
- [ ] Cache responses appropriately
- [ ] Use debouncing for search/autocomplete
- [ ] Keep payloads under 100KB

## Common Patterns

### Lazy Load a Component
```tsx
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-64 w-full" />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

### Optimized Animation
```tsx
import { motion } from 'framer-motion'
import { useOptimizedMotion, mobileOptimizedVariants } from '@/hooks/useOptimizedMotion'

function AnimatedCard() {
  const { shouldAnimate } = useOptimizedMotion()
  
  return (
    <motion.div
      variants={mobileOptimizedVariants.slideUp}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
    >
      Content
    </motion.div>
  )
}
```

### Lazy Load Image
```tsx
import { LazyImage } from '@/utils/lazyImage'

function ImageGallery() {
  return (
    <LazyImage 
      src="/images/large-image.webp"
      alt="Description"
      className="w-full h-auto"
    />
  )
}
```

### Responsive Image
```tsx
import { useResponsiveImage } from '@/utils/lazyImage'

function Hero() {
  const heroImage = useResponsiveImage('/hero.webp', {
    mobile: '/hero-mobile.webp',
    tablet: '/hero-tablet.webp',
    desktop: '/hero-desktop.webp'
  })
  
  return <img src={heroImage} alt="Hero" />
}
```

### Debounced Search
```tsx
import { useState, useCallback } from 'react'
import { debounce } from '@/lib/utils'

function Search() {
  const [results, setResults] = useState([])
  
  const handleSearch = useCallback(
    debounce(async (query: string) => {
      const data = await fetch(`/api/search?q=${query}`)
      setResults(await data.json())
    }, 300),
    []
  )
  
  return (
    <input 
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

## Performance Testing

### Local Testing
```bash
# Build and preview production bundle
npm run build
npm run preview

# Open in Chrome DevTools
# - Navigate to Lighthouse tab
# - Select "Mobile" device
# - Enable "Simulated throttling"
# - Run audit
```

### Target Metrics (Mobile)
- **FCP**: < 1.8s
- **LCP**: < 2.5s
- **TBT**: < 300ms
- **CLS**: < 0.1
- **Performance Score**: > 90

### Quick Lighthouse Test
```bash
# Install Lighthouse CLI
npm install -g @lhci/cli

# Run lighthouse (ensure preview server is running)
lhci autorun --collect.url=http://localhost:4173 --collect.numberOfRuns=3
```

## Common Issues & Fixes

### Issue: Large Bundle Size
**Symptoms**: Lighthouse shows "Reduce JavaScript execution time"
**Fix**: 
1. Check bundle analyzer: `npm run build -- --analyze`
2. Lazy load large components
3. Check for duplicate dependencies

### Issue: Images Loading Slowly
**Symptoms**: Poor LCP score
**Fix**:
1. Convert to WebP format
2. Use responsive images
3. Add `fetchpriority="high"` to LCP image
4. Preload critical images

### Issue: Layout Shifts
**Symptoms**: Poor CLS score
**Fix**:
1. Add explicit width/height to images
2. Reserve space for dynamic content
3. Avoid injecting content above existing content

### Issue: Slow Time to Interactive
**Symptoms**: Poor TTI score
**Fix**:
1. Reduce JavaScript execution
2. Code split by route
3. Defer non-critical scripts
4. Remove unused dependencies

### Issue: Long Cache Times
**Symptoms**: Users see old content
**Fix**:
1. Check service worker version in `sw.js`
2. Clear cache: Increment `CACHE_VERSION`
3. Hard refresh: Ctrl+Shift+R

## Performance Budget

Don't exceed these limits:

| Resource | Budget | Current |
|----------|--------|---------|
| Initial JS | 120KB | ~105KB ✅ |
| Initial CSS | 25KB | ~18KB ✅ |
| Fonts | 50KB | ~45KB ✅ |
| Images (above fold) | 150KB | ~85KB ✅ |
| Total (first visit) | 500KB | ~420KB ✅ |
| Total Requests | 40 | ~28 ✅ |

## Optimization Commands

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for unused dependencies
npm run cleanup

# Format code
npm run format

# Deep audit (performance + security)
npm run audit:all

# Build for production
npm run build:production
```

## Resources

- 📊 [Bundle Analyzer](https://www.npmjs.com/package/rollup-plugin-visualizer)
- 🎯 [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- 📱 [Mobile Testing Tools](https://www.browserstack.com/)
- 🚀 [Web.dev Performance](https://web.dev/fast/)
- 📖 [Full Documentation](./MOBILE-OPTIMIZATION.md)

---

**Pro Tip**: Run Lighthouse audits on every PR to catch performance regressions early!
