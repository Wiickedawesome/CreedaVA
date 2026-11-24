/**
 * Byline shown on every article.
 *
 * Posts are written by the SEO agent, but publicly they are the team's: the
 * stored `author` field is an implementation detail, and a jargon label like
 * "SEO Agent" reads to a visitor as an automated feed rather than an editorial
 * voice.
 *
 * The Cloud Functions package keeps its own copy of the literal in
 * `functions/src/seo/content-writer.ts`; it compiles against a separate
 * `tsconfig` and cannot import from `lib/`.
 */
export const BLOG_AUTHOR = "CreedaVA Team";

/**
 * Labels older drafts carried, from before the byline was the team's.
 *
 * `"SEO Agent"` is what `content-writer` used to store in `author`.
 * `"seo-agent"` is that writer's `source` value, mapped here too so a document
 * that was seeded with the two fields crossed over cannot leak the label.
 */
const LEGACY_BLOG_AUTHORS = new Set(["SEO Agent", "seo-agent"]);

/**
 * Resolve the byline for a post.
 *
 * Resolving at render time rather than only migrating the data means a post
 * shows the right byline even if its document was never migrated, and a missing
 * `author` still attributes the piece instead of dropping the byline entirely.
 */
export function blogAuthorName(author?: string): string {
  const trimmed = author?.trim();
  if (!trimmed || LEGACY_BLOG_AUTHORS.has(trimmed)) return BLOG_AUTHOR;
  return trimmed;
}
