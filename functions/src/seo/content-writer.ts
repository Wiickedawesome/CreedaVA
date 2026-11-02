/**
 * Brief → blog-draft pipeline.
 *
 * For each /content-briefs doc the synthesizer just wrote (or any brief
 * whose status is "draft" without a linked blogId), produce a blog post
 * in the /blog collection with status="draft" so admins can review and
 * publish.
 *
 * - When GEMINI_API_KEY is set we call Gemini to write the draft body.
 * - Otherwise we emit a templated outline-based draft so the agent still
 *   makes forward progress without a key.
 *
 * Respects autonomy.content:
 *   - "off"    → never writes a blog draft (briefs only)
 *   - "draft"  → writes blog status="draft" (default, safe)
 *   - "execute"→ writes blog status="draft" too (we never auto-publish AI
 *     content; admin must promote to "published" manually)
 */

import { db } from "../admin";
import type { SeoAgentConfigDoc } from "./types";
import { isApprovedThumbnail, pickFeaturedImage, thumbnailPromptList } from "./thumbnails";

interface BriefDoc {
  id: string;
  keyword?: string;
  status?: string;
  recommendedOutline?: string[];
  rankingPage?: string;
  blogId?: string | null;
}

export interface ContentWriterResult {
  draftsWritten: number;
  skipped: number;
}

const MAX_BRIEFS_PER_RUN = 5;

export async function writeBlogDraftsFromBriefs(
  config: SeoAgentConfigDoc,
  runId: string,
): Promise<ContentWriterResult> {
  if (config.autonomy.content === "off") {
    return { draftsWritten: 0, skipped: 0 };
  }

  const since = new Date(Date.now() - 7 * 86_400_000);
  const snap = await db
    .collection("content-briefs")
    .where("updatedAt", ">=", since)
    .get()
    .catch(() => null);
  if (!snap || snap.empty) return { draftsWritten: 0, skipped: 0 };

  const candidates: BriefDoc[] = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<BriefDoc, "id">) }))
    .filter((b) => !b.blogId && b.keyword)
    .slice(0, MAX_BRIEFS_PER_RUN);

  let draftsWritten = 0;
  let skipped = 0;

  for (const brief of candidates) {
    try {
      const blog = await composeBlogDraft(brief);
      const blogRef = db.collection("blog").doc(blog.slug);
      await blogRef.set(
        {
          ...blog,
          status: "draft",
          author: "SEO Agent",
          source: "seo-agent",
          briefId: brief.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true },
      );

      await db.collection("content-briefs").doc(brief.id).set(
        { blogId: blog.slug, status: "draft-generated", updatedAt: new Date() },
        { merge: true },
      );

      await db.collection("ai-activity-log").add({
        kind: "auto-action",
        action: "blog-draft-generated",
        runId,
        target: `blog/${blog.slug}`,
        before: null,
        after: { title: blog.title, briefId: brief.id, keyword: brief.keyword },
        risk: "draft",
        createdAt: new Date(),
      });

      draftsWritten++;
    } catch (err) {
      console.warn("[seo-agent] content-writer brief", brief.id, "failed:", err);
      skipped++;
    }
  }

  return { draftsWritten, skipped };
}

interface BlogDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  metaDescription: string;
  lang: string;
  /** Unsplash CDN URL used as the post thumbnail + OG image. */
  featuredImage: string;
}

async function composeBlogDraft(brief: BriefDoc): Promise<BlogDraft> {
  const keyword = (brief.keyword ?? "virtual assistants").trim();
  const outline =
    brief.recommendedOutline && brief.recommendedOutline.length
      ? brief.recommendedOutline
      : defaultOutline(keyword);

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = await tryGemini(apiKey, keyword, outline);
      if (ai) return ai;
    } catch (err) {
      console.warn("[seo-agent] Gemini draft failed; using template:", err);
    }
  }
  return templateDraft(keyword, outline);
}

async function tryGemini(
  apiKey: string,
  keyword: string,
  outline: string[],
): Promise<BlogDraft | null> {
  const mod = (await import("@google/generative-ai")) as unknown as {
    GoogleGenerativeAI: new (k: string) => {
      getGenerativeModel: (o: { model: string }) => {
        generateContent: (p: string) => Promise<{
          response: { text: () => string };
        }>;
      };
    };
  };
  const genAI = new mod.GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const prompt = `You are an SEO writer for CreedaVA, a bilingual (English/Spanish) virtual assistant agency in Belize serving US small businesses.

Write a blog post draft targeting the keyword: "${keyword}"

Use this outline:
${outline.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Return ONLY valid JSON (no markdown fences) with these exact fields:
{
  "title": "<SEO title under 60 chars>",
  "excerpt": "<1-2 sentence summary>",
  "content": "<HTML body, ~700-900 words, with <h2>, <p>, and <ul> tags. NEVER use <h1> — the page renders the title as the only H1. No <html> or <body> wrapper. End with a CTA paragraph linking to /contact.>",
  "tags": ["3-5", "topical", "tags"],
  "metaDescription": "<under 160 chars>",
  "featuredImage": "<one URL copied verbatim from the APPROVED THUMBNAILS list that best matches the topic>"
}

APPROVED THUMBNAILS (choose exactly one, return the full URL):
${thumbnailPromptList()}`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const cleaned = raw
    .replace(/```(?:json)?\s*/g, "")
    .replace(/```\s*$/g, "")
    .trim();
  const parsed = JSON.parse(cleaned) as Partial<BlogDraft>;
  if (!parsed.title || !parsed.content) return null;
  const chosenImage = isApprovedThumbnail(parsed.featuredImage)
    ? String(parsed.featuredImage)
    : "";
  return {
    title: String(parsed.title).slice(0, 70),
    slug: slugify(parsed.title ?? keyword),
    excerpt: parsed.excerpt ?? "",
    content: parsed.content,
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : [keyword],
    metaDescription: (parsed.metaDescription ?? parsed.excerpt ?? "").slice(0, 160),
    lang: "en",
    featuredImage: chosenImage || pickFeaturedImage(`${parsed.title} ${keyword}`),
  };
}

function templateDraft(keyword: string, outline: string[]): BlogDraft {
  const title = toTitleCase(keyword) + ": A Practical Guide";
  const excerpt = `Everything you need to know about ${keyword} for US small businesses.`;
  const sections = outline
    .map(
      (s) => `<h2>${escapeHtml(s)}</h2>
<p>This section covers ${escapeHtml(s.toLowerCase())} in depth, including how CreedaVA helps small US firms succeed with ${escapeHtml(keyword)}.</p>`,
    )
    .join("\n");
  const content = `<p>${escapeHtml(excerpt)}</p>
${sections}
<p><strong>Ready to get started?</strong> <a href="/contact">Book a discovery call</a> to see how a bilingual VA from CreedaVA can support your team.</p>`;
  return {
    title,
    slug: slugify(title),
    excerpt,
    content,
    tags: [keyword, "virtual assistants", "small business"].slice(0, 5),
    metaDescription: excerpt.slice(0, 160),
    lang: "en",
    featuredImage: pickFeaturedImage(`${title} ${keyword}`),
  };
}

function defaultOutline(keyword: string): string[] {
  return [
    `What is ${keyword}?`,
    `When to invest in ${keyword}`,
    `How to evaluate providers`,
    `Cost & ROI`,
    `Common pitfalls`,
    `FAQ`,
  ];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
