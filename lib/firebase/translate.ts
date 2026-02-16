/**
 * Auto-translation for forum & blog content using Firebase AI (Gemini)
 *
 * Translates user-generated content (thread titles, content, replies, blog posts)
 * to all supported languages so it can be displayed in the user's locale.
 *
 * Two modes:
 *  1. **Fire-and-forget**: translate after create, save to Firestore
 *  2. **On-demand**: translate on first view when `translations` is missing,
 *     save to Firestore for future views
 */

import { generateJSON } from "@/lib/firebase/ai";
import { update } from "@/lib/firebase/firestore";
import type { ContentTranslation } from "@/lib/types/content";

/** All supported locales — add new languages here */
const SUPPORTED_LOCALES = ["en", "es"] as const;

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
};

/** Track in-flight translations to avoid duplicate calls */
const inflightTranslations = new Set<string>();

// ─── Core translation ────────────────────────────────

interface TranslateResult {
  [lang: string]: ContentTranslation;
}

/**
 * Translate a forum thread's title + content to all other supported languages.
 */
export async function translateThread(
  title: string,
  content: string,
  sourceLang: string,
): Promise<TranslateResult> {
  const targetLangs = SUPPORTED_LOCALES.filter((l) => l !== sourceLang);
  if (targetLangs.length === 0) return {};

  const targets = targetLangs.map((l) => `"${l}" (${LANGUAGE_NAMES[l] || l})`).join(", ");

  return generateJSON<TranslateResult>(`
You are a professional translator. Translate the following forum post to these languages: ${targets}.

TITLE: ${title}

CONTENT: ${content}

Return a JSON object where each key is the language code and the value is an object with "title" and "content" fields.
Preserve formatting, line breaks, and any HTML tags.
Keep the same tone and meaning. Do NOT translate proper nouns, brand names, or URLs.

Example output format for translating to Spanish:
{ "es": { "title": "translated title", "content": "translated content" } }
  `);
}

/**
 * Translate a forum reply's content to all other supported languages.
 */
export async function translateReply(
  content: string,
  sourceLang: string,
): Promise<TranslateResult> {
  const targetLangs = SUPPORTED_LOCALES.filter((l) => l !== sourceLang);
  if (targetLangs.length === 0) return {};

  const targets = targetLangs.map((l) => `"${l}" (${LANGUAGE_NAMES[l] || l})`).join(", ");

  return generateJSON<TranslateResult>(`
You are a professional translator. Translate the following forum reply to these languages: ${targets}.

CONTENT: ${content}

Return a JSON object where each key is the language code and the value is an object with a "content" field.
Preserve formatting, line breaks, and any HTML tags.
Keep the same tone and meaning. Do NOT translate proper nouns, brand names, or URLs.

Example output format for translating to Spanish:
{ "es": { "content": "translated content" } }
  `);
}

/**
 * Translate a blog post's title, excerpt, and content to all other supported languages.
 */
export async function translateBlog(
  title: string,
  excerpt: string,
  content: string,
  sourceLang: string,
): Promise<TranslateResult> {
  const targetLangs = SUPPORTED_LOCALES.filter((l) => l !== sourceLang);
  if (targetLangs.length === 0) return {};

  const targets = targetLangs.map((l) => `"${l}" (${LANGUAGE_NAMES[l] || l})`).join(", ");

  return generateJSON<TranslateResult>(`
You are a professional translator. Translate the following blog post to these languages: ${targets}.

TITLE: ${title}

EXCERPT: ${excerpt}

CONTENT (HTML):
${content}

Return a JSON object where each key is the language code and the value is an object with "title", "excerpt", and "content" fields.
Preserve ALL HTML tags, formatting, and structure in the content field.
Keep the same tone and meaning. Do NOT translate proper nouns, brand names, or URLs.

Example output format for translating to Spanish:
{ "es": { "title": "translated title", "excerpt": "translated excerpt", "content": "<p>translated HTML content</p>" } }
  `);
}

// ─── Fire-and-forget helpers ─────────────────────────

/**
 * Translate a thread and save to Firestore in the background.
 * Call this AFTER creating the thread document.
 */
export function translateThreadInBackground(
  threadId: string,
  title: string,
  content: string,
  sourceLang: string,
) {
  const key = `forum:${threadId}`;
  if (inflightTranslations.has(key)) return;
  inflightTranslations.add(key);

  translateThread(title, content, sourceLang)
    .then((translations) => {
      if (Object.keys(translations).length > 0) {
        return update("forum", threadId, { lang: sourceLang, translations });
      }
    })
    .catch((err) => {
      console.error("Background translation failed for thread:", threadId, err);
    })
    .finally(() => inflightTranslations.delete(key));
}

/**
 * Translate a reply and save to Firestore in the background.
 * Call this AFTER creating the reply document.
 */
