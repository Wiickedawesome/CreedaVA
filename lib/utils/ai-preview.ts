import { rebuildArticleBody, stripDuplicateTitle } from "@/lib/utils/article-body";
import { normalizeLegacyHtml } from "@/lib/utils/legacy-content";

/**
 * Preview pages for AI generation results.
 *
 * Some sections return JSON whose `content` / `bodyHtml` field is the actual
 * page body (blog posts, landing pages). Injecting the raw response into a
 * preview showed the admin a JSON blob — the one place the article look could be
 * checked before publishing, showing nothing of the article.
 *
 * Each body is now rendered by the same function its real route uses, so the
 * preview cannot drift from production: a blog post goes through
 * `rebuildArticleBody` + `stripDuplicateTitle` inside `.mk-article--wide`, a
 * landing page through `normalizeLegacyHtml` inside `.mk-article`.
 */

/**
 * Known body fields and the treatment their route applies.
 *
 * `content` is a blog body: it is rebuilt into semantic HTML and the article
 * stylesheet owns its typography. `bodyHtml` is a landing page: it is one
 * designed surface, so only legacy colour/decoration is stripped and its own
 * layout survives.
 */
const BODY_FIELDS = [
  { key: "content", build: rebuildArticleBody, article: true },
  { key: "bodyHtml", build: normalizeLegacyHtml, article: false },
] as const;

interface PreviewableResult {
  body: string;
  article: boolean;
  title?: string;
  excerpt?: string;
  references?: { label?: string; url?: string; source?: string; year?: string }[];
}

function readResult(raw: string): PreviewableResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const record = parsed as Record<string, unknown>;
  const field = BODY_FIELDS.find(
    ({ key }) => typeof record[key] === "string" && (record[key] as string).trim(),
  );
  if (!field) return null;

  return {
    body: field.build(record[field.key] as string),
    article: field.article,
    title: typeof record.title === "string" ? record.title : undefined,
    excerpt: typeof record.excerpt === "string" ? record.excerpt : undefined,
    references: Array.isArray(record.references)
      ? (record.references as PreviewableResult["references"])
      : undefined,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSources(references: PreviewableResult["references"]): string {
  const items = (references ?? [])
    .map((entry) => {
      const label = (entry?.label ?? "").trim();
      if (!label) return "";
      const name = escapeHtml(label);
      const text = entry?.url ? `<a href="${escapeHtml(entry.url)}">${name}</a>` : name;
      const meta = [entry?.source, entry?.year].filter(Boolean).join(", ");
      return `<li>${text}${meta ? ` — ${escapeHtml(meta)}` : ""}</li>`;
    })
    .filter(Boolean);

  if (items.length === 0) return "";
  return `<section class="preview-sources"><h2>Sources</h2><ol>${items.join("")}</ol></section>`;
}

function renderBody(result: PreviewableResult): string {
  // A blog body repeats the title as its leading heading; the article route
  // removes it, so the preview must too or it shows a headline the page will not.
  const body = result.article && result.title ? stripDuplicateTitle(result.body, result.title) : result.body;
  const bodyClass = result.article ? "mk-article mk-article--wide" : "mk-article";

  const header = result.title
    ? `<header class="preview-header"><h1>${escapeHtml(result.title)}</h1>${
        result.excerpt ? `<p>${escapeHtml(result.excerpt)}</p>` : ""
      }</header>`
    : "";

  return `${header}<div class="${bodyClass}">${body}</div>${renderSources(result.references)}`;
}

/**
 * Build the preview document for an AI result.
 *
 * A JSON response carrying a body is rendered as an article; anything else is
 * shown as-is, which is what every non-page section needs.
 */
export function buildSectionPreview(raw: string, section: string, stylesheetHrefs: string[]): string {
  const result = readResult(raw);
  const stylesheets = stylesheetHrefs
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}" />`)
    .join("\n  ");

  const content = result
    ? renderBody(result)
    : `<div class="preview-raw">${escapeHtml(raw)}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview — ${escapeHtml(section)}</title>
  ${stylesheets}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Roboto', system-ui, sans-serif; background: #F7F7F2; color: #0B2135; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
    h1, h2, h3 { color: #0B2135; margin: 1.5rem 0 0.75rem; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    p { margin-bottom: 1rem; }
    ul, ol { margin: 0.5rem 0 1rem 1.5rem; }
    li { margin-bottom: 0.25rem; }
    a { color: #005148; }
    .preview-bar { position: fixed; top: 0; left: 0; right: 0; background: #005148; color: white; padding: 0.5rem 1rem; font-size: 0.875rem; text-align: center; z-index: 999; }
    .preview-content { margin-top: 3rem; }
    .preview-header { margin-bottom: 2rem; }
    .preview-header h1 { margin-top: 0; }
    .preview-header p { opacity: 0.8; }
    .preview-sources { margin-top: 3rem; border-top: 1px solid rgba(11, 33, 53, 0.15); padding-top: 1.5rem; }
    .preview-sources h2 { font-size: 1.1rem; }
    .preview-sources ol { font-size: 0.875rem; }
    .preview-raw { white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="preview-bar">Preview — ${escapeHtml(section)} | CreedaVA AI Generated Content</div>
  <div class="preview-content">${content}</div>
</body>
</html>`;
}
