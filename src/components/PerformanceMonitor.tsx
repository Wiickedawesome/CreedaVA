import { useEffect } from 'react';

/**
 * Performance monitoring component that reports Web Vitals
 * Only logs in development, silent in production
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development
    if (import.meta.env.DEV) {
      // Monitor Core Web Vitals
      if ('PerformanceObserver' in window) {
        try {
          // Largest Contentful Paint (LCP)
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
          });
          lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true } as any);

          // First Input Delay (FID)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              console.log('FID:', entry.processingStart - entry.startTime);
            });
          });
          fidObserver.observe({ type: 'first-input', buffered: true } as any);

          // Cumulative Layout Shift (CLS)
          let clsScore = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsScore += entry.value;
              }
            });
            console.log('CLS:', clsScore);
          });
          clsObserver.observe({ type: 'layout-shift', buffered: true } as any);
        } catch (e) {
          // Silently fail if PerformanceObserver is not fully supported
        }
      }
    }
  }, []);

  return null;
}
