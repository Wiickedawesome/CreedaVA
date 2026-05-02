/**
 * Rank-history snapshot skill (Monday).
 *
 * Pulls last 7 days of Search Console data with both query+page dimensions and
 * writes one rank-history doc per (keyword,page,day). Uses zero Custom Search
 * quota — only Search Console (free, separate quota).
 */

import { db, getIntegrationConfig } from "../admin";
import type { SkillContext, SkillResult } from "./types";

interface SCRow {
  keyword: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function runRankHistory(ctx: SkillContext): Promise<SkillResult> {
  const scConfig = await getIntegrationConfig("search-console");
  if (!scConfig?.enabled) {
    return {
      status: "skipped",
      findings: 0,
      queriesUsed: ctx.queriesUsed(),
      summary: { reason: "search-console-disabled" },
    };
  }

  let rows: SCRow[] = [];
  try {
    const { google } = await import("googleapis");
    const key = JSON.parse(scConfig.config.serviceAccountKey);
    const authClient = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    const sc = google.searchconsole({ version: "v1", auth: authClient });
    const siteUrl = scConfig.config.siteUrl || "https://creedava.com";

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 86_400_000);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const result = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ["query", "page"],
        rowLimit: 500,
        type: "web",
      },
    });

    rows = (result.data.rows ?? []).map((r) => ({
      keyword: r.keys?.[0] ?? "",
      page: r.keys?.[1] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));
  } catch (err) {
    return {
      status: "error",
      findings: 0,
      queriesUsed: ctx.queriesUsed(),
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Persist as one doc per (keyword,page,day). Use stable IDs so re-runs upsert.
  const dayKey = new Date().toISOString().split("T")[0];
  const batch = db.batch();
  let written = 0;
  for (const row of rows) {
    if (!row.keyword || !row.page) continue;
    const id = `${dayKey}__${slug(row.keyword)}__${slug(row.page)}`.slice(0, 380);
    const ref = db.collection("rank-history").doc(id);
    batch.set(
      ref,
      {
        keyword: row.keyword,
        page: row.page,
        position: row.position,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        capturedAt: new Date().toISOString(),
        dayKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true },
    );
    written++;
    // Firestore batch limit is 500.
    if (written % 450 === 0) {
      await batch.commit();
    }
  }
  if (written % 450 !== 0) {
    try {
      await batch.commit();
    } catch (err) {
      console.warn("[rank-history] batch commit failed:", err);
    }
  }

  return {
    status: "ok",
    findings: written,
    queriesUsed: ctx.queriesUsed(),
    summary: { rows: rows.length, written, dayKey },
  };
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
