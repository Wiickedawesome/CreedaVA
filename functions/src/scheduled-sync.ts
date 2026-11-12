/**
 * Scheduled Sync Functions — pulls fresh data from all configured Google services.
 * Runs daily at 6 AM Belize time so the admin dashboard reflects real numbers
 * without manual "Sync" clicks.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { google } from "googleapis";
import { db, getIntegrationConfig } from "./admin";
import { toGA4PropertyResourceName } from "./google-analytics-property";
import { runInboxSync } from "./inbox";
import { functionOptions } from "./config";

export const dailyGoogleSync = onSchedule(
  {
    schedule: "0 6 * * *",
    ...functionOptions.scheduledHeavy,
  },
  async () => {
    const results: { service: string; status: string; detail?: string }[] = [];

    // ── 1) Sync Google Ads campaigns ──────────────
    try {
      const adsConfig = await getIntegrationConfig("google-ads");
      if (adsConfig?.enabled) {
        const oauth2Client = new google.auth.OAuth2(
          adsConfig.config.clientId,
          adsConfig.config.clientSecret,
        );
        oauth2Client.setCredentials({ refresh_token: adsConfig.config.refreshToken });
        const accessToken = (await oauth2Client.getAccessToken()).token;
        if (!accessToken) throw new Error("Failed to get Ads access token");
        const customerId = adsConfig.config.customerId.replace(/-/g, "");

        const response = await fetch(
          `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "developer-token": adsConfig.config.developerToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `SELECT campaign.id, campaign.name, campaign.status,
                      campaign_budget.amount_micros, metrics.impressions,
                      metrics.clicks, metrics.conversions, metrics.cost_micros
                      FROM campaign WHERE segments.date DURING LAST_30_DAYS
                      ORDER BY metrics.impressions DESC LIMIT 50`,
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const batch = db.batch();
          let synced = 0;
          if (Array.isArray(data)) {
            for (const row of data) {
              const campaign = (row as Record<string, unknown>).campaign as Record<string, unknown>;
              const metrics = (row as Record<string, unknown>).metrics as Record<string, unknown>;
              const budget = (row as Record<string, unknown>).campaignBudget as Record<string, unknown>;
              if (!campaign) continue;
              batch.set(db.collection("campaigns").doc(`gads_${campaign.id}`), {
                name: campaign.name, platform: "google-ads",
                status: String(campaign.status).toLowerCase(),
                budget: budget?.amountMicros ? Number(budget.amountMicros) / 1e6 : 0,
                spent: metrics?.costMicros ? Number(metrics.costMicros) / 1e6 : 0,
                impressions: Number(metrics?.impressions || 0),
                clicks: Number(metrics?.clicks || 0),
                conversions: Number(metrics?.conversions || 0),
                googleAdsId: campaign.id, syncedAt: new Date(), source: "scheduled-sync",
              }, { merge: true });
              synced++;
            }
          }
          await batch.commit();
          results.push({ service: "Google Ads", status: "ok", detail: `${synced} campaigns` });
        } else {
          const err = await response.text();
          results.push({ service: "Google Ads", status: "error", detail: err });
        }
      }
    } catch (err) {
      results.push({ service: "Google Ads", status: "error", detail: (err as Error).message });
    }

    // ── 2) Sync Search Console data ───────────────
    try {
      const scConfig = await getIntegrationConfig("search-console");
      if (scConfig?.enabled && scConfig.config.serviceAccountKey) {
        const key = JSON.parse(scConfig.config.serviceAccountKey);
        const authClient = new google.auth.JWT({
          email: key.client_email, key: key.private_key,
          scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        });
        const searchconsole = google.searchconsole({ version: "v1", auth: authClient });

        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];

        const queryResult = await searchconsole.searchanalytics.query({
          siteUrl: scConfig.config.siteUrl || "https://creedava.com",
          requestBody: {
            startDate, endDate,
            dimensions: ["query"],
            rowLimit: 50,
          },
        });

        const queries = (queryResult.data.rows || []).map((r) => ({
          query: r.keys?.[0] || "", clicks: r.clicks || 0,
          impressions: r.impressions || 0, ctr: r.ctr || 0, position: r.position || 0,
        }));

        await db.collection("search-console-snapshots").doc("latest").set({
          queries, period: { startDate, endDate },
          summary: {
            totalClicks: queries.reduce((s, q) => s + q.clicks, 0),
            totalImpressions: queries.reduce((s, q) => s + q.impressions, 0),
            avgCTR: queries.length > 0 ? queries.reduce((s, q) => s + q.ctr, 0) / queries.length : 0,
            avgPosition: queries.length > 0 ? queries.reduce((s, q) => s + q.position, 0) / queries.length : 0,
          },
          syncedAt: new Date(),
        }, { merge: true });

        results.push({ service: "Search Console", status: "ok", detail: `${queries.length} queries` });
      }
    } catch (err) {
      results.push({ service: "Search Console", status: "error", detail: (err as Error).message });
    }

    // ── 3) Sync GA4 Analytics ─────────────────────
    try {
      const gaConfig = await getIntegrationConfig("google-analytics");
      if (gaConfig?.enabled && gaConfig.config?.serviceAccountKey) {
        const key = JSON.parse(gaConfig.config.serviceAccountKey);
        const authClient = new google.auth.JWT({
          email: key.client_email, key: key.private_key,
          scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
        });
        const creds = await authClient.authorize();
        const token = creds.access_token!;
        const propertyName = toGA4PropertyResourceName(gaConfig.config.propertyId);

        const res = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/${propertyName}:runReport`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
              metrics: [
                { name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" },
                { name: "bounceRate" }, { name: "averageSessionDuration" },
                { name: "newUsers" }, { name: "conversions" },
              ],
            }),
          },
        );

        if (res.ok) {
          const data = await res.json();
          const row = data.rows?.[0]?.metricValues || [];
          await db.collection("analytics-snapshots").doc("latest-ga4").set({
            summary: {
              totalUsers: parseInt(row[0]?.value || "0"),
              totalSessions: parseInt(row[1]?.value || "0"),
              totalPageViews: parseInt(row[2]?.value || "0"),
              avgBounceRate: parseFloat(row[3]?.value || "0"),
              avgSessionDuration: parseFloat(row[4]?.value || "0"),
              totalNewUsers: parseInt(row[5]?.value || "0"),
              totalConversions: parseInt(row[6]?.value || "0"),
            },
            syncedAt: new Date(),
          }, { merge: true });
          results.push({ service: "GA4 Analytics", status: "ok" });
        } else {
          const err = await res.text();
          results.push({ service: "GA4 Analytics", status: "error", detail: err });
        }
      }
    } catch (err) {
      results.push({ service: "GA4 Analytics", status: "error", detail: (err as Error).message });
    }

    // ── 4) Sync Business Profile reviews ──────────
    try {
      const bpConfig = await getIntegrationConfig("google-business");
      if (bpConfig?.enabled && bpConfig.config?.serviceAccountKey) {
        const key = JSON.parse(bpConfig.config.serviceAccountKey);
        const authClient = new google.auth.JWT({
          email: key.client_email, key: key.private_key,
          scopes: ["https://www.googleapis.com/auth/business.manage"],
        });
        const creds = await authClient.authorize();
        const token = creds.access_token!;

        const reviewsUrl = `https://mybusiness.googleapis.com/v1/accounts/${bpConfig.config.accountId}/locations/${bpConfig.config.locationId}/reviews`;
        const reviewsRes = await fetch(reviewsUrl, { headers: { Authorization: `Bearer ${token}` } });

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          const reviews = (reviewsData.reviews || []).map((r: Record<string, unknown>) => ({
            author: (r.reviewer as Record<string, unknown>)?.displayName,
            rating: r.starRating,
            comment: r.comment,
            createTime: r.createTime,
            updateTime: r.updateTime,
            reviewId: r.reviewId,
          }));

          const batch = db.batch();
          for (const review of reviews) {
            batch.set(
              db.collection("business-reviews").doc(String(review.reviewId || Math.random())),
              { ...review, syncedAt: new Date() },
              { merge: true },
            );
          }
          await batch.commit();
          results.push({ service: "Business Reviews", status: "ok", detail: `${reviews.length} reviews` });
        } else {
          const err = await reviewsRes.text();
          results.push({ service: "Business Reviews", status: "error", detail: err });
        }
      }
    } catch (err) {
      results.push({ service: "Business Reviews", status: "error", detail: (err as Error).message });
    }

    // ── 5) Sync Business Profile insights ─────────
    try {
      const biConfig = await getIntegrationConfig("google-business");
      if (biConfig?.enabled && biConfig.config?.serviceAccountKey) {
        const key = JSON.parse(biConfig.config.serviceAccountKey);
        const authClient = new google.auth.JWT({
          email: key.client_email, key: key.private_key,
          scopes: ["https://www.googleapis.com/auth/business.manage"],
        });
        const creds = await authClient.authorize();
        const token = creds.access_token!;

        const performanceUrl = `https://businessprofileperformance.googleapis.com/v1/locations/${biConfig.config.locationId}:getDailyMetricsTimeSeries`;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const metrics = [
          "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
          "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
          "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
          "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
          "CALL_CLICKS",
          "WEBSITE_CLICKS",
          "BUSINESS_DIRECTION_REQUESTS",
        ];

        const resultsInsights: Record<string, number> = {};
        for (const metric of metrics) {
          try {
            const res = await fetch(
              `${performanceUrl}?dailyMetric=${metric}&dailyRange.startDate.year=${startDate.getFullYear()}&dailyRange.startDate.month=${startDate.getMonth() + 1}&dailyRange.startDate.day=${startDate.getDate()}&dailyRange.endDate.year=${endDate.getFullYear()}&dailyRange.endDate.month=${endDate.getMonth() + 1}&dailyRange.endDate.day=${endDate.getDate()}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.ok) {
              const data = await res.json();
              const total = data?.timeSeries?.datedValues?.reduce((acc: number, v: { value?: string }) => acc + (parseInt(v.value || "0")), 0) || 0;
              resultsInsights[metric] = total;
            } else {
              resultsInsights[metric] = 0;
            }
          } catch {
            resultsInsights[metric] = 0;
          }
        }

        await db.collection("business-insights").add({
          ...resultsInsights,
          period: { start: startDate.toISOString(), end: endDate.toISOString() },
          syncedAt: new Date(),
        });

        results.push({ service: "Business Insights", status: "ok" });
      }
    } catch (err) {
      results.push({ service: "Business Insights", status: "error", detail: (err as Error).message });
    }

    // ── 6) Sync the Gmail inbox ──────────────────
    // The admin only refreshed this on a manual Sync click, so a broken or
    // quiet mailbox looked identical to a working one for months.
    try {
      const { synced, repaired } = await runInboxSync();
      results.push({ service: "Inbox", status: "ok", detail: `${synced} new, ${repaired} repaired` });
    } catch (err) {
      results.push({ service: "Inbox", status: "error", detail: (err as Error).message });
    }

    // ── Log sync results ──────────────────────────
    await db.collection("sync-log").add({
      type: "daily-google-sync",
      results,
      completedAt: new Date(),
    });

    console.log("Daily Google sync completed:", results.map((r) => `${r.service}: ${r.status}`).join(", "));
  },
);