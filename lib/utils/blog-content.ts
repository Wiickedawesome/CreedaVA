/**
 * Blog body HTML normalisation.
 *
 * The page already renders the post title as an `<h1>`, so any `<h1>` inside
 * AI-generated body HTML produces a second top-level heading on the same
 * document. Google treats that as a structural defect, and screen readers
 * announce two page titles.
 *
 * Rather than rewriting stored content, demote body headings to `<h2>` at
 * render time — this also repairs posts that were already published.
 */

const OPENING_H1 = /<h1(\s[^>]*)?>/gi;
const CLOSING_H1 = /<\/h1\s*>/gi;

/** Demote every `<h1>` in the given HTML fragment to `<h2>`. */
export function demoteBodyH1(html: string): string {
  if (!html || !/<h1[\s>]/i.test(html)) return html;
  return html.replace(OPENING_H1, "<h2$1>").replace(CLOSING_H1, "</h2>");
}
