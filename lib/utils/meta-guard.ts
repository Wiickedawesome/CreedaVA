/**
 * Guard against meta values corrupted by the SEO agent's crawler.
 *
 * Kept dependency-free and in `lib/utils` so both the server-side metadata
 * loader (`lib/firebase/seo.ts`) and the client-side admin table
 * (`app/(admin)/admin/metadata/page.tsx`) can share one definition. Importing
 * this from `lib/firebase/seo.ts` instead would drag the Firebase Admin SDK —
 * and its `child_process` import — into the browser bundle.
 *
 * Two known corruption shapes, both caused by reading collapsed `<body>` text:
 *
 *  1. Inline JSON-LD captured as body text and written into `description`.
 *  2. Navigation/skip-link text glued together by whitespace collapsing —
 *     "Skip to main contentCreedaVAHomeServicesPricingAbout…". This one is
 *     worse than useless: it once shipped on the live page and in the SERP.
 *
 * A rejected value is not deleted. `getPageSEO()` falls back to the page's own
 * hand-written `metadata()` constant, so the live page stays correct while the
 * stored string can still be inspected and repaired deliberately.
 */
export function isUsableMetaValue(value: string): boolean {
  if (value.includes('"@context"')) return false;

  // Chrome leaked into the description.
  if (/skip to (main )?content/i.test(value)) return false;

  // Two nav labels concatenated with no separator: "HomeServices", "AboutNews".
  if (/\b(Home|Services|Pricing|About|News|Contact)(Services|Pricing|About|News|Contact)\b/.test(value)) {
    return false;
  }

  // Every description the old extractor produced was capped with "..." — it
  // only truncates when nothing looked like a real sentence.
  return !value.endsWith("...");
}
