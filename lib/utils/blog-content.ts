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

/** A section of the article, used to build the table of contents. */
export interface ArticleHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface AnchoredBody {
  html: string;
  headings: ArticleHeading[];
}

const BODY_HEADING = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1\s*>/gi;
const ID_ATTRIBUTE = /\bid=(["'])(.*?)\1/;
const ANY_TAG = /<[^>]*>/g;

/** Entities that realistically appear in a heading, decoded for the nav label. */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function headingText(inner: string): string {
  const stripped = inner.replace(ANY_TAG, " ");
  const decoded = stripped.replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? entity);
  return decoded.replace(/\s+/g, " ").trim();
}

/** URL-safe, accent-folded, length-capped anchor id. */
function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return slug || "section";
}

function uniqueId(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * Give every body `h2`/`h3` a stable `id` and return the list the table of
 * contents renders from.
 *
 * Done on the HTML string rather than with a DOM pass because the body is
 * injected with `dangerouslySetInnerHTML` and never mounted as React nodes.
 * Ids that already exist on a heading are respected, so a hand-authored anchor
 * survives; repeated heading text gets a numeric suffix instead of colliding.
 */
export function withHeadingAnchors(html: string): AnchoredBody {
  const headings: ArticleHeading[] = [];
  const used = new Set<string>();

  const anchored = html.replace(BODY_HEADING, (match, level: string, attrs = "", inner: string) => {
    const text = headingText(inner);
    if (!text) return match;

    const existing = ID_ATTRIBUTE.exec(attrs);
    if (existing) {
      used.add(existing[2]);
      headings.push({ id: existing[2], text, level: Number(level) as 2 | 3 });
      return match;
    }

    const id = uniqueId(slugify(text), used);
    used.add(id);
    headings.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });

  return { html: anchored, headings };
}
