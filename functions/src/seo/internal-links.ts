/**
 * Internal link injector.
 *
 * For each blog post created/updated in the last 7 days that hasn't been
 * processed yet, scan its HTML body and insert 2-4 contextual links to other
 * site pages (sitemap-derived). We only link the FIRST occurrence of a target
 * keyword/title outside of existing <a>…</a> spans, to avoid breaking layout.
 *
 * Respects autonomy.internalLinks:
 *   - "off"     → no-op
 *   - "draft"   → write a /internal-link-suggestions doc per opportunity, no edit
 *   - "execute" → mutate the blog content in-place and log to ai-activity-log
 */

import { db } from "../admin";
import { loadSitemap, urlToPathKey } from "./sitemap";
import type { SeoAgentConfigDoc } from "./types";

const MAX_POSTS_PER_RUN = 8;
const MAX_LINKS_PER_POST = 4;
const MIN_LINKS_TO_RECORD = 1;

export interface InternalLinkResult {
  postsUpdated: number;
  linksInserted: number;
  suggestionsWritten: number;
}

interface BlogDoc {
  id: string;
  title?: string;
  slug?: string;
  content?: string;
  status?: string;
  internalLinksAddedAt?: string;
  tags?: string[];
}

export async function injectInternalLinks(
  config: SeoAgentConfigDoc,
  runId: string,
): Promise<InternalLinkResult> {
  if (config.autonomy.internalLinks === "off") {
    return { postsUpdated: 0, linksInserted: 0, suggestionsWritten: 0 };
  }

  const since = new Date(Date.now() - 7 * 86_400_000);
  const blogSnap = await db
    .collection("blog")
    .where("updatedAt", ">=", since)
    .get()
    .catch(() => null);
  if (!blogSnap || blogSnap.empty) {
    return { postsUpdated: 0, linksInserted: 0, suggestionsWritten: 0 };
  }

  // Build link target catalog (other blog posts + sitemap key pages).
  const allBlogSnap = await db.collection("blog").get().catch(() => null);
  const blogTargets: Array<{ url: string; phrase: string }> = [];
  if (allBlogSnap) {
    for (const d of allBlogSnap.docs) {
      const data = d.data() as BlogDoc;
      if (!data.title || !data.slug) continue;
      blogTargets.push({ url: `/news/${data.slug}`, phrase: data.title });
    }
  }

  const sitemap = await loadSitemap();
  const pageTargets: Array<{ url: string; phrase: string }> = sitemap
    .map((e) => ({ url: urlToPathKey(e.url), phrase: pathToPhrase(urlToPathKey(e.url)) }))
    .filter((t) => t.phrase && !["/", "/news"].includes(t.url));

  const candidates = blogSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<BlogDoc, "id">) }))
    .filter((p) => p.content && !p.internalLinksAddedAt)
    .slice(0, MAX_POSTS_PER_RUN);

  let postsUpdated = 0;
  let linksInserted = 0;
  let suggestionsWritten = 0;

  for (const post of candidates) {
    const ownPath = `/news/${post.slug ?? post.id}`;
    const targets = [...blogTargets, ...pageTargets].filter((t) => t.url !== ownPath);
    const { updated, inserted, opportunities } = applyLinks(post.content!, targets);

    if (config.autonomy.internalLinks === "draft") {
      if (opportunities.length >= MIN_LINKS_TO_RECORD) {
        await db.collection("internal-link-suggestions").doc(post.id).set(
          {
            blogId: post.id,
            slug: post.slug ?? null,
            opportunities: opportunities.slice(0, MAX_LINKS_PER_POST),
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true },
        );
        suggestionsWritten++;
      }
      continue;
    }

    // execute
    if (inserted > 0) {
      await db.collection("blog").doc(post.id).set(
        {
          content: updated,
          internalLinksAddedAt: new Date().toISOString(),
          updatedAt: new Date(),
        },
        { merge: true },
      );
      await db.collection("ai-activity-log").add({
        kind: "auto-action",
        action: "internal-links-inserted",
        runId,
        target: `blog/${post.id}`,
        before: { contentLength: post.content!.length },
        after: { linksInserted: inserted, contentLength: updated.length },
        risk: "auto",
        createdAt: new Date(),
      });
      postsUpdated++;
      linksInserted += inserted;
    }
  }

  return { postsUpdated, linksInserted, suggestionsWritten };
}

interface LinkResult {
  updated: string;
  inserted: number;
  opportunities: Array<{ phrase: string; url: string }>;
}

function applyLinks(
  html: string,
  targets: Array<{ url: string; phrase: string }>,
): LinkResult {
  let updated = html;
  let inserted = 0;
  const opportunities: Array<{ phrase: string; url: string }> = [];

  // Sort longer phrases first to avoid sub-string clobbering
  const sorted = [...targets].sort((a, b) => b.phrase.length - a.phrase.length);

  for (const t of sorted) {
    if (inserted >= MAX_LINKS_PER_POST) break;
    if (!t.phrase || t.phrase.length < 8) continue;

    // Skip if URL already linked anywhere in the doc
    if (updated.includes(`href="${t.url}"`)) continue;

    const escaped = escapeRegex(t.phrase);
    // Match the phrase only when NOT already inside an <a> tag.
    // We approximate by requiring the preceding character to not be the start
    // of an open <a (we skip the match if the surrounding 80 chars before
    // contain an unclosed <a).
    const re = new RegExp(`\\b(${escaped})\\b`, "i");
    const match = re.exec(updated);
    if (!match) continue;
    const idx = match.index;
    if (isInsideAnchor(updated, idx)) continue;
    const link = `<a href="${t.url}">${match[1]}</a>`;
    updated = updated.slice(0, idx) + link + updated.slice(idx + match[1].length);
    inserted++;
    opportunities.push({ phrase: match[1], url: t.url });
  }

  return { updated, inserted, opportunities };
}

function isInsideAnchor(html: string, idx: number): boolean {
  const before = html.slice(Math.max(0, idx - 200), idx);
  const lastOpen = before.lastIndexOf("<a ");
  const lastClose = before.lastIndexOf("</a>");
  return lastOpen > lastClose;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pathToPhrase(path: string): string {
  const tail = path.replace(/^\//, "").split("/").pop() ?? "";
  return tail
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
