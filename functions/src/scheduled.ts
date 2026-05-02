/**
 * Scheduled Cloud Functions — automated daily/weekly reports & notifications.
 *
 * Also handles scheduled sync from Google services so data stays fresh
 * without manual button clicks.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";
import { db, getIntegrationConfig, getEmailTransport } from "./admin";
import { toGA4PropertyResourceName } from "./google-analytics-property";

/** Shorthand: convert JS Date to Firestore Timestamp (required for where() comparisons). */
const TS = Timestamp.fromDate;

/**
 * Runs a Firestore count query safely — returns 0 instead of throwing if the
 * query fails, so a single Firestore issue won't abort the entire digest.
 */
async function safeCount(q: Promise<FirebaseFirestore.QuerySnapshot>): Promise<number> {
  try {
    return (await q).size;
  } catch (err) {
    console.warn("[safeCount] Firestore query failed:", err);
    return 0;
  }
}

/** Empty snapshot fallback used in Promise.all so full snapshot queries also degrade gracefully. */
const emptySafe = (): FirebaseFirestore.QuerySnapshot =>
  ({ docs: [], size: 0 } as unknown as FirebaseFirestore.QuerySnapshot);

// ─── Daily Digest ────────────────────────────────────
// Runs every day at 8 AM Belize time (UTC-6)

export const dailyDigest = onSchedule(
  {
    schedule: "0 8 * * *",
    timeZone: "America/Belize",
    region: "us-east4",
  },
  async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Gather daily stats (each query is independent — a failure returns 0 instead of aborting)
    const [newLeads, newBookings, tasksDone, newContacts] = await Promise.all([
      safeCount(db.collection("leads").where("createdAt", ">=", TS(yesterday)).get()),
      safeCount(db.collection("bookings").where("createdAt", ">=", TS(yesterday)).get()),
      safeCount(db.collection("tasks").where("status", "==", "done").where("updatedAt", ">=", TS(yesterday)).get()),
      safeCount(db.collection("contacts").where("createdAt", ">=", TS(yesterday)).get()),
    ]);

    // Get upcoming bookings for today
    const todayStr = now.toISOString().split("T")[0];
    const todaysBookings = await db
      .collection("bookings")
      .where("date", "==", todayStr)
      .where("status", "in", ["pending", "confirmed"])
      .get();

    const bookingList = todaysBookings.docs.map((d) => {
      const b = d.data();
      return `• ${b.time || "TBD"} — ${b.name} (${b.service})`;
    });

    // Build digest HTML
    const html = `
      <div style="font-family: Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #005148; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">CreedaVA Daily Digest</h1>
          <p style="margin: 4px 0 0; opacity: 0.8;">${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <div style="padding: 20px; background: #f9fbff; border: 1px solid #e0e8f5;">
          <h2 style="color: #002D72; font-size: 16px;">Yesterday's Activity</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px;">New Leads</td><td style="padding: 8px; font-weight: bold; text-align: right;">${newLeads}</td></tr>
            <tr><td style="padding: 8px;">New Bookings</td><td style="padding: 8px; font-weight: bold; text-align: right;">${newBookings}</td></tr>
            <tr><td style="padding: 8px;">Tasks Completed</td><td style="padding: 8px; font-weight: bold; text-align: right;">${tasksDone}</td></tr>
            <tr><td style="padding: 8px;">New Contacts</td><td style="padding: 8px; font-weight: bold; text-align: right;">${newContacts}</td></tr>
          </table>
          ${
            bookingList.length > 0
              ? `<h2 style="color: #002D72; font-size: 16px; margin-top: 20px;">Today's Bookings</h2>
                 <div style="background: white; padding: 12px; border-radius: 8px;">${bookingList.join("<br>")}</div>`
              : `<p style="color: #666; margin-top: 20px;">No bookings scheduled for today.</p>`
          }
        </div>
        <div style="padding: 12px; text-align: center; color: #888; font-size: 12px;">
          CreedaVA — Virtual Assistant Services
        </div>
      </div>
    `;

    // Save digest to Firestore
    await db.collection("reports").add({
      title: `Daily Digest — ${now.toLocaleDateString()}`,
      type: "daily",
      category: "scheduled",
      summaryHtml: html,
      highlights: [
        `${newLeads} new leads`,
        `${newBookings} new bookings`,
        `${tasksDone} tasks completed`,
        `${bookingList.length} bookings today`,
      ],
      recommendations: [],
      createdAt: now,
      source: "cloud-function",
    });

    // Try to send via email if configured
    try {
      const [transport, emailConfig] = await Promise.all([
        getEmailTransport(),
        getIntegrationConfig("email"),
      ]);
      if (transport) {
        await transport.sendMail({
          from: `"CreedaVA" <${emailConfig?.config.user || "admin@creedava.com"}>`,
          to: emailConfig?.config.user || "admin@creedava.com",
          subject: `CreedaVA Daily Digest — ${now.toLocaleDateString()}`,
          html,
        });
      }
    } catch (emailErr) {
      console.warn("Daily digest email failed:", emailErr);
    }

    console.log("Daily digest generated successfully");
  },
);

