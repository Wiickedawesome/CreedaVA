// Azure Cosmos DB tracking via Azure Functions
const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface TrackingEvent {
  eventType: string;
  eventData?: Record<string, any>;
  page?: string;
}

// Session management
function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionId);
    sessionStorage.setItem('sessionStart', new Date().toISOString());
  }
  return sessionId;
}

function isReturningVisitor(): boolean {
  const hasVisited = localStorage.getItem('hasVisited');
  if (!hasVisited) {
    localStorage.setItem('hasVisited', 'true');
    localStorage.setItem('firstVisit', new Date().toISOString());
    return false;
  }
  return true;
}

// Extract UTM parameters from URL
function getUTMParameters(): Record<string, string | null> {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  };
}

// Get device info
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    deviceType = 'mobile';
  }
  
  return {
    deviceType,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    language: navigator.language,
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

// Track to Google Analytics (if available)
function sendToGA(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
  }
}

/**
 * Track custom events in Cosmos DB AND Google Analytics
 */
export async function trackCosmosEvent(event: TrackingEvent) {
  try {
    const sessionId = getOrCreateSessionId();
    const isReturning = isReturningVisitor();
    const utm = getUTMParameters();
    const device = getDeviceInfo();
    
    const payload = {
      ...event,
      page: event.page || window.location.pathname,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
      sessionId,
      isReturningVisitor: isReturning,
      ...utm,
      ...device,
    };

    // Send to Cosmos DB
    await fetch(`${API_URL}/trackEvent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    // Send same event to Google Analytics
    sendToGA(event.eventType, {
      ...event.eventData,
      page_path: event.page || window.location.pathname,
      session_id: sessionId,
      is_returning: isReturning,
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

// Track time on page
let pageStartTime = Date.now();
let maxScrollDepth = 0;

function trackScrollDepth() {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY || window.pageYOffset;
  const scrollPercent = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
  
  if (scrollPercent > maxScrollDepth) {
    maxScrollDepth = scrollPercent;
  }
}

// Track scroll depth every 500ms
if (typeof window !== 'undefined') {
  setInterval(trackScrollDepth, 500);
  
  // Track scroll milestones (like GA4)
  const scrollMilestones = [25, 50, 75, 90];
  const trackedScrollMilestones = new Set<number>();
  
  const checkScrollMilestones = () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || window.pageYOffset;
    const scrollPercent = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
    
    scrollMilestones.forEach(milestone => {
      if (scrollPercent >= milestone && !trackedScrollMilestones.has(milestone)) {
        trackedScrollMilestones.add(milestone);
        trackCosmosEvent({
          eventType: 'scroll',
          eventData: {
            percent_scrolled: milestone,
          },
        });
      }
    });
  };
  
  window.addEventListener('scroll', checkScrollMilestones, { passive: true });
  
  // Track user engagement after 10 seconds (like GA4)
  let engagementTracked = false;
  setTimeout(() => {
    if (!engagementTracked) {
      engagementTracked = true;
      trackCosmosEvent({
        eventType: 'user_engagement',
        eventData: {
          engagement_time_msec: 10000,
        },
      });
    }
  }, 10000);
}

// Initialize session tracking on load
if (typeof window !== 'undefined') {
  // Track session_start on new sessions
  const sessionId = getOrCreateSessionId();
  const sessionStart = sessionStorage.getItem('sessionStartTracked');
  
  if (!sessionStart) {
    sessionStorage.setItem('sessionStartTracked', 'true');
    trackCosmosEvent({
      eventType: 'session_start',
      eventData: {
        session_id: sessionId,
      },
    });
  }
  
  // Track first_visit for new visitors
  const hasVisited = localStorage.getItem('hasVisited');
  if (!hasVisited) {
    trackCosmosEvent({
      eventType: 'first_visit',
      eventData: {
        first_visit_time: new Date().toISOString(),
      },
    });
  }
}

/**
 * Track page views (excludes admin pages)
 */
export function trackPageView(pagePath?: string) {
  const path = pagePath || window.location.pathname;
  
  // Track time spent on previous page before navigating
  if (pageStartTime) {
    const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000); // seconds
    if (timeOnPage > 1) { // Only track if more than 1 second
      trackCosmosEvent({
        eventType: 'page_exit',
        eventData: {
          timeOnPage,
          maxScrollDepth,
        },
      });
    }
  }
  
  // Reset for new page
  pageStartTime = Date.now();
  maxScrollDepth = 0;
  
  // Track all pages (like Google Analytics)
  trackCosmosEvent({
    eventType: 'page_view',
    page: path,
    eventData: {
      title: document.title,
      url: window.location.href,
    },
  });
  
  // Also send to Google Analytics page_view
  if (typeof window.gtag === 'function') {
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-0EPSFYFWZQ', {
      page_path: path,
      page_title: document.title,
    });
  }
}

/**
 * Track button clicks
 */
export function trackButtonClick(buttonName: string, context?: Record<string, any>) {
  trackCosmosEvent({
    eventType: 'button_click',
    eventData: {
      buttonName,
      ...context,
    },
  });
  
  // Send to GA as well
  sendToGA('click', {
    button_name: buttonName,
    ...context,
  });
}

/**
 * Track form start (when user first interacts with form)
 */
export function trackFormStart(formName: string, context?: Record<string, any>) {
  trackCosmosEvent({
    eventType: 'form_start',
    eventData: {
      formName,
      ...context,
    },
  });
  
  // Send to GA
  sendToGA('form_start', {
    form_name: formName,
    ...context,
  });
}

/**
 * Track form submissions
 */
export function trackFormSubmission(formName: string, success: boolean, context?: Record<string, any>) {
  trackCosmosEvent({
    eventType: 'form_submit',
    eventData: {
      formName,
      success,
      ...context,
    },
  });
  
  // Send to GA
  sendToGA('form_submit', {
    form_name: formName,
    success,
    ...context,
  });
}

/**
 * Track custom conversion events
 */
export function trackConversion(conversionType: string, value?: number, context?: Record<string, any>) {
  trackCosmosEvent({
    eventType: 'conversion',
    eventData: {
      conversionType,
      value,
      ...context,
    },
  });
  
  // Send to GA as conversion event
  sendToGA('conversion', {
    conversion_type: conversionType,
    value,
    currency: 'USD',
    ...context,
  });
}

/**
 * Track outbound links
 */
export function trackOutboundLink(url: string, linkText?: string) {
  trackCosmosEvent({
    eventType: 'outbound_click',
    eventData: {
      url,
      linkText,
    },
  });
  
  sendToGA('click', {
    link_url: url,
    link_text: linkText,
    outbound: true,
  });
}

/**
 * Track downloads
 */
export function trackDownload(fileName: string, fileType?: string) {
  trackCosmosEvent({
    eventType: 'download',
    eventData: {
      fileName,
      fileType,
    },
  });
  
  sendToGA('file_download', {
    file_name: fileName,
    file_extension: fileType,
  });
}

/**
 * Submit contact form to Cosmos DB
 */
export async function submitContactForm(formData: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  service?: string;
}) {
  try {
    const response = await fetch(`${API_URL}/submitContact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    
    // Track the form submission
    trackFormSubmission('contact_form', result.success, {
      service: formData.service,
    });

    return result;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    trackFormSubmission('contact_form', false);
    throw error;
  }
}
