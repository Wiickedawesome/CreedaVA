/**
 * Google Search Console Cloud Function — fetches real SEO performance data.
 *
 * Config stored in Firestore: integrations/search-console
 * {
 *   enabled: true,
 *   config: {
 *     siteUrl: "https://creedava.com",
 *     serviceAccountEmail: "seo@creeda-va.iam.gserviceaccount.com",
 *     serviceAccountKey: "{ ... JSON key ... }",
 *   }
 * }
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { db, getIntegrationConfig } from "./admin";

// ─── Auth helper ─────────────────────────────────────

async function getSearchConsoleClient() {
  const integration = await getIntegrationConfig("search-console");
  if (!integration || !integration.enabled) {
    throw new HttpsError(
      "failed-precondition",
      "Search Console integration not enabled. Configure in Admin → Integrations.",
    );
  }

  const { config } = integration;
  let authClient;

  if (config.serviceAccountKey) {
    const key = JSON.parse(config.serviceAccountKey);
    authClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
  } else {
    authClient = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
  }

  const searchconsole = google.searchconsole({ version: "v1", auth: authClient });
  return { searchconsole, siteUrl: config.siteUrl || "https://creedava.com" };
}

// ─── Fetch Search Performance Data ───────────────────

export const fetchSearchConsoleData = onCall(
  { region: "us-east4", timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth?.token.email?.endsWith("@creedava.com")) {
      throw new HttpsError("permission-denied", "Must be @creedava.com");
    }

    const days = (request.data as { days?: number })?.days || 28;

    try {
      const { searchconsole, siteUrl } = await getSearchConsoleClient();

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Fetch query-level data
      const queryResult = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          dimensions: ["query"],
          rowLimit: 100,
          type: "web",
        },
      });

      // Fetch page-level data
      const pageResult = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          dimensions: ["page"],
          rowLimit: 50,
          type: "web",
        },
      });

      // Fetch query+page together.
      //
      // The `query` dimension above is aggregated across every landing page, so
      // it cannot say *which* page ranks. Writing those rows to `rank-history`
      // meant recording an empty page. This combined query gives one row per
      // (query, page), which is exactly the agent's rank-history key.
      const queryPageResult = await searchconsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          dimensions: ["query", "page"],
          rowLimit: 200,
          type: "web",
        },
      });

      const queries = (queryResult.data.rows || []).map((row) => ({
        query: row.keys?.[0] || "",
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

      const pages = (pageResult.data.rows || []).map((row) => ({
        page: row.keys?.[0] || "",
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

      const queryPages = (queryPageResult.data.rows || []).map((row) => ({
        query: row.keys?.[0] || "",
        page: row.keys?.[1] || "",
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      }));

      // Save snapshot to Firestore for historical tracking
      await db.collection("seo-snapshots").add({
        date: new Date(),
        period: `${days}d`,
        totalClicks: queries.reduce((s, q) => s + q.clicks, 0),
        totalImpressions: queries.reduce((s, q) => s + q.impressions, 0),
        avgPosition:
          queries.length > 0
            ? queries.reduce((s, q) => s + q.position, 0) / queries.length
            : 0,
        topQueries: queries.slice(0, 20),
        topPages: pages.slice(0, 10),
      });

      return {
        success: true,
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        queries,
        pages,
        queryPages,
        summary: {
          totalClicks: queries.reduce((s, q) => s + q.clicks, 0),
          totalImpressions: queries.reduce((s, q) => s + q.impressions, 0),
          avgCTR:
            queries.length > 0
              ? queries.reduce((s, q) => s + q.ctr, 0) / queries.length
              : 0,
          avgPosition:
            queries.length > 0
              ? queries.reduce((s, q) => s + q.position, 0) / queries.length
              : 0,
        },
      };
    } catch (err) {
      console.error("Search Console fetch failed:", err);
      throw new HttpsError(
        "internal",
        `Search Console error: ${err instanceof Error ? err.message : "Unknown"}`,
      );
    }
  },
);
