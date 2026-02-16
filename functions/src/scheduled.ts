/**
 * Scheduled Cloud Functions — automated daily/weekly reports & notifications.
 *
 * Also handles scheduled sync from Google services so data stays fresh
 * without manual button clicks.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { db, getIntegrationConfig } from "./admin";
import * as nodemailer from "nodemailer";

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

    // Gather daily stats
    const [newLeads, newBookings, tasksDone, newContacts] = await Promise.all([
      db
        .collection("leads")
        .where("createdAt", ">=", yesterday)
        .get()
        .then((s) => s.size),
      db
        .collection("bookings")
        .where("createdAt", ">=", yesterday)
        .get()
        .then((s) => s.size),
      db
        .collection("tasks")
        .where("status", "==", "done")
        .where("updatedAt", ">=", yesterday)
        .get()
        .then((s) => s.size),
      db
        .collection("contacts")
        .where("createdAt", ">=", yesterday)
        .get()
        .then((s) => s.size),
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
      const emailConfig = await getIntegrationConfig("email");
      if (emailConfig?.enabled) {
        const transport = nodemailer.createTransport({
          host: emailConfig.config.host || "smtp.gmail.com",
          port: parseInt(emailConfig.config.port || "587"),
          secure: emailConfig.config.port === "465",
          auth: {
            user: emailConfig.config.user,
            pass: emailConfig.config.pass,
          },
        });

        await transport.sendMail({
          from: `"CreedaVA" <${emailConfig.config.user}>`,
          to: emailConfig.config.user, // Send to admin
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
// Runs every Monday at 9 AM Belize time

export const weeklyReport = onSchedule(
  {
    schedule: "0 9 * * 1",
    timeZone: "America/Belize",
    region: "us-east4",
  },
  async () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Gather weekly stats
    const [leads, bookings, tasks, customers, campaigns] = await Promise.all([
      db.collection("leads").where("createdAt", ">=", weekAgo).get(),
      db.collection("bookings").where("createdAt", ">=", weekAgo).get(),
      db.collection("tasks").where("createdAt", ">=", weekAgo).get(),
      db.collection("customers").get(),
      db.collection("campaigns").where("status", "==", "active").get(),
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
        const propertyId = config.propertyId;

        const res = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
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
