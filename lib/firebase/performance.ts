/**
 * Firebase Performance Monitoring — track real-user web vitals.
 *
 * Auto-instruments page loads, network requests, and Core Web Vitals
 * (LCP, FID, CLS, INP, TTFB). Also provides custom trace helpers
 * for measuring specific operations (AI generation, data fetches, etc.).
 *
 * Prerequisites:
 *   1. Enable Performance Monitoring in Firebase Console
 *
 * @see https://firebase.google.com/docs/perf-mon/get-started-web
 */

import {
  getPerformance,
  trace as createTrace,
  type FirebasePerformance,
  type PerformanceTrace,
} from "firebase/performance";
import { app } from "./config";

let _perf: FirebasePerformance | null = null;

/**
 * Initialize Performance Monitoring.
 * Call once from a client-side component. Safe to call multiple times.
 * Auto-instruments page loads and network requests.
 */
export function initializePerformance(): FirebasePerformance | null {
  if (typeof window === "undefined") return null;
  if (_perf) return _perf;

  try {
    _perf = getPerformance(app);
    return _perf;
  } catch (error) {
    console.warn("[Performance] Failed to initialize:", error);
    return null;
  }
}

/**
 * Start a custom performance trace.
 * Use for measuring specific operations like AI generation, API calls, etc.
 *
 * @example
 * const t = startTrace("ai_content_generation");
 * if (t) {
 *   t.putAttribute("type", "blog_post");
 *   // ... do work ...
 *   t.stop();
 * }
 */
export function startTrace(traceName: string): PerformanceTrace | null {
  const perf = _perf ?? initializePerformance();
  if (!perf) return null;

  try {
    const t = createTrace(perf, traceName);
    t.start();
    return t;
  } catch (error) {
    console.warn(`[Performance] Failed to start trace "${traceName}":`, error);
    return null;
  }
}

/**
 * Measure an async operation with a custom trace.
 * Automatically starts and stops the trace, and records errors.
 *
 * @example
 * const result = await measureAsync("fetch_leads", async () => {
 *   return fetchAll<Lead>("leads");
 * });
 */
export async function measureAsync<T>(
  traceName: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string>,
): Promise<T> {
  const t = startTrace(traceName);

  if (attributes && t) {
    for (const [key, value] of Object.entries(attributes)) {
      t.putAttribute(key, value);
    }
  }

  try {
    const result = await fn();
    t?.putAttribute("status", "success");
    t?.stop();
    return result;
  } catch (error) {
    t?.putAttribute("status", "error");
    t?.putAttribute("error", String(error));
    t?.stop();
    throw error;
  }
}
