/**
 * Google Analytics Admin Cloud Function
 *
 * Fetches GA4 property info, data streams, and real-time analytics data.
 * Uses the GA4 Data API via REST for reliable TypeScript compatibility.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { db, getIntegrationConfig, verifyAdminEmail } from "./admin";
import { toGA4PropertyResourceName } from "./google-analytics-property";

// ─── Auth helper ─────────────────────────────────────

async function getAnalyticsAuth() {
  const integration = await getIntegrationConfig("google-analytics");
  const config = integration?.config ?? {};

  let authClient;
  if (config.serviceAccountKey) {
    const key = JSON.parse(config.serviceAccountKey);
    authClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: [
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/analytics.edit",
      ],
    });
  } else {
    authClient = new google.auth.GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/analytics.edit",
      ],
    });
  }

  const credentials = authClient instanceof google.auth.JWT
    ? await authClient.authorize()
    : { access_token: (await (authClient as InstanceType<typeof google.auth.GoogleAuth>).getAccessToken()) };
  return { token: credentials.access_token!, propertyName: toGA4PropertyResourceName(config.propertyId) };
}

async function gaFetch(token: string, url: string, body?: Record<string, unknown>) {
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Fetch GA4 Report ────────────────────────────────

interface GARow {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
}

export const fetchAnalyticsReport = onCall(
  // 256 MiB was the default and it was not enough: measured 2026-11-12 at
  // 259-267 MiB in use, so every call was killed before it could respond and
  // reported "Memory limit exceeded". A GA4 report response is large and the
  // JSON parse doubles it in memory; 512 MiB leaves real headroom.
  { region: "us-east4", memory: "512MiB" },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { token, propertyName } = await getAnalyticsAuth();
    const days = (request.data as { days?: number })?.days || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    const baseUrl = `https://analyticsdata.googleapis.com/v1beta/${propertyName}:runReport`;

    try {
      // Main report — `metricAggregations: ["TOTAL"]` is required for the
      // `totals` array in the response. Without it GA4 omits totals entirely
      // and the dashboard summary row collapses to all zeros even when
      // dailyData has real numbers.
      const reportRes = await gaFetch(token, baseUrl, {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [
          { name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" },
          { name: "bounceRate" }, { name: "averageSessionDuration" },
          { name: "newUsers" }, { name: "conversions" },
        ],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        metricAggregations: ["TOTAL"],
      });

      // Top pages
      const pagesRes = await gaFetch(token, baseUrl, {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [
          { name: "screenPageViews" }, { name: "activeUsers" }, { name: "averageSessionDuration" },
        ],
        dimensions: [{ name: "pagePath" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 20,
      });

      // Traffic sources
      const trafficRes = await gaFetch(token, baseUrl, {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [
          { name: "sessions" }, { name: "activeUsers" }, { name: "conversions" },
        ],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      });

      // Country breakdown (powers World Map + Country Map when Firestore empty)
      const countryRes = await gaFetch(token, baseUrl, {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }],
        dimensions: [{ name: "countryId" }, { name: "country" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 50,
      });

      // Hour × weekday breakdown (powers Peak Hours heatmap when Firestore empty)
      const hourlyRes = await gaFetch(token, baseUrl, {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [{ name: "screenPageViews" }],
        dimensions: [{ name: "dayOfWeek" }, { name: "hour" }],
        limit: 200,
      });

      // Event-name breakdown (powers Event Types donut when Firestore empty)
      const eventRes = await gaFetch(token, baseUrl, {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [{ name: "eventCount" }],
        dimensions: [{ name: "eventName" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 20,
      });

      // Parse daily data
      const dailyData = ((reportRes.rows || []) as GARow[]).map((row) => ({
        date: row.dimensionValues?.[0]?.value || "",
        activeUsers: parseInt(row.metricValues?.[0]?.value || "0"),
        sessions: parseInt(row.metricValues?.[1]?.value || "0"),
        pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
        bounceRate: parseFloat(row.metricValues?.[3]?.value || "0"),
        avgSessionDuration: parseFloat(row.metricValues?.[4]?.value || "0"),
        newUsers: parseInt(row.metricValues?.[5]?.value || "0"),
        conversions: parseInt(row.metricValues?.[6]?.value || "0"),
      }));

      const topPages = ((pagesRes.rows || []) as GARow[]).map((row) => ({
        path: row.dimensionValues?.[0]?.value || "",
        pageViews: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
        avgDuration: parseFloat(row.metricValues?.[2]?.value || "0"),
      }));

      const trafficSources = ((trafficRes.rows || []) as GARow[]).map((row) => ({
        channel: row.dimensionValues?.[0]?.value || "",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
        conversions: parseInt(row.metricValues?.[2]?.value || "0"),
      }));

      const countryBreakdown = ((countryRes.rows || []) as GARow[])
        .map((row) => ({
          countryCode: row.dimensionValues?.[0]?.value || "",
          country: row.dimensionValues?.[1]?.value || "",
          users: parseInt(row.metricValues?.[0]?.value || "0"),
          sessions: parseInt(row.metricValues?.[1]?.value || "0"),
          pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
        }))
        .filter((c) => c.countryCode && c.countryCode !== "(not set)");

      // GA4 dayOfWeek: 0=Sun..6=Sat. Convert to 0=Mon..6=Sun to match the heatmap.
      const hourlyBreakdown = ((hourlyRes.rows || []) as GARow[]).map((row) => {
        const gaDow = parseInt(row.dimensionValues?.[0]?.value || "0");
        const dayOfWeek = (gaDow + 6) % 7; // 0=Mon..6=Sun
        return {
          dayOfWeek,
          hour: parseInt(row.dimensionValues?.[1]?.value || "0"),
          pageViews: parseInt(row.metricValues?.[0]?.value || "0"),
        };
      });

      const eventBreakdown = ((eventRes.rows || []) as GARow[]).map((row) => ({
        eventName: row.dimensionValues?.[0]?.value || "",
        count: parseInt(row.metricValues?.[0]?.value || "0"),
      }));

      // Summary from totals
      const totals = (reportRes.totals as GARow[])?.[0];
      const summary = {
        totalUsers: parseInt(totals?.metricValues?.[0]?.value || "0"),
        totalSessions: parseInt(totals?.metricValues?.[1]?.value || "0"),
        totalPageViews: parseInt(totals?.metricValues?.[2]?.value || "0"),
        avgBounceRate: parseFloat(totals?.metricValues?.[3]?.value || "0"),
        avgSessionDuration: parseFloat(totals?.metricValues?.[4]?.value || "0"),
        totalNewUsers: parseInt(totals?.metricValues?.[5]?.value || "0"),
        totalConversions: parseInt(totals?.metricValues?.[6]?.value || "0"),
      };

      await db.collection("analytics-snapshots").add({
        summary, dailyData, topPages, trafficSources,
        countryBreakdown, hourlyBreakdown, eventBreakdown,
        period: { days, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        syncedAt: new Date().toISOString(),
      });

      return {
        success: true,
        summary, dailyData, topPages, trafficSources,
        countryBreakdown, hourlyBreakdown, eventBreakdown,
        period: { startDate: start, endDate: end },
      };
    } catch (err) {
      console.error("GA4 report fetch failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to fetch analytics");
    }
  },
);

// ─── Realtime Report ─────────────────────────────────

export const fetchRealtimeAnalytics = onCall(
  // Same reason as fetchAnalyticsReport: this ran past 256 MiB and was killed.
  { region: "us-east4", memory: "512MiB" },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { token, propertyName } = await getAnalyticsAuth();
    const url = `https://analyticsdata.googleapis.com/v1beta/${propertyName}:runRealtimeReport`;

    try {
      const res = await gaFetch(token, url, {
        metrics: [
          { name: "activeUsers" }, { name: "screenPageViews" }, { name: "conversions" },
        ],
        dimensions: [{ name: "unifiedScreenName" }],
        limit: 10,
      });

      const activeNow = ((res.totals as GARow[])?.[0]?.metricValues?.[0]?.value) || "0";
      const pages = ((res.rows || []) as GARow[]).map((row) => ({
        page: row.dimensionValues?.[0]?.value || "",
        activeUsers: parseInt(row.metricValues?.[0]?.value || "0"),
        pageViews: parseInt(row.metricValues?.[1]?.value || "0"),
      }));

      return { success: true, activeUsers: parseInt(activeNow), topPages: pages };
    } catch (err) {
      console.error("GA4 realtime failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to fetch realtime data");
    }
  },
);
