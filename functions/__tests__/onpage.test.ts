/**
 * Unit tests for the on-page audit parser.
 *
 * Regression: cheerio's `.text()` includes <script> contents, which fed inline
 * JSON-LD into bodyText and then into generated meta descriptions.
 */

import { describe, expect, test } from "vitest";
import { auditOne, desiredTitle, parsedNothing } from "../src/seo/onpage";

const URL_UNDER_TEST = "https://creedava.com/services";

/** Mirrors `TITLE_RANGE.min` in onpage.ts — a suggestion must clear it. */
const TITLE_MIN = 30;

function pageHtml(bodyHtml: string, headHtml = ""): string {
  return `<!doctype html><html><head>
    <title>Virtual Assistant Services | CreedaVA</title>
    <meta name="description" content="A valid meta description that is comfortably longer than seventy characters for the audit." />
    <link rel="canonical" href="${URL_UNDER_TEST}" />
    ${headHtml}
  </head><body>${bodyHtml}</body></html>`;
}

describe("auditOne body text extraction", () => {
  test("ignores inline JSON-LD so it cannot leak into meta descriptions", () => {
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "CreedaVA",
      description: "Professional virtual assistant services for businesses.",
    });

    const audit = auditOne(
      URL_UNDER_TEST,
      200,
      pageHtml(
        `<script type="application/ld+json">${jsonLd}</script>
         <h1>Virtual Assistant Services</h1>
         <p>Dedicated bilingual assistants handle admin, support, and reporting work.</p>`,
      ),
      120,
    );

    expect(audit.bodyText).not.toContain("@context");
    expect(audit.bodyText).not.toContain("schema.org");
    expect(audit.bodyText).toContain("Dedicated bilingual assistants");
  });

  test("ignores <style> and <noscript> contents", () => {
    const audit = auditOne(
      URL_UNDER_TEST,
      200,
      pageHtml(
        `<style>.hidden-marker{color:red}</style>
         <noscript>noscript-marker</noscript>
         <h1>Virtual Assistant Services</h1>
         <p>Visible paragraph content for the audit body text.</p>`,
      ),
      120,
    );

    expect(audit.bodyText).not.toContain("hidden-marker");
    expect(audit.bodyText).not.toContain("noscript-marker");
  });

  test("still detects JSON-LD types for schema checks", () => {
    const audit = auditOne(
      URL_UNDER_TEST,
      200,
      pageHtml(
        `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization"}</script>
         <h1>Virtual Assistant Services</h1>
         <p>Visible paragraph content for the audit body text.</p>`,
      ),
      120,
    );

    expect(audit.jsonLdTypes).toContain("Organization");
  });
});

describe("auditOne title extraction", () => {
  /**
   * Regression: every SVG logo carries its own <title> for its accessible name,
   * so a document-wide title read picked up "CreedaVA" instead of the page
   * title. The audit must scope to <head> and prefer the longer candidate.
   */
  const LOGO_TITLE =
    '<footer><svg role="img" aria-label="CreedaVA"><title>CreedaVA</title></svg></footer>';

  test("reads the head title and ignores the logo's SVG title", () => {
    const audit = auditOne(URL_UNDER_TEST, 200, pageHtml(`<h1>Services</h1>${LOGO_TITLE}`), 100);

    expect(audit.title).toBe("Virtual Assistant Services | CreedaVA");
    expect(audit.issues.map((i) => i.code)).not.toContain("title-missing");
  });

  test("picks the longest title when head declares more than one", () => {
    const html = `<!doctype html><html><head>
      <title>CreedaVA</title>
      <title>Virtual Assistant Services | CreedaVA</title>
      <meta name="description" content="A valid meta description that is comfortably longer than seventy characters for the audit." />
    </head><body><h1>Services</h1></body></html>`;

    const audit = auditOne(URL_UNDER_TEST, 200, html, 100);
    expect(audit.title).toBe("Virtual Assistant Services | CreedaVA");
    expect(audit.titleLength).toBe(audit.title?.length);
  });

  test("reports a missing title only when head has none at all", () => {
    const html = `<!doctype html><html><head>
      <meta name="description" content="A valid meta description that is comfortably longer than seventy characters for the audit." />
    </head><body><h1>Services</h1>${LOGO_TITLE}</body></html>`;

    const audit = auditOne(URL_UNDER_TEST, 200, html, 100);
    expect(audit.title).toBeNull();
    expect(audit.issues.map((i) => i.code)).toContain("title-missing");
  });

  test("handles a document with no head element", () => {
    const audit = auditOne(URL_UNDER_TEST, 200, "<p>bare fragment</p>", 100);
    expect(audit.title).toBeNull();
    expect(audit.issues.map((i) => i.code)).toContain("title-missing");
  });

  test("ignores an empty description tag before a real one", () => {
    const html = `<!doctype html><html><head>
      <title>Virtual Assistant Services | CreedaVA</title>
      <meta name="description" content="" />
      <meta name="description" content="A valid meta description that is comfortably longer than seventy characters for the audit." />
    </head><body><h1>Services</h1></body></html>`;

    const audit = auditOne(URL_UNDER_TEST, 200, html, 100);
    expect(audit.metaDescription).toContain("A valid meta description");
    expect(audit.issues.map((i) => i.code)).not.toContain("meta-missing");
  });
});

