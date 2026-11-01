/**
 * Firebase Remote Config — change app behavior without deploying.
 *
 * Provides typed access to remote configuration values with sensible defaults.
 * Values are fetched and cached client-side. Changes in the Firebase Console
 * take effect on the next fetch (default: every 12 hours, or on page reload).
 *
 * Use cases:
 *   - Feature flags (toggle AI features, forum, etc.)
 *   - A/B test CTA copy and packages section layout
 *   - Switch AI model versions without redeployment
 *   - Adjust scheduling/availability windows
 *
 * @see https://firebase.google.com/docs/remote-config/get-started?platform=web
 */

import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
  type RemoteConfig,
} from "firebase/remote-config";
import { app } from "./config";

// ─── Default values ──────────────────────────────────
// These are used when Remote Config hasn't fetched yet or the key is missing.
// Add new feature flags and config values here.

const DEFAULTS = {
  // Feature flags
  feature_ai_enabled: true,
  feature_forum_enabled: true,
  feature_blog_translations: true,
  feature_satisfaction_survey: true,
  feature_live_chat: false,

  // AI configuration
  ai_model: "gemini-2.5-flash",
  ai_max_tokens: 8192,

  // Marketing / CTA
  cta_hero_text: "Get Started Today",
  cta_hero_subtext: "Save time, reduce costs, and scale your operations.",
  cta_packages_text: "View Packages",

  // Scheduling
  booking_lead_time_hours: 24,
  booking_max_advance_days: 60,

  // Locales
  supported_locales: "en,es",
} as const;

export type RemoteConfigKey = keyof typeof DEFAULTS;

// ─── Singleton ───────────────────────────────────────

let _rc: RemoteConfig | null = null;
let _activated = false;

function getRC(): RemoteConfig | null {
  if (typeof window === "undefined") return null;
  if (_rc) return _rc;

  _rc = getRemoteConfig(app);

  // In development, use a short fetch interval for faster iteration.
  // In production, default is 12 hours (43200 seconds).
  _rc.settings.minimumFetchIntervalMillis =
    process.env.NODE_ENV === "development" ? 10_000 : 43_200_000;

  _rc.defaultConfig = DEFAULTS as Record<string, string | number | boolean>;

  return _rc;
}

// ─── Public API ──────────────────────────────────────

/**
 * Fetch and activate remote config values.
 * Call once at app startup (e.g., in a client-side layout or provider).
 * Returns true if new values were fetched.
 */
export async function activateRemoteConfig(): Promise<boolean> {
  const rc = getRC();
  if (!rc) return false;
  if (_activated) return false;

  try {
    const fetched = await fetchAndActivate(rc);
    _activated = true;
    return fetched;
  } catch (error) {
    console.warn("[Remote Config] Failed to fetch:", error);
    _activated = true; // Use defaults
    return false;
  }
}

/** Get a string value from Remote Config */
export function getConfigString(key: RemoteConfigKey): string {
  const rc = getRC();
  if (!rc) return String(DEFAULTS[key]);
  return getValue(rc, key).asString();
}

/** Get a number value from Remote Config */
export function getConfigNumber(key: RemoteConfigKey): number {
  const rc = getRC();
  if (!rc) return Number(DEFAULTS[key]);
  return getValue(rc, key).asNumber();
}

/** Get a boolean value from Remote Config */
export function getConfigBoolean(key: RemoteConfigKey): boolean {
  const rc = getRC();
  if (!rc) return Boolean(DEFAULTS[key]);
  return getValue(rc, key).asBoolean();
}

/** Check whether a feature flag is enabled */
export function isFeatureEnabled(
  flag:
    | "feature_ai_enabled"
    | "feature_forum_enabled"
    | "feature_blog_translations"
    | "feature_satisfaction_survey"
    | "feature_live_chat",
): boolean {
  return getConfigBoolean(flag);
}

/**
 * Get the list of supported locales from Remote Config.
 * Returns an array like ["en", "es"].
 */
export function getSupportedLocales(): string[] {
  return getConfigString("supported_locales")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
}
