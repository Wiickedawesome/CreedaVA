/**
 * On-page audit skill (Monday).
 *
 * Crawls every URL in /sitemap.xml, parses HTML with cheerio, and writes one
 * onpage-audits doc per URL plus a `findings` row per issue. It never writes
 * `page-seo`: the crawl is suggestion-only, and a finding carries the fix a
 * human can choose to apply.
 *
 * Uses zero Custom Search queries — only direct HTML fetches.
 */

import * as cheerio from "cheerio";
import { db } from "../admin";
import { syncFindings, type FindingInput, type FindingSuggestion } from "./findings";
import { loadSitemap, urlToPathKey } from "./sitemap";
import type { SkillContext, SkillResult } from "./types";

const SKILL = "onpage-audit";
const TITLE_RANGE = { min: 30, max: 60 } as const;
const DESCRIPTION_RANGE = { min: 70, max: 170 } as const;

const FETCH_TIMEOUT_MS = 15_000;
const MAX_URLS_PER_RUN = 80;

export interface AuditOutput {
  url: string;
  pathKey: string;
  score: number;
  fetchedAt: string;
  status: number;
  responseTimeMs: number;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Count: number;
  canonical: string | null;
  ogTags: { property: string; content: string }[];
  hreflangTags: { hreflang: string; href: string }[];
  jsonLdTypes: string[];
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  imagesMissingAlt: number;
  wordCount: number;
  /** Raw body text for meta description extraction. */
  bodyText: string;
  issues: {
    code: string;
    severity: "info" | "low" | "medium" | "high";
    message: string;
    fix?: string;
    autoFixable?: boolean;
  }[];
}

