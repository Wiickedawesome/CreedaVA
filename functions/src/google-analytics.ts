/**
 * Google Analytics Admin Cloud Function
 *
 * Fetches GA4 property info, data streams, and real-time analytics data.
 * Uses the GA4 Data API via REST for reliable TypeScript compatibility.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { db, getIntegrationConfig, verifyAdmin } from "./admin";

// ─── Auth helper ─────────────────────────────────────

async function getAnalyticsAuth() {
  const integration = await getIntegrationConfig("google-analytics");
  if (!integration?.config?.serviceAccountKey) {
    throw new HttpsError("failed-precondition", "Google Analytics Admin not configured");
  }

  const { config } = integration;
  const key = JSON.parse(config.serviceAccountKey);
  const authClient = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/analytics.edit",
    ],
  });

  const credentials = await authClient.authorize();
  return { token: credentials.access_token!, propertyId: config.propertyId || "" };
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
  { region: "us-east4", memory: "256MiB" },
  async (request) => {
    await verifyAdmin(request.auth?.token?.email || "");

    const { token, propertyId } = await getAnalyticsAuth();
    const days = (request.data as { days?: number })?.days || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    const baseUrl = `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`;

    try {
      // Main report
      const reportRes = await gaFetch(token, baseUrl, {
        dateRanges: [{ startDate: start, endDate: end }],
        metrics: [
          { name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" },
          { name: "bounceRate" }, { name: "averageSessionDuration" },
          { name: "newUsers" }, { name: "conversions" },
        ],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
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
        period: { days, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        syncedAt: new Date().toISOString(),
      });

      return { success: true, summary, dailyData, topPages, trafficSources, period: { startDate: start, endDate: end } };
    } catch (err) {
      console.error("GA4 report fetch failed:", err);
      throw new HttpsError("internal", err instanceof Error ? err.message : "Failed to fetch analytics");
    }
  },
);

// ─── Realtime Report ─────────────────────────────────

export const fetchRealtimeAnalytics = onCall(
  { region: "us-east4", memory: "256MiB" },
  async (request) => {
    await verifyAdmin(request.auth?.token?.email || "");

    const { token, propertyId } = await getAnalyticsAuth();
    const url = `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runRealtimeReport`;

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
