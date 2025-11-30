// Google Analytics 4 integration
// Only loads when VITE_GA_MEASUREMENT_ID is set

export function initializeGA() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  if (!measurementId) {
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: true
  });

  console.log('Google Analytics initialized:', measurementId);
}

// Track custom events
export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
}

// Track page views (for SPA navigation)
export function trackPageView(path: string) {
  if (typeof window.gtag === 'function') {
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
      page_path: path
    });
  }
}
