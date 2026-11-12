/**
 * On-page audit skill (Monday).
 *
 * Crawls every URL in /sitemap.xml, parses HTML with cheerio, and writes one
 * onpage-audits doc per URL. When autonomy.metaFixes === "execute", auto-applies
 * trivially-safe fixes to /page-seo (capturing before/after for rollback).
 *
 * Uses zero Custom Search queries — only direct HTML fetches.
 */

import * as cheerio from "cheerio";
import { db } from "../admin";
import { getAgentConfig } from "./config";
import { loadSitemap, urlToPathKey } from "./sitemap";
import type { SkillContext, SkillResult } from "./types";

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

export function auditOne(url: string, status: number, html: string, ms: number): AuditOutput {
  const pathKey = urlToPathKey(url);
  const $ = cheerio.load(html);

  const title = ($("head title").first().text() || "").trim() || null;
  const metaDescription =
    $("head meta[name='description']").attr("content")?.trim() || null;
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
  } else if (title.length < 30) {
    issues.push({ code: "title-short", severity: "medium", message: `Title only ${title.length} chars`, fix: "Aim for 30–60 chars.", autoFixable: true });
    score -= 6;
  } else if (title.length > 70) {
    issues.push({ code: "title-long", severity: "low", message: `Title is ${title.length} chars`, fix: "Aim for 30–60 chars." });
    score -= 3;
  }
  if (!metaDescription) {
    issues.push({ code: "meta-missing", severity: "high", message: "Missing meta description", autoFixable: true });
    score -= 15;
  } else if (metaDescription.length < 70) {
    issues.push({ code: "meta-short", severity: "medium", message: `Meta description only ${metaDescription.length} chars`, autoFixable: true });
    score -= 5;
  } else if (metaDescription.length > 170) {
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

  const config = await getAgentConfig();
  const startOffset = ctx.cursor?.offset ?? 0;
  const slice = sitemap.slice(startOffset, startOffset + MAX_URLS_PER_RUN);

  let scoreTotal = 0;
  let issueTotal = 0;
  let highSeverityCount = 0;
  let metaFixesApplied = 0;
  const failed: string[] = [];

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

    // Auto-fix safe meta issues if configured.
    if (config.autonomy.metaFixes === "execute") {
      const applied = await tryAutoApplyMeta(audit);
      if (applied) metaFixesApplied++;
    }
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
      metaFixesApplied,
      failedCount: failed.length,
    },
  };
}

/**
 * Apply trivially-safe fixes to page-seo.
 *
 * Handles:
 *   - title-missing / title-short → fallback to <h1> text or capitalized path
 *   - meta-missing / meta-short   → extract first substantial sentence from body
 *   - og-missing                   → write ogTitle + ogDescription from title/desc
 *
 * Records before/after on the audit and a seo-tasks doc for rollback visibility.
 */
async function tryAutoApplyMeta(audit: AuditOutput): Promise<boolean> {
  const fixableCodes = new Set(
    audit.issues
      .filter((i) => i.autoFixable)
      .map((i) => i.code),
  );

  const needsTitle = fixableCodes.has("title-missing") || fixableCodes.has("title-short");
  const needsMeta = fixableCodes.has("meta-missing") || fixableCodes.has("meta-short");
  const needsOg = fixableCodes.has("og-missing");

  if (!needsTitle && !needsMeta && !needsOg) return false;

  // Look up existing page-seo doc by path.
  let existingId: string | null = null;
  let existing: Record<string, unknown> | null = null;
  try {
    const snap = await db
      .collection("page-seo")
      .where("path", "==", audit.pathKey)
      .limit(1)
      .get();
    if (!snap.empty) {
      existingId = snap.docs[0].id;
      existing = snap.docs[0].data();
    }
  } catch (err) {
    console.warn("[onpage-audit] page-seo lookup failed:", err);
    return false;
  }

  // ─── Build candidate title ────────────────────────
  let suggestedTitle: string | null = null;
  if (needsTitle) {
    suggestedTitle =
      audit.title && audit.title.length >= 30 && audit.title.length <= 60
        ? audit.title
        : `CreedaVA — ${audit.pathKey === "/" ? "Virtual Assistant Services" : prettyPath(audit.pathKey)}`;
    // Skip if already matches.
    if (existing?.title === suggestedTitle) suggestedTitle = null;
  }

  // ─── Build candidate meta description ─────────────
  let suggestedDesc: string | null = null;
  if (needsMeta) {
    suggestedDesc = extractFirstSentence(audit.bodyText);
    // Skip if already matches or extraction failed.
    if (!suggestedDesc || existing?.description === suggestedDesc) suggestedDesc = null;
  }

  // Nothing actionable after de-dup?
  if (!suggestedTitle && !suggestedDesc && !needsOg) return false;

  const before = existing
    ? { title: existing.title, description: existing.description, ogTitle: existing.ogTitle, ogDescription: existing.ogDescription }
    : null;

  // Build the update payload.
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (suggestedTitle) update.title = suggestedTitle;
  if (suggestedDesc) update.description = suggestedDesc;

  // ─── OG fields: derive from best available title + description ───
  if (needsOg) {
    const bestTitle = suggestedTitle ?? (existing?.title as string | undefined) ?? null;
    const bestDesc = suggestedDesc ?? (existing?.description as string | undefined) ?? null;
    if (bestTitle) update.ogTitle = bestTitle;
    if (bestDesc) update.ogDescription = bestDesc;
  }

  const after = {
    title: suggestedTitle ?? existing?.title,
    description: suggestedDesc ?? existing?.description,
    ogTitle: update.ogTitle ?? existing?.ogTitle,
    ogDescription: update.ogDescription ?? existing?.ogDescription,
  };

  const fixedCodes: string[] = [];
  if (suggestedTitle) fixedCodes.push(needsTitle ? "title-missing/short" : "");
  if (suggestedDesc) fixedCodes.push("meta-description");
  if (needsOg && (update.ogTitle || update.ogDescription)) fixedCodes.push("og-tags");

  try {
    if (existingId) {
      await db.collection("page-seo").doc(existingId).set(update, { merge: true });
    } else {
      await db.collection("page-seo").add({
        path: audit.pathKey,
        ...update,
        createdAt: new Date(),
      });
    }

    await db.collection("seo-tasks").add({
      kind: "fix-meta",
      title: `Auto-applied meta fixes for ${audit.pathKey}`,
      description: `Fixed: ${fixedCodes.filter(Boolean).join(", ")}.`,
      priority: 60,
      status: "done",
      sources: { audits: [audit.pathKey] },
      area: "meta",
      affectedPath: audit.pathKey,
      capturedAt: new Date().toISOString(),
      appliedAt: new Date().toISOString(),
      autoApplied: true,
      before,
      after,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection("ai-activity-log").add({
      toolName: "auto_apply_meta_fix",
      domain: "seo",
      risk: "auto",
      decision: "auto-execute",
      args: { path: audit.pathKey, codes: fixedCodes, before, after },
      result: { success: true },
      executedAt: new Date(),
    });

    return true;
  } catch (err) {
    console.warn("[onpage-audit] auto-apply failed:", err);
    return false;
  }
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
