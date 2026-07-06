/**
 * Google Ads Cloud Function — syncs campaign data from Google Ads.
 *
 * Config stored in Firestore: integrations/google-ads
 * {
 *   enabled: true,
 *   config: {
 *     developerToken: "xxx",
 *     clientId: "xxx.apps.googleusercontent.com",
 *     clientSecret: "xxx",
 *     refreshToken: "xxx",
 *     customerId: "123-456-7890",
 *   }
 * }
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, getIntegrationConfig } from "./admin";

// ─── Google Ads API client ───────────────────────────

async function fetchGoogleAdsData(
  config: Record<string, string>,
  query: string,
): Promise<unknown[]> {
  const { google } = await import("googleapis");

  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
  );
  oauth2Client.setCredentials({ refresh_token: config.refreshToken });

  // Google Ads uses a REST API — we make direct HTTP calls
  const accessToken = (await oauth2Client.getAccessToken()).token;
  const customerId = config.customerId.replace(/-/g, "");

  const response = await fetch(
    `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": config.developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Ads API error: ${err}`);
  }

  const data = await response.json();
  return data;
}

// ─── Sync Campaign Data ──────────────────────────────

export const syncCampaignData = onCall(
  { region: "us-east4", timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth?.token.email?.endsWith("@creedava.com")) {
      throw new HttpsError("permission-denied", "Must be @creedava.com");
    }

    const integration = await getIntegrationConfig("google-ads");
    if (!integration || !integration.enabled) {
      throw new HttpsError(
        "failed-precondition",
        "Google Ads integration not enabled. Configure in Admin → Integrations.",
      );
    }

    try {
      // Fetch campaign performance data (last 30 days)
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign_budget.amount_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
        ORDER BY metrics.impressions DESC
        LIMIT 50
      `;

      const streamChunks = await fetchGoogleAdsData(integration.config, query);

      // Google Ads streaming API returns [{results: [row, row, ...]}, ...]
      // Flatten all chunks into a single list of campaign rows.
      const results: unknown[] = [];
      if (Array.isArray(streamChunks)) {
        for (const chunk of streamChunks) {
          const rows = (chunk as Record<string, unknown>).results;
          if (Array.isArray(rows)) results.push(...rows);
        }
      }

      // Sync to Firestore campaigns collection
      const batch = db.batch();
      let synced = 0;

      if (results.length > 0) {
        for (const row of results) {
          const campaign = (row as Record<string, unknown>).campaign as Record<string, unknown>;
          const metrics = (row as Record<string, unknown>).metrics as Record<string, unknown>;
          const budget = (row as Record<string, unknown>).campaignBudget as Record<string, unknown>;

          if (!campaign) continue;

          const docRef = db.collection("campaigns").doc(`gads_${campaign.id}`);
          batch.set(
            docRef,
            {
              name: campaign.name,
              platform: "google-ads",
              status: String(campaign.status).toLowerCase(),
              budget: budget?.amountMicros
                ? Number(budget.amountMicros) / 1_000_000
                : 0,
              spent: metrics?.costMicros
                ? Number(metrics.costMicros) / 1_000_000
                : 0,
              impressions: Number(metrics?.impressions || 0),
              clicks: Number(metrics?.clicks || 0),
              conversions: Number(metrics?.conversions || 0),
              googleAdsId: campaign.id,
              syncedAt: new Date(),
              source: "google-ads-sync",
            },
            { merge: true },
          );
          synced++;
        }
      }

      await batch.commit();

      return {
        success: true,
        campaignsSynced: synced,
        syncedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error("Google Ads sync failed:", err);
      throw new HttpsError(
        "internal",
        `Ads sync failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  },
);