async function fetchWithTimeout(url: string): Promise<{ status: number; html: string; ms: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const start = Date.now();
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CreedaVA-SEO-Agent/1.0 (+https://creedava.com)" },
    });
    const html = await r.text();
    return { status: r.status, html, ms: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Read the document title.
 *
 * Scoped to <head> on purpose: every SVG logo carries its own <title> for its
 * accessible name, so a document-wide `$("title")` picks up the brand label
 * instead of the page title. Should several titles still appear in <head>, the
 * longest non-empty one wins — short ones are fallbacks, not the page's title.
 */
function readTitle($: cheerio.CheerioAPI): string | null {
  const candidates = $("head title")
    .toArray()
    .map((el) => $(el).text().replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (candidates.length === 0) return null;
  return candidates.reduce((longest, next) => (next.length > longest.length ? next : longest));
}

/**
 * Read the meta description, skipping empty declarations.
 *
 * A page can emit more than one <meta name="description">; the first is
 * conventionally authoritative, but an empty first tag is not a missing one.
 */
function readMetaDescription($: cheerio.CheerioAPI): string | null {
  const values = $("head meta[name='description']")
    .toArray()
    .map((el) => $(el).attr("content")?.trim() ?? "")
    .filter(Boolean);
  return values[0] ?? null;
}

export function auditOne(url: string, status: number, html: string, ms: number): AuditOutput {
  const pathKey = urlToPathKey(url);
  const $ = cheerio.load(html);

  const title = readTitle($);
  const metaDescription = readMetaDescription($);
  const h1s = $("h1");
  const canonical = $("head link[rel='canonical']").attr("href")?.trim() || null;

  const ogTags: { property: string; content: string }[] = [];
  $("head meta[property^='og:']").each((_, el) => {
    const property = $(el).attr("property")?.trim();
    const content = $(el).attr("content")?.trim();
    if (property && content) ogTags.push({ property, content });
  });

  const hreflangTags: { hreflang: string; href: string }[] = [];
  $("head link[rel='alternate'][hreflang]").each((_, el) => {
    const hreflang = $(el).attr("hreflang")?.trim();
    const href = $(el).attr("href")?.trim();
    if (hreflang && href) hreflangTags.push({ hreflang, href });
  });

  const jsonLdTypes: string[] = [];
  $("script[type='application/ld+json']").each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const it of items) {
        const t = (it as Record<string, unknown>)["@type"];
        if (typeof t === "string") jsonLdTypes.push(t);
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  });

  const host = new URL(url).hostname;
  let internalLinks = 0;
  let externalLinks = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const abs = new URL(href, url);
      if (abs.hostname === host) internalLinks++;
      else externalLinks++;
    } catch {
      /* ignore */
    }
  });

  const imgs = $("img");
  let imagesMissingAlt = 0;
  imgs.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim() === "") imagesMissingAlt++;
  });

  // Strip non-visible nodes first: cheerio's .text() includes <script> contents,
  // which would feed inline JSON-LD into bodyText (and then into meta descriptions).
  //
  // Prefer <main> and drop site chrome. Falling back to the whole <body> pulls in
  // nav, footer and skip-links; because whitespace is collapsed afterwards, those
  // labels run together ("HomeServicesPricingAbout") and then get truncated into
  // a meta description that ships live. Joining block elements with ". " keeps a
  // sentence boundary between them.
  const $scope = ($("main").length > 0 ? $("main") : $("body")).clone();
  $scope.find("script, style, noscript, template, nav, footer, header, form, aside").remove();

  const blockText = $scope
    .find("p, li, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th")
    .toArray()
    .map((el) => $(el).text().replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(". ");

  const text = (blockText || $scope.text().replace(/\s+/g, " ").trim()).trim();
  const wordCount = text ? text.split(/\s+/).length : 0;

  const issues: AuditOutput["issues"] = [];
  let score = 100;

  if (status >= 400) {
    issues.push({ code: "http-error", severity: "high", message: `HTTP ${status}` });
    score -= 40;
  }
  if (!title) {
    issues.push({ code: "title-missing", severity: "high", message: "Missing <title>", autoFixable: true });
    score -= 20;
  } else if (title.length < TITLE_RANGE.min) {
    issues.push({ code: "title-short", severity: "medium", message: `Title only ${title.length} chars`, fix: "Aim for 30–60 chars.", autoFixable: true });
    score -= 6;
  } else if (title.length > TITLE_RANGE.max + 10) {
    issues.push({ code: "title-long", severity: "low", message: `Title is ${title.length} chars`, fix: "Aim for 30–60 chars." });
    score -= 3;
  }
  if (!metaDescription) {
    issues.push({ code: "meta-missing", severity: "high", message: "Missing meta description", autoFixable: true });
    score -= 15;
  } else if (metaDescription.length < DESCRIPTION_RANGE.min) {
    issues.push({ code: "meta-short", severity: "medium", message: `Meta description only ${metaDescription.length} chars`, autoFixable: true });
    score -= 5;
  } else if (metaDescription.length > DESCRIPTION_RANGE.max) {
    issues.push({ code: "meta-long", severity: "low", message: `Meta description is ${metaDescription.length} chars` });
    score -= 2;
  }
  if (h1s.length === 0) {
    issues.push({ code: "h1-missing", severity: "high", message: "Missing <h1>" });
    score -= 10;
  } else if (h1s.length > 1) {
    issues.push({ code: "h1-multiple", severity: "low", message: `${h1s.length} <h1> tags found` });
    score -= 3;
  }
  if (!canonical) {
    issues.push({ code: "canonical-missing", severity: "low", message: "Missing canonical link" });
    score -= 3;
  }
  if (ogTags.length === 0) {
    issues.push({ code: "og-missing", severity: "low", message: "Missing Open Graph tags", autoFixable: true });
    score -= 4;
  }
  if (jsonLdTypes.length === 0) {
    issues.push({ code: "schema-missing", severity: "low", message: "No JSON-LD structured data", fix: "Add Article/FAQ/Breadcrumb schema." });
    score -= 4;
  }
  // Bilingual site serves ?lang=es — hreflang tags should be present
  if (hreflangTags.length === 0) {
    issues.push({ code: "hreflang-missing", severity: "low", message: "No hreflang tags — risk of duplicate content for bilingual pages", fix: "Add hreflang alternate links for en + es." });
    score -= 3;
  }
  if (imgs.length > 0 && imagesMissingAlt > 0) {
    issues.push({
      code: "alt-missing",
      severity: "medium",
      message: `${imagesMissingAlt}/${imgs.length} images missing alt text`,
      autoFixable: false,
    });
    score -= Math.min(8, imagesMissingAlt);
  }
  if (wordCount > 0 && wordCount < 250) {
    issues.push({ code: "thin-content", severity: "medium", message: `Only ${wordCount} words` });
    score -= 6;
  }
  if (ms > 4000) {
    issues.push({ code: "slow-response", severity: "low", message: `${ms}ms response time` });
    score -= 3;
  }

  return {
    url,
    pathKey,
    score: Math.max(0, Math.min(100, score)),
    fetchedAt: new Date().toISOString(),
    status,
    responseTimeMs: ms,
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    h1Count: h1s.length,
    canonical,
    ogTags,
    hreflangTags,
    jsonLdTypes,
    internalLinks,
    externalLinks,
    imageCount: imgs.length,
    imagesMissingAlt,
    wordCount,
    bodyText: text,
    issues,
  };
}

