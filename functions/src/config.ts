/**
 * Centralized configuration constants for Cloud Functions.
 * Single source of truth for regions, timezones, and shared values.
 */

export const CONFIG = {
  /** Default region for all Cloud Functions */
  REGION: "us-east4" as const,

  /** Timezone for scheduled functions (Belize = UTC-6, no DST) */
  TIMEZONE: "America/Belize" as const,

  /** GA4 Property ID (numeric, e.g., "524822766") */
  GA4_PROPERTY_ID: "524822766" as const,

  /** Default memory allocation for callable functions */
  DEFAULT_MEMORY: "256MiB" as const,

  /** Default timeout for callable functions (seconds) */
  DEFAULT_TIMEOUT: 60,

  /** Extended timeout for heavy operations (seconds) */
  EXTENDED_TIMEOUT: 300,

  /** Memory for heavy operations */
  HEAVY_MEMORY: "512MiB" as const,

  /** Firestore batch size for bulk operations */
  BATCH_SIZE: 500,

  /** Analytics data retention (days) */
  ANALYTICS_RETENTION_DAYS: 90,
} as const;

/** Type-safe access to config values */
export type ConfigKey = keyof typeof CONFIG;

/** Pre-built function option objects for common use cases */
export const functionOptions = {
  default: {
    region: CONFIG.REGION,
    memory: CONFIG.DEFAULT_MEMORY,
    timeoutSeconds: CONFIG.DEFAULT_TIMEOUT,
  },
  sync: {
    region: CONFIG.REGION,
    memory: CONFIG.HEAVY_MEMORY,
    timeoutSeconds: CONFIG.EXTENDED_TIMEOUT,
  },
  scheduled: {
    region: CONFIG.REGION,
    timeZone: CONFIG.TIMEZONE,
    memory: CONFIG.DEFAULT_MEMORY,
  },
  scheduledHeavy: {
    region: CONFIG.REGION,
    timeZone: CONFIG.TIMEZONE,
    memory: CONFIG.HEAVY_MEMORY,
    timeoutSeconds: CONFIG.EXTENDED_TIMEOUT,
  },
} as const;