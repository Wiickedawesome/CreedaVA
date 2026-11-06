/**
 * Scheduled Report Functions — daily/weekly/monthly digest emails.
 * Runs on a cron schedule to keep the team informed without manual effort.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";
import { db, getIntegrationConfig, getEmailTransport } from "./admin";
import { functionOptions } from "./config";

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
    ...functionOptions.scheduled,
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
          <h2 style="color: #0B2135; font-size: 16px;">Yesterday's Activity</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px;">New Leads</td><td style="padding: 8px; font-weight: bold; text-align: right;">${newLeads}</td></tr>
            <tr><td style="padding: 8px;">New Bookings</td><td style="padding: 8px; font-weight: bold; text-align: right;">${newBookings}</td></tr>
            <tr><td style="padding: 8px;">Tasks Completed</td><td style="padding: 8px; font-weight: bold; text-align: right;">${tasksDone}</td></tr>
            <tr><td style="padding: 8px;">New Contacts</td><td style="padding: 8px; font-weight: bold; text-align: right;">${newContacts}</td></tr>
          </table>
          ${
            bookingList.length > 0
              ? `<h2 style="color: #0B2135; font-size: 16px; margin-top: 20px;">Today's Bookings</h2>
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
    ...functionOptions.scheduled,
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
          <h2 style="color: #0B2135;">📊 Key Metrics</h2>
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
    ...functionOptions.scheduled,
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
          <h2 style="color: #0B2135;">📈 Pipeline & Revenue</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px;">New Leads</td><td style="padding: 8px; font-weight: bold; text-align: right;">${leads.size}</td></tr>
            <tr><td style="padding: 8px;">Won / Lost</td><td style="padding: 8px; font-weight: bold; text-align: right; color: #005148;">${leadsWon} / ${leadsLost}</td></tr>
            <tr><td style="padding: 8px;">Win Rate</td><td style="padding: 8px; font-weight: bold; text-align: right;">${winRate}%</td></tr>
            <tr><td style="padding: 8px;">Pipeline Value</td><td style="padding: 8px; font-weight: bold; text-align: right;">$${pipelineValue.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px;">MRR</td><td style="padding: 8px; font-weight: bold; text-align: right; color: #005148;">$${mrr.toLocaleString()}</td></tr>
            <tr><td style="padding: 8px;">ARR (projected)</td><td style="padding: 8px; font-weight: bold; text-align: right;">$${(mrr * 12).toLocaleString()}</td></tr>
          </table>
          <h2 style="color: #0B2135; margin-top: 16px;">📊 Activity</h2>
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