export async function runOnPageAudit(ctx: SkillContext): Promise<SkillResult> {
  const sitemap = await loadSitemap();
  if (sitemap.length === 0) {
    return { status: "skipped", findings: 0, queriesUsed: ctx.queriesUsed(), summary: { reason: "empty-sitemap" } };
  }

  const startOffset = ctx.cursor?.offset ?? 0;
  const slice = sitemap.slice(startOffset, startOffset + MAX_URLS_PER_RUN);

  let scoreTotal = 0;
  let issueTotal = 0;
  let highSeverityCount = 0;
  const failed: string[] = [];
  const collected: FindingInput[] = [];

  for (let i = 0; i < slice.length; i++) {
    const entry = slice[i];
    let audit: AuditOutput;
    try {
      const fetched = await fetchWithTimeout(entry.url);
      audit = auditOne(entry.url, fetched.status, fetched.html, fetched.ms);
    } catch (err) {
      console.warn(`[onpage-audit] ${entry.url} failed:`, err);
      failed.push(entry.url);
      continue;
    }

    // Persist audit (one doc per URL, keyed for stable lookup).
    const auditId = `audit_${audit.pathKey.replace(/[^a-z0-9]/gi, "_") || "root"}`;
    try {
      await db.collection("onpage-audits").doc(auditId).set(
        {
          ...audit,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
    } catch (err) {
      console.warn(`[onpage-audit] persist ${auditId} failed:`, err);
    }

    scoreTotal += audit.score;
    issueTotal += audit.issues.length;
    highSeverityCount += audit.issues.filter((x) => x.severity === "high").length;

    // The crawl never writes page-seo: every issue becomes a finding a human
    // can act on, so a bad rewrite is impossible and every change is decided.
    collected.push(...buildFindings(audit, auditId));
  }

  // One batched write for the whole slice: upserts what was just detected and
  // resolves codes that this run no longer sees on the pages it inspected.
  let findingsWritten = 0;
  let findingsResolved = 0;
  try {
    const synced = await syncFindings(SKILL, collected);
    findingsWritten = synced.written;
    findingsResolved = synced.resolved;
  } catch (err) {
    console.warn("[onpage-audit] finding sync failed:", err);
  }

  const processed = slice.length;
  const reachedEnd = startOffset + processed >= sitemap.length;
  const cursor = reachedEnd
    ? null
    : { offset: startOffset + processed };

  return {
    status: failed.length === slice.length && slice.length > 0 ? "error" : reachedEnd ? "ok" : "partial",
    findings: processed,
    queriesUsed: ctx.queriesUsed(),
    cursor,
    summary: {
      total: sitemap.length,
      processedThisRun: processed,
      cursor,
      averageScore: processed > 0 ? Math.round(scoreTotal / processed) : 0,
      issueTotal,
      highSeverityCount,
      findingsWritten,
      findingsResolved,
      failedCount: failed.length,
    },
  };
}

/**
 * Build one finding per audit issue.
 *
 * `evidence` points at the audit doc that produced the finding, so "where did
 * this come from" is answerable from the UI without guessing.
 */
function buildFindings(audit: AuditOutput, auditId: string): FindingInput[] {
  const titleSuggestion = desiredTitle(audit);
  const descriptionSuggestion = extractFirstSentence(audit.bodyText);

  return audit.issues.map((issue) => {
    const suggestion = suggestionFor(issue.code, titleSuggestion, descriptionSuggestion);
    return {
      skill: SKILL,
      scope: "page" as const,
      target: audit.pathKey,
      code: issue.code,
      severity: issue.severity === "info" ? "low" : issue.severity,
      message: issue.fix ? `${issue.message} — ${issue.fix}` : issue.message,
      evidence: `onpage-audits/${auditId}`,
      ...(suggestion ? { suggested: suggestion } : {}),
    };
  });
}

/**
 * The title this page should have, or null when the current one is already
 * long enough. Only a missing or short title has an obvious rewrite; a long one
 * needs a human to decide what to cut.
 */
function desiredTitle(audit: AuditOutput): string | null {
  const current = audit.title;
  const needsRewrite = !current || current.length < TITLE_RANGE.min;
  if (!needsRewrite) return null;
  const label = audit.pathKey === "/" ? "Virtual Assistant Services" : prettyPath(audit.pathKey);
  return `CreedaVA — ${label}`;
}

/** Which `page-seo` field the Fix button would write, per issue code. */
const SUGGESTION_FIELD: Record<string, "title" | "description"> = {
  "title-missing": "title",
  "title-short": "title",
  "meta-missing": "description",
  "meta-short": "description",
};

function suggestionFor(
  code: string,
  title: string | null,
  description: string | null,
): FindingSuggestion | undefined {
  const field = SUGGESTION_FIELD[code];
  if (field === "title" && title) return { field: "title", value: title };
  if (field === "description" && description) return { field: "description", value: description };
  return undefined;
}

/**
 * Extract the first sentence of ≥70 chars from the body text.
 * Used for auto-generating meta descriptions.
 *
 * Only accepts text that reads as prose: navigation labels, cookie banners and
 * other chrome have no sentence-ending punctuation, so anything stitched
 * together from fragments is rejected rather than truncated into a description.
 */
function extractFirstSentence(bodyText: string): string | null {
  if (!bodyText || bodyText.length < 70) return null;
  // Split on sentence-ending punctuation followed by whitespace.
  const sentences = bodyText.split(/(?<=[.!?])\s+/).filter((s) => isProse(s));
  // Find the first sentence that's substantial (≥70 chars).
  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length >= 70) {
      // Cap at 160 chars for meta description best practice.
      return trimmed.length > 160 ? trimmed.slice(0, 157) + "..." : trimmed;
    }
  }
  // Fallback: concatenate consecutive prose sentences until we hit 70+ chars.
  let combined = "";
  for (const s of sentences) {
    combined += (combined ? " " : "") + s.trim();
    if (combined.length >= 70) {
      return combined.length > 160 ? combined.slice(0, 157) + "..." : combined;
    }
  }
  return null;
}

/** Skip-link and menu labels that are never a page's description. */
const CHROME_LABEL =
  /^(skip to (main )?content|menu|home|services|pricing|about|news|contact|blog|faq|log ?in|sign ?in|get started|book a call|back to top)$/i;

/** A fragment is prose when it is long enough and ends like a sentence. */
function isProse(fragment: string): boolean {
  const trimmed = fragment.trim();
  if (trimmed.length < 25) return false;
  if (CHROME_LABEL.test(trimmed)) return false;
  return /[.!?]$/.test(trimmed);
}

function prettyPath(p: string): string {
  return p
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" — ");
}
