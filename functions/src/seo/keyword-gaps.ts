/**
 * Keyword gap analysis skill (Tuesday).
 *
 * Two passes:
 *   1. Striking-distance — Search Console queries with position 11–30, ≥30
 *      impressions, that aren't already a tracked /keywords entry.
 *   2. Competitor-only — Custom Search probes for top tracked keywords;
 *      flag domains other than creedava.com that consistently appear.
 *
 * Quota: ~80 Custom Search queries.
 */

import { db, getIntegrationConfig } from "../admin";
import { searchWithQuota } from "./search";
import type { SkillContext, SkillResult } from "./types";

const KNOWN_COMPETITORS = [
  "belaysolutions.com",
  "timeetc.com",
  "boldly.com",
  "wishup.co",
  "myoutdesk.com",
  "fancyhands.com",
  "zirtual.com",
  "magic.com",
];

export async function runKeywordGaps(ctx: SkillContext): Promise<SkillResult> {
  const findings: { id: string; data: Record<string, unknown> }[] = [];

  // ── 1) Pull last 28 days from Search Console for striking-distance pass ──
  const scConfig = await getIntegrationConfig("search-console");
  if (!scConfig?.enabled) {
    return {
      status: "skipped",
      findings: 0,
      queriesUsed: ctx.queriesUsed(),
      summary: { reason: "search-console-disabled" },
    };
  }

  let queries: { query: string; clicks: number; impressions: number; ctr: number; position: number; page?: string }[] = [];
  try {
    const { google } = await import("googleapis");
    const key = JSON.parse(scConfig.config.serviceAccountKey);
    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });
    const sc = google.searchconsole({ version: "v1", auth });
    const siteUrl = scConfig.config.siteUrl || "https://creedava.com";

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 28 * 86_400_000);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const queryResult = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmt(startDate),
        endDate: fmt(endDate),
        dimensions: ["query", "page"],
        rowLimit: 200,
        type: "web",
      },
    });
    queries = (queryResult.data.rows ?? []).map((r) => ({
      query: r.keys?.[0] ?? "",
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

  // Existing tracked keywords (case-insensitive set).
  const tracked = new Set<string>();
  try {
    const snap = await db.collection("keywords").get();
    for (const d of snap.docs) {
      const k = (d.data().keyword as string | undefined)?.toLowerCase().trim();
      if (k) tracked.add(k);
    }
  } catch {
    /* ignore — gaps will still be useful */
  }

  // Striking distance: position 11–30, ≥30 impressions.
  const striking = queries.filter(
    (q) => q.position >= 11 && q.position <= 30 && q.impressions >= 30,
  );
  for (const q of striking) {
    const id = `striking_${slug(q.query)}`;
    findings.push({
      id,
      data: {
        keyword: q.query,
        type: "striking-distance",
        currentPosition: q.position,
        impressions: q.impressions,
        clicks: q.clicks,
        ctr: q.ctr,
        rankingPage: q.page,
        priority: priorityFromStriking(q.impressions, q.position),
        capturedAt: new Date().toISOString(),
      },
    });
  }

  // Low CTR (>=200 impressions, CTR <2%) — opportunity for meta rewrite.
  const lowCtr = queries.filter((q) => q.impressions >= 200 && q.ctr < 0.02);
  for (const q of lowCtr) {
    const id = `lowctr_${slug(q.query)}`;
    findings.push({
      id,
      data: {
        keyword: q.query,
        type: "low-ctr",
        currentPosition: q.position,
        impressions: q.impressions,
        clicks: q.clicks,
        ctr: q.ctr,
        rankingPage: q.page,
        priority: Math.min(100, Math.round(q.impressions / 20)),
        capturedAt: new Date().toISOString(),
      },
    });
  }

  // ── 2) Competitor-only — probe top tracked keywords for competitor pages ──
  const cursorOffset = ctx.cursor?.offset ?? 0;
  const trackedList = [...tracked];
  let probedFromOffset = cursorOffset;
  let probed = 0;

  for (let i = cursorOffset; i < trackedList.length; i++) {
    if (!ctx.hasQuota()) break;
    const kw = trackedList[i];
    const hits = await searchWithQuota(ctx, kw, 10);
    probedFromOffset = i + 1;
    if (hits === null) {
      // quota exhausted mid-call; we should resume next time on this index
      probedFromOffset = i;
      break;
    }
    probed++;
    const competitorHits = hits.filter((h) => {
      const domain = (h.displayLink || safeDomain(h.link)).toLowerCase();
      return (
        KNOWN_COMPETITORS.some((c) => domain.includes(c)) &&
        !domain.includes("creedava.com")
      );
    });
    if (competitorHits.length > 0) {
      const id = `competitor_${slug(kw)}`;
      findings.push({
        id,
        data: {
          keyword: kw,
          type: "competitor-only",
          competitorPages: competitorHits.map((h) => ({
            domain: h.displayLink || safeDomain(h.link),
            url: h.link,
          })),
          priority: 70,
          capturedAt: new Date().toISOString(),
        },
      });
    }
  }

  // Persist findings.
  let written = 0;
  for (const f of findings) {
    try {
      await db.collection("keyword-gaps").doc(f.id).set(
        { ...f.data, createdAt: new Date(), updatedAt: new Date() },
        { merge: true },
      );
      written++;
    } catch (err) {
      console.warn("[keyword-gaps] persist failed:", err);
    }
  }

  const reachedEnd = probedFromOffset >= trackedList.length;
  return {
    status: reachedEnd ? "ok" : "partial",
    findings: written,
    queriesUsed: ctx.queriesUsed(),
    cursor: reachedEnd ? null : { offset: probedFromOffset },
    summary: {
      striking: striking.length,
      lowCtr: lowCtr.length,
      competitorProbed: probed,
      competitorRemaining: Math.max(0, trackedList.length - probedFromOffset),
    },
  };
}

function priorityFromStriking(impressions: number, position: number): number {
  // Closer to page 1 = higher priority. ~20 impressions ≈ 1 priority point.
  const impScore = Math.min(70, Math.round(impressions / 20));
  const posBonus = position <= 15 ? 25 : position <= 20 ? 15 : 5;
  return Math.min(100, impScore + posBonus);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 200);
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
