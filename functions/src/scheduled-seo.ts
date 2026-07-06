/**
 * Scheduled SEO Review — proactive SEO monitoring runs every Monday at 9 AM Belize time.
 * Compares current Search Console data to previous week's snapshot
 * and writes actionable insights to the `ai-insights` collection.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { google } from "googleapis";
import { db, getIntegrationConfig } from "./admin";
import { functionOptions } from "./config";

// ─── Weekly AI SEO Review ────────────────────────────────────
// Runs every Monday at 9 AM Belize time.

export const weeklyAISEOReview = onSchedule(
  {
    schedule: "0 9 * * 1",
    ...functionOptions.scheduledHeavy,
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
          description: `The following keywords dropped 5+ positions:\n${rankingDrops.slice(0, 5).join("\n")}${rankingDrops.length > 5 ? `\n...and ${rankingDrops.length - 5} more` : ""}`,
          severity: rankingDrops.length >= 3 ? "critical" : "warning",
          area: "seo",
        });
      }

      if (rankingGains.length > 0) {
        insights.push({
          title: `${rankingGains.length} keyword${rankingGains.length > 1 ? "s" : ""} gained ranking`,
          description: `The following keywords improved 5+ positions:\n${rankingGains.slice(0, 5).join("\n")}${rankingGains.length > 5 ? `\n...and ${rankingGains.length - 5} more` : ""}`,
          severity: "positive",
          area: "seo",
        });
      }

      // New keyword opportunities (appeared this week, not last)
      const newKeywords = currentQueries.filter((q) => !prevMap.has(q.query) && q.impressions >= 10);
      if (newKeywords.length > 0) {
        insights.push({
          title: `${newKeywords.length} new keyword${newKeywords.length > 1 ? "s" : ""} discovered`,
          description: `New search queries driving impressions:\n${newKeywords.slice(0, 5).map((q) => `"${q.query}" — ${q.impressions} impr, pos ${q.position.toFixed(1)}`).join("\n")}`,
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
          description: `These keywords get shown but rarely clicked — optimize meta titles and descriptions:\n${lowCTR.slice(0, 5).map((q) => `"${q.query}" — ${q.impressions} impr, ${(q.ctr * 100).toFixed(2)}% CTR`).join("\n")}`,
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