/**
 * Unit tests for the on-page audit parser.
 *
 * Regression: cheerio's `.text()` includes <script> contents, which fed inline
 * JSON-LD into bodyText and then into generated meta descriptions.
 */

import { describe, expect, test } from "vitest";
import { auditOne } from "../src/seo/onpage";

const URL_UNDER_TEST = "https://creedava.com/services";

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
