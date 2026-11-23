/**
 * Keep the brand out of page titles twice.
 *
 * The root layout's `title.template` appends "| CreedaVA" to every page title,
 * but a `page-seo` document can already carry the brand — measured on /faq,
 * which stored "CreedaVA — Faq" and shipped as
 * "CreedaVA — Faq | CreedaVA".
 *
 * Stored titles are editable content, so the guard lives here rather than in
 * the metadata editor: whatever an author types cannot duplicate the brand.
 */

const BRAND = "CreedaVA";

/** Separators a stored title may use around the brand name. */
const SEPARATOR = String.raw`\s*[|—–]\s*|\s+-\s+`;

// The group is required: without it the alternation above would escape the
// anchor and match a bare separator anywhere in the title.
const LEADING_BRAND = new RegExp(`^${BRAND}(?:${SEPARATOR})`, "i");
const TRAILING_BRAND = new RegExp(`(?:${SEPARATOR})${BRAND}$`, "i");

/**
 * Remove one leading or trailing brand mention from a title.
 *
 * Returns the original string when stripping would leave nothing, so a title
 * that is only the brand still renders something.
 */
export function stripBrandDuplication(title: string): string {
  const stripped = title
    .replace(LEADING_BRAND, "")
    .replace(TRAILING_BRAND, "")
    .trim();

  return stripped.length > 0 ? stripped : title;
}
