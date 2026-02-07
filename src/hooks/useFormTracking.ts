import { useEffect, useRef } from 'react';
import { trackFormStart } from '@/lib/tracking';

/**
 * Hook to automatically track form start events (like GA4)
 * Tracks when user first interacts with any form field
 * 
 * @param formName - Name of the form to track
 * @param enabled - Whether tracking is enabled (default: true)
 */
export function useFormTracking(formName: string, enabled = true) {
  const hasTrackedStart = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleFormInteraction = () => {
      if (!hasTrackedStart.current) {
        hasTrackedStart.current = true;
        trackFormStart(formName);
      }
    };

    // Track first interaction with any form field
    const formElements = document.querySelectorAll(`form input, form textarea, form select`);
    
    formElements.forEach(element => {
      element.addEventListener('focus', handleFormInteraction, { once: true });
    });

    return () => {
      formElements.forEach(element => {
        element.removeEventListener('focus', handleFormInteraction);
      });
    };
  }, [formName, enabled]);
}