/**
 * Regression: Next.js streams suspended content after the shell, so `<main>`
 * holds a loading skeleton and the real markup arrives in `<div hidden id="S:n">`.
 * A plain fetch never swaps it in, so scoping to `<main>` read the skeleton and
 * every page reported `wordCount: 0`.
 */
describe("auditOne streamed content", () => {
  const STREAMED_BODY = `<main><!--$?--><template id="B:0"></template>
      <div role="status" aria-busy="true" aria-label="Loading page content">
        <div class="animate-pulse"><div class="h-10 bg-mk-line"></div></div>
      </div>
    <!--/$--></main>
    <div hidden id="S:0">
      <h1>Services</h1>
      <p>Dedicated bilingual assistants handle admin, support and reporting work.</p>
    </div>`;

  test("reads the suspended markup instead of the skeleton", () => {
    const audit = auditOne(URL_UNDER_TEST, 200, pageHtml(STREAMED_BODY), 100);

    expect(audit.bodyText).toContain("Dedicated bilingual assistants");
    expect(audit.wordCount).toBeGreaterThan(0);
    expect(audit.h1Count).toBe(1);
  });

  test("still reads <main> when nothing was suspended", () => {
    const audit = auditOne(
      URL_UNDER_TEST,
      200,
      pageHtml(`<main><h1>Services</h1><p>Plain server-rendered paragraph content.</p></main>`),
      100,
    );

    expect(audit.bodyText).toContain("Plain server-rendered paragraph");
  });

  test("keeps a shell with no real content reportable as thin", () => {
    const audit = auditOne(
      URL_UNDER_TEST,
      200,
      pageHtml(`<main><div role="status" aria-busy="true"></div></main>`),
      100,
    );

    expect(audit.wordCount).toBe(0);
  });
});

/**
 * A 200 with nothing in it means the page was never read. Scoring it invented
 * six findings per URL — measured 2026-11-23, seven pages all landing on
 * exactly 54 with "title-missing" and "meta-missing" while the live site served
 * both.
 */
describe("parsedNothing", () => {
  const EMPTY_HTML = "<!doctype html><html><head></head><body></body></html>";

  test("flags a document that parsed to nothing", () => {
    const audit = auditOne(URL_UNDER_TEST, 200, EMPTY_HTML, 80);
    expect(parsedNothing(audit)).toBe(true);
  });

  test("does not flag a page that only has a title", () => {
    const audit = auditOne(
      URL_UNDER_TEST,
      200,
      `<!doctype html><html><head><title>Services | CreedaVA</title></head><body></body></html>`,
      80,
    );
    expect(parsedNothing(audit)).toBe(false);
  });

  test("does not flag a page that only has a heading", () => {
    const audit = auditOne(URL_UNDER_TEST, 200, "<h1>Services</h1>", 80);
    expect(parsedNothing(audit)).toBe(false);
  });
});

/**
 * The suggestion exists to clear `title-short`, so it must clear the same
 * 30-character floor. Measured before this fix: /faq offered "CreedaVA — FAQ"
 * (14 chars), so applying Fix wrote a title that immediately re-failed the
 * check and offered itself again.
 */
describe("desiredTitle", () => {
  /** A parsed audit with only the fields `desiredTitle` reads. */
  function auditWithTitle(title: string | null, pathKey = "/about") {
    return { ...auditOne("https://creedava.com" + pathKey, 200, "<h1>x</h1>", 50), title, pathKey };
  }

  test("returns null when the current title already clears the minimum", () => {
    expect(desiredTitle(auditWithTitle("About CreedaVA Virtual Assistants"))).toBeNull();
  });

  test("clears the minimum for a short path label", () => {
    const suggestion = desiredTitle(auditWithTitle(null, "/faq"));
    expect(suggestion).not.toBeNull();
    expect(suggestion!.length).toBeGreaterThanOrEqual(TITLE_MIN);
    expect(suggestion).toContain("FAQ");
  });

  test("keeps the homepage suggestion in range without the brand suffix", () => {
    expect(desiredTitle(auditWithTitle(null, "/"))).toBe("CreedaVA — Virtual Assistant Services");
  });

  test("a missing title is suggested with the page name, not the raw path", () => {
    expect(desiredTitle(auditWithTitle(null, "/privacy"))).toContain("Privacy Policy");
  });
});
