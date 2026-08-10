/**
 * Citation / AIO readiness audit (Wednesday).
 *
 * For each sitemap URL, score how well the page is structured for LLM citation
 * by AI Overviews / Perplexity / ChatGPT. We probe Google for "People Also Ask"
 * style queries from on-site H1/H2 to estimate PAA coverage.
 *
 * Quota: ~80 Custom Search queries (one per page sampled).
 */

import * as cheerio from "cheerio";
import { db } from "../admin";
import { loadSitemap, urlToPathKey } from "./sitemap";
import { searchWithQuota } from "./search";
import type { SkillContext, SkillResult } from "./types";

const FETCH_TIMEOUT_MS = 12_000;

export async function runCitationAudit(ctx: SkillContext): Promise<SkillResult> {
  const sitemap = await loadSitemap();
  if (sitemap.length === 0) {
    return { status: "skipped", findings: 0, queriesUsed: ctx.queriesUsed(), summary: { reason: "empty-sitemap" } };
  }

  const startOffset = ctx.cursor?.offset ?? 0;
  let processed = 0;
  let written = 0;
  let lastIndex = startOffset;

  for (let i = startOffset; i < sitemap.length; i++) {
    if (!ctx.hasQuota()) break;
    const entry = sitemap[i];
    lastIndex = i + 1;

    let html: string;
    try {
      const r = await fetchWithTimeout(entry.url);
      if (r.status >= 400) continue;
      html = r.html;
    } catch {
      continue;
    }
    processed++;

    const $ = cheerio.load(html);
    const headings: string[] = [];
    $("h1,h2,h3").each((_, el) => {
      const text = $(el).text().trim();
      if (text && headings.length < 8) headings.push(text);
    });
    const hasFaqSchema = $("script[type='application/ld+json']")
      .toArray()
      .some((el) => /"@type"\s*:\s*"FAQPage"/.test($(el).contents().text()));
    const hasArticleSchema = $("script[type='application/ld+json']")
      .toArray()
      .some((el) => /"@type"\s*:\s*"(Article|BlogPosting|NewsArticle)"/.test($(el).contents().text()));

    const quotableBullets = $("ul li, ol li").length;
    const paragraphCount = $("p").length;
    const hasCitations =
      $("a[href$='.gov'], a[href*='.gov/'], a[href$='.edu'], a[href*='.edu/'], cite").length > 0;
    const headingDepth = $("h2,h3,h4").length;

    // PAA probe — pick the most distinctive H2 and ask Google for "people also ask".
    // Skip for utility/non-content pages where headings are UI labels, not topics.
    const NON_CONTENT_PATHS = ["/contact", "/pricing", "/about", "/join", "/terms", "/privacy", "/login", "/faq"];
    const isContentPage = !NON_CONTENT_PATHS.some((p) => urlToPathKey(entry.url) === p);
    let paaCoverage = 0;
    const seedHeading = headings.find((h) => h.length > 12) ?? headings[0];
    if (isContentPage && seedHeading && ctx.hasQuota()) {
      const hits = await searchWithQuota(ctx, `${seedHeading} virtual assistant`, 5);
      if (hits === null) {
        // quota exhausted — bail and resume here next run
        lastIndex = i;
        break;
      }
      // Heuristic: how many returned snippets contain a "?" (indicative of question coverage)
      paaCoverage = hits.filter((h) => h.snippet.includes("?")).length;
    }

    let score = 100;
    const recommendations: string[] = [];
    if (!hasFaqSchema) {
      score -= 15;
      recommendations.push("Add FAQ schema (JSON-LD FAQPage) so answers can power AI Overviews.");
    }
    if (!hasArticleSchema) {
      score -= 8;
      recommendations.push("Add Article/BlogPosting schema for clearer LLM extraction.");
    }
    if (quotableBullets < 5) {
      score -= 10;
      recommendations.push("Increase quotable bullet/list density — aim for ≥5 list items per page.");
    }
    if (!hasCitations) {
      score -= 8;
      recommendations.push("Cite authoritative sources (.gov / .edu / industry reports) to boost trust.");
    }
    if (headingDepth < 3) {
      score -= 6;
      recommendations.push("Use more sub-headings (H2/H3) for richer LLM-friendly structure.");
    }
    if (paragraphCount < 6) {
      score -= 4;
      recommendations.push("Expand body content; LLMs need ≥6 paragraphs of context.");
    }
    if (paaCoverage === 0) {
      score -= 4;
      recommendations.push("Add explicit Q&A blocks aligned with People Also Ask queries.");
    }

    const id = `citation_${urlToPathKey(entry.url).replace(/[^a-z0-9]/gi, "_") || "root"}`;
    try {
      await db.collection("citation-audits").doc(id).set(
        {
          url: entry.url,
          pathKey: urlToPathKey(entry.url),
          score: Math.max(0, Math.min(100, score)),
          fetchedAt: new Date().toISOString(),
          hasFaqSchema,
          hasArticleSchema,
          paaCoverage,
          quotableBullets,
          hasCitations,
          headingDepth,
          paragraphCount,
          recommendations,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
      written++;
    } catch (err) {
      console.warn("[citation] persist failed:", err);
    }
  }

  const reachedEnd = lastIndex >= sitemap.length;
  return {
    status: reachedEnd ? "ok" : "partial",
    findings: written,
    queriesUsed: ctx.queriesUsed(),
    cursor: reachedEnd ? null : { offset: lastIndex },
    summary: { processed, written, total: sitemap.length, nextOffset: reachedEnd ? null : lastIndex },
  };
}

async function fetchWithTimeout(url: string): Promise<{ status: number; html: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CreedaVA-SEO-Agent/1.0" },
    });
    return { status: r.status, html: await r.text() };
  } finally {
    clearTimeout(timer);
  }
}