// ─── Weekly Report ───────────────────────────────────
// Runs every Monday at midnight Belize time (UTC-6)

export const weeklyReport = onSchedule(
  {
    schedule: "0 0 * * 1",
    timeZone: "America/Belize",
    region: "us-east4",
  },
  async () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Gather weekly stats (each query degrades gracefully on failure)
    const [leads, bookings, tasks, customers, campaigns] = await Promise.all([
      db.collection("leads").where("createdAt", ">=", TS(weekAgo)).get().catch(emptySafe),
      db.collection("bookings").where("createdAt", ">=", TS(weekAgo)).get().catch(emptySafe),
      db.collection("tasks").where("createdAt", ">=", TS(weekAgo)).get().catch(emptySafe),
      db.collection("customers").get().catch(emptySafe),
      db.collection("campaigns").where("status", "==", "active").get().catch(emptySafe),
    ]);

    const leadsWon = leads.docs.filter((d) => d.data().status === "won").length;
    const pipelineValue = leads.docs
      .filter((d) => !["won", "lost"].includes(d.data().status))
      .reduce((s, d) => s + (d.data().value || 0), 0);
    const activeCustomers = customers.docs.filter(
      (d) => d.data().status === "active",
    ).length;
    const mrr = customers.docs
      .filter((d) => d.data().status === "active")
      .reduce((s, d) => s + (d.data().monthlyValue || 0), 0);

    const html = `
      <div style="font-family: Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #005148; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">CreedaVA Weekly Report</h1>
          <p style="margin: 4px 0 0; opacity: 0.8;">Week ending ${now.toLocaleDateString()}</p>
        </div>
        <div style="padding: 20px; background: #f9fbff; border: 1px solid #e0e8f5;">
          <h2 style="color: #002D72;">📊 Key Metrics</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px;">New Leads</td><td style="padding: 8px; font-weight: bold; text-align: right;">${leads.size}</td></tr>
            <tr><td style="padding: 8px;">Leads Won</td><td style="padding: 8px; font-weight: bold; text-align: right; color: #005148;">${leadsWon}</td></tr>
            <tr><td style="padding: 8px;">Pipeline Value</td><td style="padding: 8px; font-weight: bold; text-align: right;">$${pipelineValue.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px;">New Bookings</td><td style="padding: 8px; font-weight: bold; text-align: right;">${bookings.size}</td></tr>
            <tr><td style="padding: 8px;">Tasks Created</td><td style="padding: 8px; font-weight: bold; text-align: right;">${tasks.size}</td></tr>
            <tr><td style="padding: 8px;">Active Customers</td><td style="padding: 8px; font-weight: bold; text-align: right;">${activeCustomers}</td></tr>
            <tr><td style="padding: 8px;">MRR</td><td style="padding: 8px; font-weight: bold; text-align: right; color: #005148;">$${mrr.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px;">Active Campaigns</td><td style="padding: 8px; font-weight: bold; text-align: right;">${campaigns.size}</td></tr>
          </table>
        </div>
      </div>
    `;

    await db.collection("reports").add({
      title: `Weekly Report — ${now.toLocaleDateString()}`,
      type: "weekly",
      category: "scheduled",
      summaryHtml: html,
      highlights: [
        `${leads.size} new leads (${leadsWon} won)`,
        `$${pipelineValue.toLocaleString()} pipeline value`,
        `${bookings.size} new bookings`,
        `$${mrr.toLocaleString()} MRR from ${activeCustomers} customers`,
      ],
      recommendations: [],
      createdAt: now,
      source: "cloud-function",
    });

    console.log("Weekly report generated successfully");
  },
);

