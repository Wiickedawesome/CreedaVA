// Cosmos DB tracking via Azure Functions
const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface TrackingEvent {
  eventType: string;
  eventData?: Record<string, any>;
  page?: string;
}

/**
 * Track custom events in Cosmos DB
 */
export async function trackCosmosEvent(event: TrackingEvent) {
  try {
    const payload = {
      ...event,
      page: event.page || window.location.pathname,
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
    };

    await fetch(`${API_URL}/trackEvent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Track page views
 */
export function trackPageView(pagePath?: string) {
  const path = pagePath || window.location.pathname;
  
  trackCosmosEvent({
    eventType: 'page_view',
    page: path,
    eventData: {
      title: document.title,
    },
  });
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
}

/**
 * Track form submissions
 */
export function trackFormSubmission(formName: string, success: boolean, context?: Record<string, any>) {
  trackCosmosEvent({
    eventType: 'form_submission',
    eventData: {
      formName,
      success,
      ...context,
    },
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
