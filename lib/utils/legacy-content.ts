/**
 * Render-time normalisation for stored marketing HTML.
 *
 * Blog posts and landing-page bodies are authored (or AI-generated) as raw HTML
 * strings in Firestore. Anything written before the `--mk-*` redesign carries
 * the old design system *inside the markup*: teal→navy gradients, `#002D72`
 * headings, `#DDE1E6` borders, and a literal `<style>` block of `@keyframes`.
 *
 * The `.mk-article` stylesheet cannot correct any of that, because inline styles
 * beat class selectors and an injected `<style>` block is global to the document.
 * So the fix has to happen on the HTML, not on the CSS.
 *
 * We normalise at render time rather than rewriting Firestore documents: it
 * repairs every already-published post, needs no migration, and stays correct if
 * a document is edited again by an older client.
 *
 * What this does NOT do: it does not sanitise. Use `sanitizeHtml` for untrusted
 * input. This only removes style that fights the design system.
 */

/**
 * `<style>` and `<script>` blocks are removed outright.
 *
 * `<style>` is the important one — agents used to be instructed to emit one at
 * the top of the body, and once injected its rules apply to the whole document,
 * including the site chrome around the article.
 */
const EMBEDDED_BLOCK = /<(style|script)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/** `<link>` is void — no closing tag, so it needs its own pattern. */
const LINK_TAG = /<link\b[^>]*>/gi;

/** `style="…"` or `style='…'`, including the leading space so removal is clean. */
const STYLE_ATTRIBUTE = /\s*style=(["'])([\s\S]*?)\1/gi;

/**
 * Declarations we keep: layout and geometry only.
 *
 * This is an allowlist on purpose. A blocklist of colour/decoration properties
 * would silently keep the next legacy property someone invents, and the failure
 * mode (an off-brand colour that only the stylesheet could have fixed) is
 * exactly what we are trying to eliminate.
 */
const LAYOUT_PROPERTY =
  /^(?:display|position|top|right|bottom|left|inset|z-index|float|clear|overflow|overflow-x|overflow-y|overflow-wrap|width|min-width|max-width|height|min-height|max-height|aspect-ratio|object-fit|object-position|margin|margin-top|margin-right|margin-bottom|margin-left|padding|padding-top|padding-right|padding-bottom|padding-left|gap|row-gap|column-gap|grid|grid-template-columns|grid-template-rows|grid-column|grid-row|flex|flex-direction|flex-wrap|flex-grow|flex-shrink|flex-basis|align-items|align-self|align-content|justify-content|justify-items|justify-self|place-items|place-content|order|text-align|vertical-align|white-space|list-style|list-style-type)$/;

function isLayoutDeclaration(declaration: string): boolean {
  const colon = declaration.indexOf(":");
  if (colon === -1) return false;
  return LAYOUT_PROPERTY.test(declaration.slice(0, colon).trim().toLowerCase());
}

function rebuildStyleAttribute(_match: string, quote: string, body: string): string {
  const kept = body
    .split(";")
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration && isLayoutDeclaration(declaration));

  // An empty style="" is noise; drop the attribute (and its leading space).
  return kept.length > 0 ? ` style=${quote}${kept.join("; ")}${quote}` : "";
}

/**
 * Strip legacy styling from a stored HTML fragment so `.mk-article` can style it.
 * Leaves text, structure and layout untouched.
 */
export function normalizeLegacyHtml(html: string): string {
  if (!html) return html;

  return html
    .replace(EMBEDDED_BLOCK, "")
    .replace(LINK_TAG, "")
    .replace(STYLE_ATTRIBUTE, rebuildStyleAttribute);
}
