/**
 * Firestore-based website analytics.
 *
 * Collection: "analytics"
 * Security rules: public create, admin read (already deployed).
 *
 * Each document represents a single tracked event (page_view, button_click,
 * form_submission, etc.) with optional geolocation from the browser
 * Geolocation API or a free IP-geo service.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import { logGA4Event } from "./config";

// ─── Types ───────────────────────────────────────────

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  page: string;
  timestamp: string;
  sessionId?: string;
  country?: string;
  countryName?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: string;
  longitude?: string;
  referrer?: string;
  userAgent?: string;
  eventData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsSummary {
  totalEvents: number;
  uniquePages: number;
  eventTypes: Record<string, number>;
}

// ─── Session ID ──────────────────────────────────────

let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  if (typeof window !== "undefined") {
    _sessionId =
      sessionStorage.getItem("creedava_session") ||
      `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("creedava_session", _sessionId);
  } else {
    _sessionId = `ssr_${Date.now()}`;
  }
  return _sessionId;
}

// ─── Geo lookup (free, no API key) ───────────────────

interface GeoData {
  country?: string;
  countryName?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: string;
  longitude?: string;
}

let _geoCache: GeoData | null = null;

async function getGeoData(): Promise<GeoData> {
  if (_geoCache) return _geoCache;
  try {
    // ipapi.co free tier — 1 000 req/day, no key required
    const res = await fetch("https://ipapi.co/json/", { cache: "force-cache" });
    if (!res.ok) throw new Error("geo lookup failed");
    const data = await res.json();
    _geoCache = {
      country: data.country_code || undefined,
      countryName: data.country_name || undefined,
      region: data.region || undefined,
      city: data.city || undefined,
      timezone: data.timezone || undefined,
      latitude: data.latitude?.toString() || undefined,
      longitude: data.longitude?.toString() || undefined,
    };
  } catch {
    _geoCache = {};
  }
  return _geoCache;
}

// ─── Track Event (write) ─────────────────────────────

export async function trackEvent(
  eventType: string,
  page?: string,
  eventData?: Record<string, unknown>,
): Promise<void> {
  if (typeof window === "undefined") return; // SSR guard
  try {
    // Fire GA4 event in parallel (non-blocking)
    logGA4Event(eventType, { page: page || window.location.pathname, ...eventData });

    const geo = await getGeoData();
    // Firestore rejects `undefined` field values; build the doc conditionally
    // and only include optional strings when they have content.
    const ref = typeof document !== "undefined" ? document.referrer : "";
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    await addDoc(collection(db, "analytics"), {
      eventType,
      page: page || window.location.pathname,
      timestamp: serverTimestamp(),
      sessionId: getSessionId(),
      ...(ref ? { referrer: ref } : {}),
      ...(ua ? { userAgent: ua } : {}),
      ...geo,
      ...(eventData ? { eventData } : {}),
    });
  } catch (err) {
    // Silently fail — analytics should never break the app
    console.warn("Analytics track failed:", err);
  }
}

// ─── Fetch Events (read — admin only) ────────────────

export async function fetchAnalyticsEvents(
  days: number = 30,
): Promise<{ events: AnalyticsEvent[]; summary: AnalyticsSummary }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffTs = Timestamp.fromDate(cutoff);

  const q = query(
    collection(db, "analytics"),
    where("timestamp", ">=", cutoffTs),
    orderBy("timestamp", "desc"),
  );

  const snapshot = await getDocs(q);

  const events: AnalyticsEvent[] = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      eventType: d.eventType || "unknown",
      page: d.page || "/",
      timestamp: d.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      sessionId: d.sessionId,
      country: d.country,
      countryName: d.countryName,
      region: d.region,
      city: d.city,
      timezone: d.timezone,
      latitude: d.latitude,
      longitude: d.longitude,
      referrer: d.referrer,
      userAgent: d.userAgent,
      eventData: d.eventData,
      metadata: d.metadata,
    };
  });

  // Compute summary
  const eventTypes: Record<string, number> = {};
  const pages = new Set<string>();
  events.forEach((e) => {
    eventTypes[e.eventType] = (eventTypes[e.eventType] || 0) + 1;
    pages.add(e.page);
  });

  return {
    events,
    summary: {
      totalEvents: events.length,
      uniquePages: pages.size,
      eventTypes,
    },
  };
}
