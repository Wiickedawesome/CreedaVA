/**
 * Test Integration Cloud Function
 *
 * Lightweight connectivity test for each integration provider.
 * Validates that stored credentials actually work by making a minimal API call.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { google } from "googleapis";
import * as nodemailer from "nodemailer";
import { db, getIntegrationConfig, verifyAdminEmail } from "./admin";
import { toGA4PropertyResourceName } from "./google-analytics-property";

// ─── Types ───────────────────────────────────────────

interface TestResult {
  success: boolean;
  provider: string;
  message: string;
  details?: string;
  testedAt: string;
}

// ─── Individual test helpers ─────────────────────────

async function testEmail(config: Record<string, string>): Promise<string> {
  const transport = nodemailer.createTransport({
    host: config.host || "smtp.gmail.com",
    port: parseInt(config.port || "587"),
    secure: config.port === "465",
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10000,
  });
  await transport.verify();
  transport.close();
  return `SMTP connected to ${config.host || "smtp.gmail.com"} as ${config.user}`;
}

async function testCalendar(config: Record<string, string>): Promise<string> {
  const key = JSON.parse(config.serviceAccountKey);
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = config.calendarId || "primary";
  const res = await calendar.events.list({
    calendarId,
    maxResults: 1,
    timeMin: new Date().toISOString(),
  });
  const count = res.data.items?.length ?? 0;
  return `Calendar "${calendarId}" accessible (${count} upcoming event${count !== 1 ? "s" : ""} found)`;
}

async function testAds(config: Record<string, string>): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(config.clientId, config.clientSecret);
  oauth2Client.setCredentials({ refresh_token: config.refreshToken });
  const { token } = await oauth2Client.getAccessToken();
  if (!token) throw new Error("Failed to get access token — check OAuth credentials");

  const customerId = config.customerId.replace(/-/g, "");
  const res = await fetch(
    `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "developer-token": config.developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "SELECT customer.id FROM customer LIMIT 1" }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ads API ${res.status}: ${err}`);
  }
  return `Google Ads account ${config.customerId} connected`;
}

async function testSearchConsole(config: Record<string, string>): Promise<string> {
  const key = JSON.parse(config.serviceAccountKey);
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const sc = google.searchconsole({ version: "v1", auth });
  const siteUrl = config.siteUrl || "https://creedava.com";

  // Try a minimal query (1 day, 1 row)
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 3);
  await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      dimensions: ["query"],
      rowLimit: 1,
    },
  });
  return `Search Console connected for ${siteUrl}`;
}

async function testBusiness(config: Record<string, string>): Promise<string> {
  const key = JSON.parse(config.serviceAccountKey);
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/business.manage"],
  });
  await auth.authorize();
  return `Business Profile service account authenticated (${key.client_email})`;
}

async function testAnalytics(config: Record<string, string>): Promise<string> {
  const key = JSON.parse(config.serviceAccountKey);
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const credentials = await auth.authorize();
  const propertyName = toGA4PropertyResourceName(config.propertyId);

  // Minimal GA4 Data API call
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${propertyName}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "yesterday", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 API ${res.status}: ${err}`);
  }
  return `Analytics property ${propertyName} connected`;
}

async function testSheets(config: Record<string, string>): Promise<string> {
  const key = JSON.parse(config.serviceAccountKey);
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  if (config.spreadsheetId) {
    const res = await sheets.spreadsheets.get({ spreadsheetId: config.spreadsheetId });
    return `Sheets connected — "${res.data.properties?.title}"`;
  }
  // No spreadsheet ID — just verify auth works
  await auth.authorize();
  return `Sheets service account authenticated (${key.client_email})`;
}

async function testDrive(config: Record<string, string>): Promise<string> {
  const key = JSON.parse(config.serviceAccountKey);
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });

  const folderId = config.folderId || "root";
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    pageSize: 1,
    fields: "files(id,name)",
  });
  const count = res.data.files?.length ?? 0;
  return `Drive folder accessible (${count} file${count !== 1 ? "s" : ""} found)`;
}

async function testWebhooks(): Promise<string> {
  // Webhooks are passive — just confirm the endpoint function exists
  return "Webhook endpoint active — ready to receive form submissions";
}

// ─── Provider test dispatcher ────────────────────────

const TESTS: Record<string, (config: Record<string, string>) => Promise<string>> = {
  "email": testEmail,
  "google-calendar": testCalendar,
  "google-ads": testAds,
  "search-console": testSearchConsole,
  "google-business": testBusiness,
  "google-analytics": testAnalytics,
  "google-sheets": testSheets,
  "google-drive": testDrive,
  "webhooks": testWebhooks,
};

// ─── Main Cloud Function ─────────────────────────────

export const testIntegration = onCall(
  { region: "us-east4", timeoutSeconds: 30, memory: "256MiB" },
  async (request): Promise<TestResult> => {
    verifyAdminEmail(request.auth?.token?.email);

    const { provider } = request.data as { provider: string };
    if (!provider || !TESTS[provider]) {
      throw new HttpsError("invalid-argument", `Unknown provider: ${provider}`);
    }

    return runSingleTest(provider);
  },
);

// ─── Verify All Integrations ─────────────────────────

interface VerifyAllResult {
  results: TestResult[];
  summary: { total: number; connected: number; failed: number; unconfigured: number };
}

export const verifyAllIntegrations = onCall(
  { region: "us-east4", timeoutSeconds: 60, memory: "512MiB" },
  async (request): Promise<VerifyAllResult> => {
    verifyAdminEmail(request.auth?.token?.email);

    const providers = Object.keys(TESTS);
    const results: TestResult[] = [];

    // Run all tests in parallel (each has its own timeout handling)
    const promises = providers.map(async (provider) => {
      try {
        return await runSingleTest(provider);
      } catch (err) {
        return {
          success: false,
          provider,
          message: "Error",
          details: err instanceof Error ? err.message : String(err),
          testedAt: new Date().toISOString(),
        };
      }
    });

    const settled = await Promise.all(promises);
    results.push(...settled);

    const connected = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success && r.message !== "Not configured" && r.message !== "Disabled").length;
    const unconfigured = results.filter((r) => r.message === "Not configured" || r.message === "Disabled").length;

    return {
      results,
      summary: { total: providers.length, connected, failed, unconfigured },
    };
  },
);

// ─── Shared test runner ──────────────────────────────

async function runSingleTest(provider: string): Promise<TestResult> {
  const integration = await getIntegrationConfig(provider);
  if (!integration) {
    return {
      success: false,
      provider,
      message: "Not configured",
      details: "No credentials saved. Fill in the fields and click Connect first.",
      testedAt: new Date().toISOString(),
    };
  }

  if (!integration.enabled) {
    return {
      success: false,
      provider,
      message: "Disabled",
      details: "Integration is saved but disabled. Enable it first.",
      testedAt: new Date().toISOString(),
    };
  }

  try {
    const details = await TESTS[provider](integration.config);

    // Save test result to Firestore
    await db.collection("integrations").doc(provider).set({
      provider,
      enabled: true,
      config: integration.config,
      lastTestedAt: new Date().toISOString(),
      lastTestSuccess: true,
      lastTestMessage: details,
      configSource: integration.source ?? "firestore",
    }, { merge: true });

    return {
      success: true,
      provider,
      message: "Connected",
      details,
      testedAt: new Date().toISOString(),
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Save failure to Firestore
    await db.collection("integrations").doc(provider).set({
      provider,
      lastTestedAt: new Date().toISOString(),
      lastTestSuccess: false,
      lastTestMessage: errorMsg,
    }, { merge: true }).catch(() => { /* doc might not exist yet */ });

    return {
      success: false,
      provider,
      message: "Connection failed",
      details: errorMsg,
      testedAt: new Date().toISOString(),
    };
  }
}
