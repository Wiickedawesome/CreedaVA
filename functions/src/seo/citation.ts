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
import { syncFindings, type FindingInput } from "./findings";
import { loadSitemap, urlToPathKey } from "./sitemap";
import { searchWithQuota } from "./search";
import type { SkillContext, SkillResult } from "./types";

const FETCH_TIMEOUT_MS = 12_000;

/** One coded citation weakness, in priority order of what to fix first. */
interface CitationIssue {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
}

export async function runCitationAudit(ctx: SkillContext): Promise<SkillResult> {
  const sitemap = await loadSitemap();
  if (sitemap.length === 0) {
    return { status: "skipped", findings: 0, queriesUsed: ctx.queriesUsed(), summary: { reason: "empty-sitemap" } };
  }

  const startOffset = ctx.cursor?.offset ?? 0;
  let processed = 0;
  let written = 0;
  const collected: FindingInput[] = [];
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
    // Each criterion is a weighted, coded finding: the code is what makes a
    // rerun an update instead of a new row.
    const issues: CitationIssue[] = [];
    const flag = (issue: CitationIssue, penalty: number) => {
      score -= penalty;
      issues.push(issue);
    };
    if (!hasFaqSchema) {
      flag({ code: "faq-schema-missing", severity: "medium", message: "Add FAQ schema (JSON-LD FAQPage) so answers can power AI Overviews." }, 15);
    }
    if (!hasArticleSchema) {
      flag({ code: "article-schema-missing", severity: "low", message: "Add Article/BlogPosting schema for clearer LLM extraction." }, 8);
    }
    if (quotableBullets < 5) {
      flag({ code: "few-quotable-bullets", severity: "medium", message: `Increase quotable bullet/list density — ${quotableBullets} list items, aim for ≥5.` }, 10);
    }
    if (!hasCitations) {
      flag({ code: "no-source-citations", severity: "low", message: "Cite authoritative sources (.gov / .edu / industry reports) to boost trust." }, 8);
    }
    if (headingDepth < 3) {
      flag({ code: "shallow-headings", severity: "low", message: `Use more sub-headings — ${headingDepth} H2/H3/H4 found, aim for ≥3.` }, 6);
    }
    if (paragraphCount < 6) {
      flag({ code: "thin-paragraphs", severity: "low", message: `Expand body content — ${paragraphCount} paragraphs, LLMs need ≥6.` }, 4);
    }
    if (paaCoverage === 0) {
      flag({ code: "no-qa-blocks", severity: "low", message: "Add explicit Q&A blocks aligned with People Also Ask queries." }, 4);
    }
    const recommendations = issues.map((issue) => issue.message);

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
      const pathKey = urlToPathKey(entry.url);
      collected.push(
        ...issues.map((issue) => ({
          skill: "citation-audit",
          scope: "page" as const,
          target: pathKey,
          code: issue.code,
          severity: issue.severity,
          message: issue.message,
          evidence: `citation-audits/${id}`,
        })),
      );
    } catch (err) {
      console.warn("[citation] persist failed:", err);
    }
  }

  // One batch for the whole run: upserts this run's codes and resolves any the
  // pages just audited no longer have.
  let findingsResolved = 0;
  try {
    findingsResolved = (await syncFindings("citation-audit", collected)).resolved;
  } catch (err) {
    console.warn("[citation] finding sync failed:", err);
  }

  const reachedEnd = lastIndex >= sitemap.length;
  return {
    status: reachedEnd ? "ok" : "partial",
    findings: written,
    queriesUsed: ctx.queriesUsed(),
    cursor: reachedEnd ? null : { offset: lastIndex },
    summary: { processed, written, findingsResolved, total: sitemap.length, nextOffset: reachedEnd ? null : lastIndex },
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
