import { describe, expect, it } from "vitest";
import { buildSectionPreview } from "@/lib/utils/ai-preview";

const STYLES = ["https://creedava.com/_next/static/chunks/app.css"];

function body(raw: string): string {
  const match = /<div class="preview-content">([\s\S]*)<\/div>\s*<\/body>/.exec(raw);
  return match?.[1] ?? "";
}

describe("buildSectionPreview — blog result", () => {
  const result = JSON.stringify({
    title: "Boost Growth",
    excerpt: "A summary.",
    content:
      '<div class="cv-grid-2"><h2>Boost Growth</h2><p>In practice, this is what it looks like.</p>' +
      '<svg fill="#005148"><path d="M0 0"></path></svg></div>',
    references: [{ label: "World Bank data", url: "https://worldbank.org/x", source: "World Bank", year: "2025" }],
  });

  it("renders the article body instead of the JSON", () => {
    const html = buildSectionPreview(result, "Blog AI", STYLES);
    expect(html).not.toContain("&quot;content&quot;");
    expect(html).toContain('<div class="mk-article mk-article--wide">');
    expect(html).toContain("<p>In practice, this is what it looks like.</p>");
  });

  it("drops the legacy scaffolding the real route drops", () => {
    const html = buildSectionPreview(result, "Blog AI", STYLES);
    expect(html).not.toContain("cv-grid-2");
    expect(html).not.toContain("<svg");
  });

  it("removes the duplicated title heading", () => {
    const html = buildSectionPreview(result, "Blog AI", STYLES);
    expect(html).not.toContain("<h2>Boost Growth</h2>");
  });

  it("lists the references, linking the ones with a URL", () => {
    const html = buildSectionPreview(result, "Blog AI", STYLES);
    expect(html).toContain('<a href="https://worldbank.org/x">World Bank data</a>');
    expect(html).toContain("World Bank, 2025");
  });

  it("links the caller's stylesheets so the preview uses the real design system", () => {
    expect(buildSectionPreview(result, "Blog AI", STYLES)).toContain(
      '<link rel="stylesheet" href="https://creedava.com/_next/static/chunks/app.css" />',
    );
  });
});

describe("buildSectionPreview — landing-page result", () => {
  const result = JSON.stringify({
    title: "Landing",
    bodyHtml: '<div style="display:grid;color:#002D72"><p>Keep the layout, lose the colour.</p></div>',
  });

  it("keeps inline layout, which is how a landing page is composed", () => {
    const html = buildSectionPreview(result, "Landing Pages", STYLES);
    expect(html).toContain('<div style="display:grid">');
    expect(html).not.toContain("#002D72");
  });

  it("uses the plain article container, not the wide one", () => {
    const html = buildSectionPreview(result, "Landing Pages", STYLES);
    expect(html).toContain('<div class="mk-article">');
    expect(html).not.toContain("mk-article--wide");
  });
});

describe("buildSectionPreview — non-page results", () => {
  it("shows a plain-text result as-is, escaped", () => {
    const html = buildSectionPreview("A short <answer> & more", "Blog AI", STYLES);
    expect(html).toContain("A short &lt;answer&gt; &amp; more");
  });

  it("shows JSON that carries no body as-is", () => {
    const raw = JSON.stringify({ seoScore: 82 });
    expect(body(buildSectionPreview(raw, "SEO AI", STYLES))).toContain("seoScore");
  });
});
