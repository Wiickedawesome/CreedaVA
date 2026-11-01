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
