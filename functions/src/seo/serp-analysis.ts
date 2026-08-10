/**
 * SERP analysis skill (Wednesday — replaces/augments citation audit slot).
 *
 * For each of the top tracked keywords, probes Brave Search for the #1–3
 * ranking pages, crawls them with cheerio, and compares word count, heading
 * structure, schema types, and image count against our equivalent page.
 *
 * Writes `competitor-content-gap` docs that the Sunday synthesizer converts
 * into targeted, actionable content-briefs.
 *
 * Quota: ~40–60 Brave Search queries + direct HTML fetches (free).
 */

import * as cheerio from "cheerio";
import { db } from "../admin";
import { searchWithQuota } from "./search";
import type { SkillContext, SkillResult } from "./types";

const OUR_DOMAIN = "creedava.com";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_KEYWORDS_PER_RUN = 20;

interface PageMetrics {
  url: string;
  wordCount: number;
  headingCount: number;
  imageCount: number;
  schemaTypes: string[];
}

async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CreedaVA-SEO-Agent/1.0 (+https://creedava.com)" },
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractMetrics(url: string, html: string): PageMetrics {
  const $ = cheerio.load(html);

  const text = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const headingCount = $("h1,h2,h3,h4").length;
  const imageCount = $("img").length;

  const schemaTypes: string[] = [];
  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const it of items) {
        const t = (it as Record<string, unknown>)["@type"];
        if (typeof t === "string") schemaTypes.push(t);
      }
    } catch {
      /* ignore */
    }
  });

  return { url, wordCount, headingCount, imageCount, schemaTypes };
}

export async function runSerpAnalysis(ctx: SkillContext): Promise<SkillResult> {
  // Load tracked keywords, ordered by priority/impressions.
  let trackedKeywords: { keyword: string; rankingPage?: string }[] = [];
  try {
    const snap = await db
      .collection("keywords")
      .orderBy("impressions", "desc")
      .limit(MAX_KEYWORDS_PER_RUN)
      .get();
    trackedKeywords = snap.docs.map((d) => ({
      keyword: (d.data().keyword as string) ?? "",
      rankingPage: d.data().rankingPage as string | undefined,
    })).filter((k) => k.keyword);
  } catch (err) {
    return {
      status: "error",
      findings: 0,
      queriesUsed: ctx.queriesUsed(),
      error: `Failed to load tracked keywords: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (trackedKeywords.length === 0) {
    return {
      status: "skipped",
      findings: 0,
      queriesUsed: ctx.queriesUsed(),
      summary: { reason: "no-tracked-keywords" },
    };
  }

  const startOffset = ctx.cursor?.offset ?? 0;
  let written = 0;
  let probed = 0;
  let lastIndex = startOffset;

  for (let i = startOffset; i < trackedKeywords.length; i++) {
    if (!ctx.hasQuota()) break;
    const { keyword, rankingPage } = trackedKeywords[i];
    lastIndex = i + 1;

    // Search for the keyword to find top-ranking competitor pages.
    const hits = await searchWithQuota(ctx, keyword, 5);
    if (hits === null) {
      lastIndex = i;
      break;
    }
    probed++;

    // Separate our page from competitor pages.
    const competitorHits = hits.filter((h) => {
      try {
        return !new URL(h.link).hostname.includes(OUR_DOMAIN);
      } catch {
        return true;
      }
    }).slice(0, 3);

    if (competitorHits.length === 0) continue;

    // Crawl top competitor pages and extract metrics.
    const competitorMetrics: PageMetrics[] = [];
    for (const hit of competitorHits) {
      const html = await fetchPage(hit.link);
      if (!html) continue;
      competitorMetrics.push(extractMetrics(hit.link, html));
    }

    if (competitorMetrics.length === 0) continue;

    // Average competitor metrics.
    const avgWordCount = Math.round(
      competitorMetrics.reduce((s, m) => s + m.wordCount, 0) / competitorMetrics.length,
    );
    const avgHeadings = Math.round(
      competitorMetrics.reduce((s, m) => s + m.headingCount, 0) / competitorMetrics.length,
    );
    const avgImages = Math.round(
      competitorMetrics.reduce((s, m) => s + m.imageCount, 0) / competitorMetrics.length,
    );
    const allSchemaTypes = [...new Set(competitorMetrics.flatMap((m) => m.schemaTypes))];

    // Fetch our page metrics if we have a ranking page.
    let ourMetrics: PageMetrics | null = null;
    if (rankingPage) {
      const ourUrl = rankingPage.startsWith("http") ? rankingPage : `https://creedava.com${rankingPage}`;
      const ourHtml = await fetchPage(ourUrl);
      if (ourHtml) {
        ourMetrics = extractMetrics(ourUrl, ourHtml);
      }
    }

    // Calculate priority based on gap severity.
    const wordGap = avgWordCount - (ourMetrics?.wordCount ?? 0);
    const headingGap = avgHeadings - (ourMetrics?.headingCount ?? 0);
    let priority = 50;
    if (wordGap > 500) priority += 20;
    else if (wordGap > 200) priority += 10;
    if (headingGap > 5) priority += 10;
    if (allSchemaTypes.length > 0 && (ourMetrics?.schemaTypes.length ?? 0) === 0) priority += 10;
    priority = Math.min(100, priority);

    // Only write a gap doc if there's a meaningful gap.
    if (wordGap <= 0 && headingGap <= 0 && allSchemaTypes.length === 0) continue;

    const docId = `serp_${slug(keyword)}`;
    try {
      await db.collection("competitor-content-gaps").doc(docId).set(
        {
          keyword,
          ourPage: rankingPage ?? null,
          ourWordCount: ourMetrics?.wordCount ?? 0,
          ourHeadings: ourMetrics?.headingCount ?? 0,
          ourImages: ourMetrics?.imageCount ?? 0,
          ourSchemaTypes: ourMetrics?.schemaTypes ?? [],
          competitorWordCount: avgWordCount,
          competitorHeadings: avgHeadings,
          competitorImages: avgImages,
          competitorSchemaTypes: allSchemaTypes,
          competitorPages: competitorMetrics.map((m) => ({
            url: m.url,
            wordCount: m.wordCount,
            headingCount: m.headingCount,
            imageCount: m.imageCount,
            schemaTypes: m.schemaTypes,
          })),
          priority,
          capturedAt: new Date().toISOString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
      written++;
    } catch (err) {
      console.warn("[serp-analysis] persist failed:", err);
    }
  }

  const reachedEnd = lastIndex >= trackedKeywords.length;
  return {
    status: reachedEnd ? "ok" : "partial",
    findings: written,
    queriesUsed: ctx.queriesUsed(),
    cursor: reachedEnd ? null : { offset: lastIndex },
    summary: {
      keywordsProbed: probed,
      gapsWritten: written,
      total: trackedKeywords.length,
    },
  };
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 200);
}