// ─── Monthly Report ──────────────────────────────────
// Runs on the 1st of every month at midnight Belize time (UTC-6)

export const monthlyReport = onSchedule(
  {
    schedule: "0 0 1 * *",
    timeZone: "America/Belize",
    region: "us-east4",
  },
  async () => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthName = prevMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

    // Gather monthly stats (each query degrades gracefully on failure)
    const [leads, bookings, tasks, customers, campaigns, blog] = await Promise.all([
      db.collection("leads").where("createdAt", ">=", TS(monthAgo)).get().catch(emptySafe),
      db.collection("bookings").where("createdAt", ">=", TS(monthAgo)).get().catch(emptySafe),
      db.collection("tasks").where("createdAt", ">=", TS(monthAgo)).get().catch(emptySafe),
      db.collection("customers").get().catch(emptySafe),
      db.collection("campaigns").get().catch(emptySafe),
      db.collection("blog").where("createdAt", ">=", TS(monthAgo)).get().catch(emptySafe),
    ]);

    const leadsWon = leads.docs.filter((d) => d.data().status === "won").length;
    const leadsLost = leads.docs.filter((d) => d.data().status === "lost").length;
    const pipelineValue = leads.docs
      .filter((d) => !["won", "lost"].includes(d.data().status))
      .reduce((s, d) => s + (d.data().value || 0), 0);
    const activeCustomers = customers.docs.filter(
      (d) => d.data().status === "active",
    ).length;
    const mrr = customers.docs
      .filter((d) => d.data().status === "active")
      .reduce((s, d) => s + (d.data().monthlyValue || 0), 0);
    const totalSpent = campaigns.docs.reduce(
      (s, d) => s + (d.data().spent || 0), 0,
    );
    const totalConversions = campaigns.docs.reduce(
      (s, d) => s + (d.data().conversions || 0), 0,
    );
    const bookingsCancelled = bookings.docs.filter(
      (d) => d.data().status === "cancelled",
    ).length;
    const blogPublished = blog.docs.filter(
      (d) => d.data().status === "published",
    ).length;
    const winRate = leads.size > 0
      ? ((leadsWon / leads.size) * 100).toFixed(1)
      : "0";

    const html = `
      <div style="font-family: Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #005148; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">CreedaVA Monthly Report</h1>
          <p style="margin: 4px 0 0; opacity: 0.8;">${monthName}</p>
        </div>
        <div style="padding: 20px; background: #f9fbff; border: 1px solid #e0e8f5;">
          <h2 style="color: #002D72;">📈 Pipeline & Revenue</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px;">New Leads</td><td style="padding: 8px; font-weight: bold; text-align: right;">${leads.size}</td></tr>
            <tr><td style="padding: 8px;">Won / Lost</td><td style="padding: 8px; font-weight: bold; text-align: right; color: #005148;">${leadsWon} / ${leadsLost}</td></tr>
            <tr><td style="padding: 8px;">Win Rate</td><td style="padding: 8px; font-weight: bold; text-align: right;">${winRate}%</td></tr>
            <tr><td style="padding: 8px;">Pipeline Value</td><td style="padding: 8px; font-weight: bold; text-align: right;">$${pipelineValue.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px;">MRR</td><td style="padding: 8px; font-weight: bold; text-align: right; color: #005148;">$${mrr.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px;">ARR (projected)</td><td style="padding: 8px; font-weight: bold; text-align: right;">$${(mrr * 12).toLocaleString()}</td></tr>
          </table>
          <h2 style="color: #002D72; margin-top: 16px;">📊 Activity</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px;">Bookings</td><td style="padding: 8px; font-weight: bold; text-align: right;">${bookings.size} (${bookingsCancelled} cancelled)</td></tr>
            <tr><td style="padding: 8px;">Tasks Created</td><td style="padding: 8px; font-weight: bold; text-align: right;">${tasks.size}</td></tr>
            <tr><td style="padding: 8px;">Active Customers</td><td style="padding: 8px; font-weight: bold; text-align: right;">${activeCustomers}</td></tr>
            <tr><td style="padding: 8px;">Blog Posts Published</td><td style="padding: 8px; font-weight: bold; text-align: right;">${blogPublished}</td></tr>
            <tr><td style="padding: 8px;">Campaign Spend</td><td style="padding: 8px; font-weight: bold; text-align: right;">$${totalSpent.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px;">Campaign Conversions</td><td style="padding: 8px; font-weight: bold; text-align: right;">${totalConversions}</td></tr>
          </table>
        </div>
        <div style="padding: 12px; text-align: center; color: #888; font-size: 12px;">
          CreedaVA — Virtual Assistant Services
        </div>
      </div>
    `;

    await db.collection("reports").add({
      title: `Monthly Report — ${monthName}`,
      type: "monthly",
      category: "scheduled",
      summaryHtml: html,
      highlights: [
        `${leads.size} leads, ${winRate}% win rate`,
        `$${mrr.toLocaleString()} MRR ($${(mrr * 12).toLocaleString()} ARR)`,
        `${bookings.size} bookings (${bookingsCancelled} cancelled)`,
        `${blogPublished} blog posts published`,
        `$${totalSpent.toLocaleString()} campaign spend → ${totalConversions} conversions`,
      ],
      recommendations: [],
      createdAt: now,
      source: "cloud-function",
    });

    // Try to send monthly email
    try {
      const [transport, emailConfig] = await Promise.all([
        getEmailTransport(),
        getIntegrationConfig("email"),
      ]);
      if (transport) {
        await transport.sendMail({
          from: `"CreedaVA" <${emailConfig?.config.user || "admin@creedava.com"}>`,
          to: emailConfig?.config.user || "admin@creedava.com",
          subject: `CreedaVA Monthly Report — ${monthName}`,
          html,
        });
      }
    } catch (emailErr) {
      console.warn("Monthly report email failed:", emailErr);
    }

    console.log("Monthly report generated successfully");
  },
);