export function translateReplyInBackground(
  replyId: string,
  content: string,
  sourceLang: string,
) {
  const key = `reply:${replyId}`;
  if (inflightTranslations.has(key)) return;
  inflightTranslations.add(key);

  translateReply(content, sourceLang)
    .then((translations) => {
      if (Object.keys(translations).length > 0) {
        return update("forumReplies", replyId, { lang: sourceLang, translations });
      }
    })
    .catch((err) => {
      console.error("Background translation failed for reply:", replyId, err);
    })
    .finally(() => inflightTranslations.delete(key));
}

/**
 * Translate a blog post and save to Firestore in the background.
 */
export function translateBlogInBackground(
  docId: string,
  title: string,
  excerpt: string,
  content: string,
  sourceLang: string,
) {
  const key = `blog:${docId}`;
  if (inflightTranslations.has(key)) return;
  inflightTranslations.add(key);

  translateBlog(title, excerpt, content, sourceLang)
    .then((translations) => {
      if (Object.keys(translations).length > 0) {
        return update("blog", docId, { lang: sourceLang, translations });
      }
    })
    .catch((err) => {
      console.error("Background translation failed for blog:", docId, err);
    })
    .finally(() => inflightTranslations.delete(key));
}

// ─── On-demand translation ───────────────────────────
// These translate content on first view and save the result back to Firestore.

/**
 * Ensure a forum thread has translations for the target locale.
 * If missing, translates on-the-fly, saves to Firestore, and
 * returns the updated thread with translations attached.
 */
export async function ensureThreadTranslated<T extends {
  id: string;
  title: string;
  content: string;
  lang?: string;
  translations?: Record<string, ContentTranslation>;
}>(thread: T, targetLocale: string): Promise<T> {
  const sourceLang = thread.lang || "en";
  if (sourceLang === targetLocale) return thread;
  if (thread.translations?.[targetLocale]) return thread;

  try {
    const translations = await translateThread(thread.title, thread.content, sourceLang);
    const merged = { ...(thread.translations || {}), ...translations };
    await update("forum", thread.id, { lang: sourceLang, translations: merged });
    return { ...thread, lang: sourceLang, translations: merged };
  } catch (err) {
    console.error("On-demand thread translation failed:", err);
    return thread;
  }
}

/**
 * Ensure a forum reply has translations for the target locale.
 */
export async function ensureReplyTranslated<T extends {
  id: string;
  content: string;
  lang?: string;
  translations?: Record<string, ContentTranslation>;
}>(reply: T, targetLocale: string): Promise<T> {
  const sourceLang = reply.lang || "en";
  if (sourceLang === targetLocale) return reply;
  if (reply.translations?.[targetLocale]) return reply;

  try {
    const translations = await translateReply(reply.content, sourceLang);
    const merged = { ...(reply.translations || {}), ...translations };
    await update("forumReplies", reply.id, { lang: sourceLang, translations: merged });
    return { ...reply, lang: sourceLang, translations: merged };
  } catch (err) {
    console.error("On-demand reply translation failed:", err);
    return reply;
  }
}

/**
 * Ensure a blog post has translations for the target locale.
 */
export async function ensureBlogTranslated<T extends {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  lang?: string;
  translations?: Record<string, ContentTranslation>;
}>(post: T, targetLocale: string): Promise<T> {
  const sourceLang = post.lang || "en";
  if (sourceLang === targetLocale) return post;
  if (post.translations?.[targetLocale]) return post;

  try {
    const translations = await translateBlog(
      post.title,
      post.excerpt,
      post.content,
      sourceLang,
    );
    const merged = { ...(post.translations || {}), ...translations };
    await update("blog", post.id, { lang: sourceLang, translations: merged });
    return { ...post, lang: sourceLang, translations: merged };
  } catch (err) {
    console.error("On-demand blog translation failed:", err);
    return post;
  }
}

// ─── Display helpers ─────────────────────────────────

/**
 * Get the best title for the current locale.
 * Falls back to the original if no translation exists.
 */
export function getTranslatedTitle(
  item: { title: string; lang?: string; translations?: Record<string, ContentTranslation> },
  locale: string,
): string {
  if (!item.translations || item.lang === locale) return item.title;
  return item.translations[locale]?.title || item.title;
}

/**
 * Get the best content for the current locale.
 * Falls back to the original if no translation exists.
 */
export function getTranslatedContent(
  item: { content: string; lang?: string; translations?: Record<string, ContentTranslation> },
  locale: string,
): string {
  if (!item.translations || item.lang === locale) return item.content;
  return item.translations[locale]?.content || item.content;
}

/**
 * Get the best excerpt for the current locale (blog posts).
 * Falls back to the original if no translation exists.
 */
export function getTranslatedExcerpt(
  item: { excerpt: string; lang?: string; translations?: Record<string, ContentTranslation> },
  locale: string,
): string {
  if (!item.translations || item.lang === locale) return item.excerpt;
  return item.translations[locale]?.excerpt || item.excerpt;
}
