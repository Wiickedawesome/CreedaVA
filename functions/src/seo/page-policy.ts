/**
 * Which checks apply to which page.
 *
 * The audit used to judge every page by one standard, so a contact form and a
 * 1,800-word article were held to the same depth expectations. Measured
 * 2026-11-25: `/contact` was reported "thin" at 154 words and `/join` at 49,
 * both of which are complete pages doing their job — a form does not need six
 * paragraphs, and no search engine has a minimum word count.
 *
 * Two kinds are enough to express that difference:
 *
 *   content — a page written to be read. Advice about depth, title length and
 *             LLM citability applies.
 *   utility — a page that exists to do something (form, index, legal text,
 *             discussion thread). Only defects apply: a missing title, a
 *             missing description, a broken canonical.
 *
 * Every page is still crawled, scored and inspected. Only the *advice* is
 * withheld, so a utility page that regresses into a true defect is still
 * reported.
 */

export type PageKind = "content" | "utility";

/** Exact paths whose job is not to carry prose. */
const UTILITY_PATHS = new Set([
  "/contact",
  "/join",
  "/faq",
  "/news",
  "/forum",
  "/privacy",
  "/terms",
]);

/** Path prefixes that are user-generated or listing pages. */
const UTILITY_PREFIXES = ["/forum/"];

export function pageKind(pathKey: string): PageKind {
  if (UTILITY_PATHS.has(pathKey)) return "utility";
  if (UTILITY_PREFIXES.some((prefix) => pathKey.startsWith(prefix))) return "utility";
  return "content";
}

/**
 * Issues that measure editorial effort rather than correctness.
 *
 * Silence here is not a pass mark — these checks would fire on almost any site
 * and their absence says "not applicable", not "good".
 */
const ADVICE_CODES = new Set([
  "title-long",
  "meta-short",
  "meta-long",
  "thin-content",
  "no-qa-blocks",
  "no-source-citations",
  "faq-schema-missing",
  "article-schema-missing",
  "few-quotable-bullets",
  "shallow-headings",
  "thin-paragraphs",
]);

/** Should `code` be reported for the page at `pathKey`? */
export function appliesToPage(code: string, pathKey: string): boolean {
  if (pageKind(pathKey) === "content") return true;
  return !ADVICE_CODES.has(code);
}