// ─── Daily Google Sync ───────────────────────────────
// Runs at 6 AM daily — pulls fresh data from all configured Google services
// so the admin dashboard reflects real numbers without manual "Sync" clicks.

export const dailyGoogleSync = onSchedule(
  {
    schedule: "0 6 * * *",
    timeZone: "America/Belize",
    region: "us-east4",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async () => {
    const results: { service: string; status: string; detail?: string }[] = [];

    // ── 1) Sync Google Ads campaigns ──────────────
    try {
      const adsConfig = await getIntegrationConfig("google-ads");
      if (adsConfig?.enabled) {
        const { google } = await import("googleapis");
        const oauth2Client = new google.auth.OAuth2(
          adsConfig.config.clientId,
          adsConfig.config.clientSecret,
        );
        oauth2Client.setCredentials({ refresh_token: adsConfig.config.refreshToken });
        const accessToken = (await oauth2Client.getAccessToken()).token;
        const customerId = adsConfig.config.customerId.replace(/-/g, "");

        const response = await fetch(
          `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`,
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
        }
      }
    } catch (err) {
      results.push({ service: "Google Ads", status: "error", detail: (err as Error).message });
    }

    // ── 2) Sync Search Console data ───────────────
    try {
      const scConfig = await getIntegrationConfig("search-console");
      if (scConfig?.enabled) {
        const { google } = await import("googleapis");
        const { config } = scConfig;
        const key = JSON.parse(config.serviceAccountKey);
        const authClient = new google.auth.JWT({
          email: key.client_email, key: key.private_key,
          scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
        });
        const searchconsole = google.searchconsole({ version: "v1", auth: authClient });

        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];

        const queryResult = await searchconsole.searchanalytics.query({
          siteUrl: config.siteUrl,
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
        const { google } = await import("googleapis");
        const { config } = gaConfig;
        const key = JSON.parse(config.serviceAccountKey);
        const authClient = new google.auth.JWT({
          email: key.client_email, key: key.private_key,
          scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
        });
        const creds = await authClient.authorize();
        const token = creds.access_token!;
        const propertyName = toGA4PropertyResourceName(config.propertyId);

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
        }
      }
    } catch (err) {
      results.push({ service: "GA4 Analytics", status: "error", detail: (err as Error).message });
    }

    // ── 4) Sync Business Profile reviews ──────────
    try {
      const bpConfig = await getIntegrationConfig("google-business");
      if (bpConfig?.enabled && bpConfig.config?.serviceAccountKey) {
        const { google } = await import("googleapis");
        const { config } = bpConfig;
        const key = JSON.parse(config.serviceAccountKey);
        const authClient = new google.auth.JWT({
          email: key.client_email, key: key.private_key,
          scopes: ["https://www.googleapis.com/auth/business.manage"],
        });
        const creds = await authClient.authorize();
        const token = creds.access_token!;

        const reviewsUrl = `https://mybusiness.googleapis.com/v4/accounts/${config.accountId}/locations/${config.locationId}/reviews`;
        const reviewsRes = await fetch(reviewsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

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
        }
      }
    } catch (err) {
      results.push({ service: "Business Reviews", status: "error", detail: (err as Error).message });
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

// ─── Weekly AI SEO Review ────────────────────────────────────
// Proactive SEO monitoring — runs every Monday at 9 AM Belize time.
// Compares current Search Console data to the previous week's snapshot
// and writes actionable insights to the `ai-insights` collection.

export const weeklyAISEOReview = onSchedule(
  {
    schedule: "0 9 * * 1",
    timeZone: "America/Belize",
    region: "us-east4",
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async () => {
    const insights: { title: string; description: string; severity: "info" | "warning" | "critical" | "positive"; area: "seo" }[] = [];

    try {
      // ── 1) Fetch current Search Console snapshot ──
      const scConfig = await getIntegrationConfig("search-console");
      if (!scConfig?.enabled) {
        console.log("Weekly SEO Review: Search Console not configured, skipping.");
        return;
      }

      const { google } = await import("googleapis");
      const key = JSON.parse(scConfig.config.serviceAccountKey);
      const authClient = new google.auth.JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      });
      const searchconsole = google.searchconsole({ version: "v1", auth: authClient });
      const siteUrl = scConfig.config.siteUrl || "https://creedava.com";

      // Current week (last 7 days)
      const now = new Date();
      const weekAgoStart = new Date(now.getTime() - 7 * 86400000);
      const twoWeeksAgoStart = new Date(now.getTime() - 14 * 86400000);
      const fmt = (d: Date) => d.toISOString().split("T")[0];

      const [currentResult, previousResult] = await Promise.all([
        searchconsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: fmt(weekAgoStart),
            endDate: fmt(now),
            dimensions: ["query"],
            rowLimit: 50,
            type: "web",
          },
        }),
        searchconsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: fmt(twoWeeksAgoStart),
            endDate: fmt(weekAgoStart),
            dimensions: ["query"],
            rowLimit: 50,
            type: "web",
          },
        }),
      ]);

      const currentQueries = (currentResult.data.rows || []).map((r) => ({
        query: r.keys?.[0] || "",
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position: r.position || 0,
      }));

      const previousQueries = (previousResult.data.rows || []).map((r) => ({
        query: r.keys?.[0] || "",
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position: r.position || 0,
      }));

      // Build previous week lookup
      const prevMap = new Map(previousQueries.map((q) => [q.query, q]));

      // ── 2) Analyze ranking changes ──
      const totalClicksCurrent = currentQueries.reduce((s, q) => s + q.clicks, 0);
      const totalClicksPrevious = previousQueries.reduce((s, q) => s + q.clicks, 0);
      const totalImprCurrent = currentQueries.reduce((s, q) => s + q.impressions, 0);
      const totalImprPrevious = previousQueries.reduce((s, q) => s + q.impressions, 0);

      // Overall traffic change
      if (totalClicksPrevious > 0) {
        const clickChange = ((totalClicksCurrent - totalClicksPrevious) / totalClicksPrevious) * 100;
        if (clickChange <= -20) {
          insights.push({
            title: "Significant traffic drop detected",
            description: `Total search clicks dropped ${Math.abs(clickChange).toFixed(1)}% week-over-week (${totalClicksPrevious} → ${totalClicksCurrent}). Investigate potential indexing issues or algorithm updates.`,
            severity: "critical",
            area: "seo",
          });
        } else if (clickChange <= -5) {
          insights.push({
            title: "Search traffic declining",
            description: `Search clicks decreased ${Math.abs(clickChange).toFixed(1)}% week-over-week (${totalClicksPrevious} → ${totalClicksCurrent}). Monitor closely for continued decline.`,
            severity: "warning",
            area: "seo",
          });
        } else if (clickChange >= 15) {
          insights.push({
            title: "Search traffic growing",
            description: `Search clicks increased ${clickChange.toFixed(1)}% week-over-week (${totalClicksPrevious} → ${totalClicksCurrent}). Content strategy is working well.`,
            severity: "positive",
            area: "seo",
          });
        }
      }

      // Impression change
      if (totalImprPrevious > 0) {
        const imprChange = ((totalImprCurrent - totalImprPrevious) / totalImprPrevious) * 100;
        if (imprChange >= 20) {
          insights.push({
            title: "Search visibility improving",
            description: `Impressions up ${imprChange.toFixed(1)}% (${totalImprPrevious.toLocaleString()} → ${totalImprCurrent.toLocaleString()}). Pages are reaching more searches.`,
            severity: "positive",
            area: "seo",
          });
        } else if (imprChange <= -15) {
          insights.push({
            title: "Search visibility declining",
            description: `Impressions down ${Math.abs(imprChange).toFixed(1)}% (${totalImprPrevious.toLocaleString()} → ${totalImprCurrent.toLocaleString()}). Consider refreshing meta titles/descriptions.`,
            severity: "warning",
            area: "seo",
          });
        }
      }

      // Per-query ranking drops (position worsened by 5+ spots)
      const rankingDrops: string[] = [];
      const rankingGains: string[] = [];
      for (const q of currentQueries) {
        const prev = prevMap.get(q.query);
        if (!prev) continue;
        const posDelta = q.position - prev.position; // higher = worse
        if (posDelta >= 5) {
          rankingDrops.push(`"${q.query}" dropped from position ${prev.position.toFixed(1)} → ${q.position.toFixed(1)}`);
        } else if (posDelta <= -5) {
          rankingGains.push(`"${q.query}" improved from position ${prev.position.toFixed(1)} → ${q.position.toFixed(1)}`);
        }
      }

      if (rankingDrops.length > 0) {
        insights.push({
          title: `${rankingDrops.length} keyword${rankingDrops.length > 1 ? "s" : ""} lost ranking`,
          description: `The following keywords dropped 5+ positions:\\n${rankingDrops.slice(0, 5).join("\\n")}${rankingDrops.length > 5 ? `\\n...and ${rankingDrops.length - 5} more` : ""}`,
          severity: rankingDrops.length >= 3 ? "critical" : "warning",
          area: "seo",
        });
      }

      if (rankingGains.length > 0) {
        insights.push({
          title: `${rankingGains.length} keyword${rankingGains.length > 1 ? "s" : ""} gained ranking`,
          description: `The following keywords improved 5+ positions:\\n${rankingGains.slice(0, 5).join("\\n")}${rankingGains.length > 5 ? `\\n...and ${rankingGains.length - 5} more` : ""}`,
          severity: "positive",
          area: "seo",
        });
      }

      // New keyword opportunities (appeared this week, not last)
      const newKeywords = currentQueries.filter((q) => !prevMap.has(q.query) && q.impressions >= 10);
      if (newKeywords.length > 0) {
        insights.push({
          title: `${newKeywords.length} new keyword${newKeywords.length > 1 ? "s" : ""} discovered`,
          description: `New search queries driving impressions:\\n${newKeywords.slice(0, 5).map((q) => `"${q.query}" — ${q.impressions} impr, pos ${q.position.toFixed(1)}`).join("\\n")}`,
          severity: "info",
          area: "seo",
        });
      }

      // ── 3) Check for content gaps ──
      // Pages with high impressions but very low CTR → need better titles/descriptions
      const lowCTR = currentQueries.filter((q) => q.impressions >= 50 && q.ctr < 0.02);
      if (lowCTR.length > 0) {
        insights.push({
          title: `${lowCTR.length} keyword${lowCTR.length > 1 ? "s" : ""} with low CTR despite high impressions`,
          description: `These keywords get shown but rarely clicked — optimize meta titles and descriptions:\\n${lowCTR.slice(0, 5).map((q) => `"${q.query}" — ${q.impressions} impr, ${(q.ctr * 100).toFixed(2)}% CTR`).join("\\n")}`,
          severity: "warning",
          area: "seo",
        });
      }

      // If no insights were generated, add a positive summary
      if (insights.length === 0) {
        insights.push({
          title: "SEO performance stable",
          description: `Weekly review found no significant changes. Total clicks: ${totalClicksCurrent}, impressions: ${totalImprCurrent.toLocaleString()}.`,
          severity: "info",
          area: "seo",
        });
      }

    } catch (err) {
      console.error("Weekly SEO Review failed:", err);
      insights.push({
        title: "Weekly SEO Review failed",
        description: `Could not complete the automated SEO review: ${err instanceof Error ? err.message : "Unknown error"}. Check Search Console integration settings.`,
        severity: "warning",
        area: "seo",
      });
    }

    // ── 4) Write all insights to Firestore ──
    const batch = db.batch();
    for (const insight of insights) {
      const ref = db.collection("ai-insights").doc();
      batch.set(ref, {
        ...insight,
        pinned: false,
        dismissed: false,
        createdAt: new Date(),
        source: "weekly-seo-review",
      });
    }
    await batch.commit();

    console.log(`Weekly SEO Review: wrote ${insights.length} insight(s) to ai-insights`);
  },
);

// ─── Analytics TTL Cleanup ──────────────────────────────────
// Deletes `analytics` collection docs older than 90 days to control
// Firestore storage costs. Runs nightly at 2 AM Belize time.

export const cleanupAnalytics = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "America/Belize",
    region: "us-east4",
  },
  async () => {
    const cutoff = TS(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
    const snap = await db.collection("analytics").where("createdAt", "<", cutoff).get();
    const BATCH_SIZE = 500;
    let deleted = 0;
    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      snap.docs.slice(i, i + BATCH_SIZE).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      deleted += Math.min(BATCH_SIZE, snap.docs.length - i);
    }
    console.log(`Analytics cleanup: deleted ${deleted} docs older than 90 days`);
  },
);
