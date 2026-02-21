/**
 * Shared Firebase Admin + config helpers for Cloud Functions.
 *
 * Integration config resolution order:
 *   1. Firestore `integrations/{provider}` document
 *   2. Environment variables (hardcoded fallback — never loses connection)
 *
 * Set env vars via `firebase functions:secrets:set` or `.env` in `functions/`.
 */

import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";

// Initialize Firebase Admin (auto-detects credentials in Cloud Functions)
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();

// ─── Environment Variable Fallback Maps ──────────────
// Maps provider → { configKey: ENV_VAR_NAME }
// If Firestore has no config, these env vars are used instead.

const ENV_FALLBACK: Record<string, Record<string, string>> = {
  email: {
    host: "SMTP_HOST",
    port: "SMTP_PORT",
    user: "SMTP_USER",
    pass: "SMTP_PASS",
    aliases: "SMTP_ALIASES",
  },
  "google-calendar": {
    calendarId: "GCAL_CALENDAR_ID",
    serviceAccountEmail: "GCAL_SERVICE_ACCOUNT_EMAIL",
    serviceAccountKey: "GCAL_SERVICE_ACCOUNT_KEY",
  },
  "google-ads": {
    developerToken: "GADS_DEVELOPER_TOKEN",
    clientId: "GADS_CLIENT_ID",
    clientSecret: "GADS_CLIENT_SECRET",
    refreshToken: "GADS_REFRESH_TOKEN",
    customerId: "GADS_CUSTOMER_ID",
  },
  "search-console": {
    siteUrl: "GSC_SITE_URL",
    serviceAccountEmail: "GSC_SERVICE_ACCOUNT_EMAIL",
    serviceAccountKey: "GSC_SERVICE_ACCOUNT_KEY",
  },
  "google-business": {
    accountId: "GBP_ACCOUNT_ID",
    locationId: "GBP_LOCATION_ID",
    serviceAccountEmail: "GBP_SERVICE_ACCOUNT_EMAIL",
    serviceAccountKey: "GBP_SERVICE_ACCOUNT_KEY",
  },
  "google-analytics": {
    propertyId: "GA4_PROPERTY_ID",
    serviceAccountEmail: "GA4_SERVICE_ACCOUNT_EMAIL",
    serviceAccountKey: "GA4_SERVICE_ACCOUNT_KEY",
  },
  "google-sheets": {
    spreadsheetId: "GSHEETS_SPREADSHEET_ID",
    serviceAccountEmail: "GSHEETS_SERVICE_ACCOUNT_EMAIL",
    serviceAccountKey: "GSHEETS_SERVICE_ACCOUNT_KEY",
  },
  "google-drive": {
    folderId: "GDRIVE_FOLDER_ID",
    serviceAccountEmail: "GDRIVE_SERVICE_ACCOUNT_EMAIL",
    serviceAccountKey: "GDRIVE_SERVICE_ACCOUNT_KEY",
  },
  "web-search": {
    apiKey: "GOOGLE_SEARCH_API_KEY",
    searchEngineId: "GOOGLE_SEARCH_ENGINE_ID",
  },
  webhooks: {
    apiKey: "WEBHOOK_API_KEY",
  },
};

/**
 * Build config from environment variables for a given provider.
 * Returns null if no env vars are set for that provider.
 */
function getEnvFallbackConfig(provider: string): Record<string, string> | null {
  const mapping = ENV_FALLBACK[provider];
  if (!mapping) return null;

  const config: Record<string, string> = {};
  let hasAny = false;

  for (const [configKey, envVar] of Object.entries(mapping)) {
    const value = process.env[envVar];
    if (value) {
      config[configKey] = value;
      hasAny = true;
    }
  }

  return hasAny ? config : null;
}

/**
 * Fetch an integration config from Firestore "integrations" collection,
 * with automatic fallback to environment variables.
 *
 * Resolution:
 *   1. Firestore doc `integrations/{provider}` (by ID, then by provider field)
 *   2. Environment variables (see ENV_FALLBACK map above)
 *   3. Merged: Firestore config with env vars filling any gaps
 */
export async function getIntegrationConfig(
  provider: string,
): Promise<{ enabled: boolean; config: Record<string, string>; source: "firestore" | "env" | "merged" } | null> {
  // ── 1. Try Firestore (doc ID first, then legacy query) ──
  let firestoreConfig: Record<string, string> | null = null;
  let firestoreEnabled = false;

  try {
    let doc = await db.collection("integrations").doc(provider).get();
    if (!doc.exists) {
      const query = await db.collection("integrations").where("provider", "==", provider).limit(1).get();
      if (!query.empty) doc = query.docs[0];
    }
    if (doc.exists) {
      const data = doc.data()!;
      firestoreEnabled = data.enabled ?? false;
      firestoreConfig = data.config ?? {};
    }
  } catch (err) {
    console.warn(`[Integration] Firestore read failed for ${provider}:`, err);
  }

  // ── 2. Try environment variables ──
  const envConfig = getEnvFallbackConfig(provider);

  // ── 3. Merge: Firestore wins, env fills gaps ──
  if (firestoreConfig && envConfig) {
    const merged: Record<string, string> = { ...envConfig };
    for (const [k, v] of Object.entries(firestoreConfig)) {
      if (v) merged[k] = v; // Firestore value takes precedence
    }
    return { enabled: firestoreEnabled || true, config: merged, source: "merged" };
  }

  if (firestoreConfig) {
    return { enabled: firestoreEnabled, config: firestoreConfig, source: "firestore" };
  }

  if (envConfig) {
    return { enabled: true, config: envConfig, source: "env" };
  }

  return null;
}

/**
 * Verify the request comes from an authenticated @creedava.com user.
 * For onCall functions, pass request.auth?.token?.email directly.
 * For HTTP functions, pass the raw ID token string.
 */
export function verifyAdminEmail(email: string | undefined): void {
  if (!email?.endsWith("@creedava.com")) {
    throw new HttpsError("permission-denied", "Must be @creedava.com");
  }
}

/**
 * Create an SMTP Nodemailer transport from the email integration config.
 * Returns null if the integration is not configured or not enabled.
 * Callers that require the transport (e.g. onCall functions) should throw
 * after checking for null; background triggers should silently return.
 */
export async function getEmailTransport(): Promise<nodemailer.Transporter | null> {
  const integration = await getIntegrationConfig("email");
  if (!integration?.enabled) return null;

  const { config } = integration;
  return nodemailer.createTransport({
    host: config.host || "smtp.gmail.com",
    port: parseInt(config.port || "587"),
    secure: config.port === "465",
    auth: { user: config.user, pass: config.pass },
  });
}

/**
 * Legacy: Verify via raw ID token (for HTTP endpoints only).
 */
export async function verifyAdmin(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const decoded = await auth.verifyIdToken(idToken);
  if (!decoded.email?.endsWith("@creedava.com")) {
    throw new Error("Unauthorized: must be a @creedava.com user");
  }
  return decoded;
}
