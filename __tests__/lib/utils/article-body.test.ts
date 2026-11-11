import { describe, expect, it } from "vitest";
import { rebuildArticleBody, stripDuplicateTitle } from "@/lib/utils/article-body";

describe("rebuildArticleBody — keeps what an article has", () => {
  it("keeps headings, paragraphs and links", () => {
    const html =
      '<h2>Why it matters</h2><p>Small teams recover <a href="https://example.com">hours</a> every week.</p>';
    expect(rebuildArticleBody(html)).toBe(html);
  });

  it("keeps list structure even when the stored markup suppressed the markers", () => {
    const html = '<ul style="list-style:none"><li>One</li><li>Two</li></ul>';
    expect(rebuildArticleBody(html)).toBe("<ul><li>One</li><li>Two</li></ul>");
  });

  it("keeps tables as tables and drops their layout attributes", () => {
    const html =
      '<table width="100%"><thead><tr><th style="color:#fff">Metric</th></tr></thead><tbody><tr><td>42</td></tr></tbody></table>';
    expect(rebuildArticleBody(html)).toBe(
      "<table><tr><th>Metric</th></tr><tr><td>42</td></tr></table>",
    );
  });

  it("keeps images with src and alt, and drops sizing attributes", () => {
    const html = '<p><img src="/a.png" alt="A chart" width="900" style="width:100%"></p>';
    expect(rebuildArticleBody(html)).toBe('<p><img src="/a.png" alt="A chart" loading="lazy"></p>');
  });

  it("keeps block quotes, pre blocks and Q&A blocks", () => {
    const html =
      '<blockquote><p>Stop guessing.</p></blockquote><pre><code>npm run build</code></pre>' +
      "<details><summary>Is it fast?</summary><p>Yes.</p></details>";
    expect(rebuildArticleBody(html)).toBe(html);
  });
});

describe("rebuildArticleBody — removes the old design scaffolding", () => {
  it("drops SVG bullets and wave dividers, keeping the text beside them", () => {
    const html =
      '<ul><li><svg fill="#005148" viewBox="0 0 24 24"><path d="M1 1"></path></svg>Faster onboarding</li></ul>' +
      '<svg class="cv-fade-up-d1" viewBox="0 0 1440 75"><path fill="#F9FBFF"></path></svg>';
    expect(rebuildArticleBody(html)).toBe("<ul><li>Faster onboarding</li></ul>");
  });

  it("drops an empty animated counter and its orphaned percentage sign", () => {
    const html =
      '<div class="cv-grid-2"><div style="padding:32px"><div class="cv-counter"></div>' +
      "<span>%</span><div>Increase in Lead Conversion</div></div></div>" +
      "<p>A real sentence follows, and it keeps its place in the article.</p>";
    expect(rebuildArticleBody(html)).toBe(
      "<p>A real sentence follows, and it keeps its place in the article.</p>",
    );
  });

  it("removes class, id and style attributes from everything it keeps", () => {
    const html =
      '<p class="cv-fade-up" id="card-1" style="text-align:center" align="center">Lead time dropped by <strong>40%</strong> in the first quarter.</p>';
    expect(rebuildArticleBody(html)).toBe(
      "<p>Lead time dropped by <strong>40%</strong> in the first quarter.</p>",
    );
  });

  it("unwraps section and div scaffolding without losing nested headings", () => {
    const html =
      '<section class="cv-section"><div class="cv-inner"><h2>A new section</h2>' +
      "<div><p>Prose inside two wrappers.</p></div></div></section>";
    expect(rebuildArticleBody(html)).toBe("<h2>A new section</h2><p>Prose inside two wrappers.</p>");
  });

  it("drops scripts, style blocks, iframes and forms outright", () => {
    const html =
      "<style>p{color:red}</style><script>alert(1)</script><iframe src=\"/x\"></iframe>" +
      "<form><input type=\"text\"></form><p>Kept.</p>";
    expect(rebuildArticleBody(html)).toBe("<p>Kept.</p>");
  });

  it("refuses javascript: URLs but keeps the link text", () => {
    const html = '<p><a href="javascript:alert(1)">Click</a> to read more.</p>';
    expect(rebuildArticleBody(html)).toBe("<p>Click to read more.</p>");
  });
});

describe("rebuildArticleBody — edge cases", () => {
  it("returns an empty string for empty input", () => {
    expect(rebuildArticleBody("")).toBe("");
    expect(rebuildArticleBody("   ")).toBe("");
  });

  it("recovers from unclosed and stray tags", () => {
    expect(rebuildArticleBody("<p>An unclosed paragraph still reaches the page.")).toBe(
      "<p>An unclosed paragraph still reaches the page.</p>",
    );
    expect(rebuildArticleBody("</div></section><p>A stray closing tag is ignored.</p>")).toBe(
      "<p>A stray closing tag is ignored.</p>",
    );
  });

  it("escapes a bare ampersand so the output stays valid", () => {
    expect(rebuildArticleBody("<p>R&D spend rose 12% while headcount stayed flat.</p>")).toBe(
      "<p>R&amp;D spend rose 12% while headcount stayed flat.</p>",
    );
  });

  it("joins inline siblings that were split across legacy wrappers", () => {
    const html = "<div>Lead with <strong>bold</strong> and then plain text here.</div>";
    expect(rebuildArticleBody(html)).toBe("<p>Lead with <strong>bold</strong> and then plain text here.</p>");
  });
});

describe("rebuildArticleBody — card labels", () => {
  it("drops an unpunctuated card label and its bare figure", () => {
    expect(rebuildArticleBody("<p>Increase in Lead Conversion</p><p>~10%</p>")).toBe("");
  });

  it("keeps a short paragraph that reads as a sentence", () => {
    expect(rebuildArticleBody("<p>That is the whole point.</p>")).toBe("<p>That is the whole point.</p>");
  });
});

describe("rebuildArticleBody — metric strip", () => {
  it("keeps the one sanctioned wrapper and normalises it", () => {
    const html =
      '<div class="mk-stats" style="padding:32px"><div class="mk-stat">' +
      "<strong>15</strong><span>minutes a day</span></div></div>";
    expect(rebuildArticleBody(html)).toBe(
      '<div class="mk-stats"><div class="mk-stat"><strong>15</strong><span>minutes a day</span></div></div>',
    );
  });

  it("keeps every stat in a multi-stat strip", () => {
    const html =
      '<div class="mk-stats">' +
      '<div class="mk-stat"><strong>30</strong><span>days to a first version</span></div>' +
      '<div class="mk-stat"><strong>4</strong><span>reviews before it is trusted</span></div>' +
      "</div>";
    expect(rebuildArticleBody(html)).toBe(html);
  });

  it("drops a stat that lost its figure or its label", () => {
    const html =
      '<div class="mk-stats">' +
      '<div class="mk-stat"><span>no figure here</span></div>' +
      '<div class="mk-stat"><strong>15</strong></div>' +
      '<div class="mk-stat"><strong>7</strong><span>days</span></div>' +
      "</div>";
    expect(rebuildArticleBody(html)).toBe(
      '<div class="mk-stats"><div class="mk-stat"><strong>7</strong><span>days</span></div></div>',
    );
  });

  it("still unwraps a div whose class is not the sanctioned one", () => {
    const html =
      '<div class="mk-stats-extra"><div class="mk-stat"><strong>15</strong><span>days</span></div></div>' +
      "<p>A real sentence follows, and it keeps its place in the article.</p>";
    expect(rebuildArticleBody(html)).toBe(
      "<p>A real sentence follows, and it keeps its place in the article.</p>",
    );
  });

  it("does not treat a lone stat as a strip", () => {
    const html =
      '<div class="mk-stat"><strong>15</strong><span>days</span></div>' +
      "<p>A real sentence follows, and it keeps its place in the article.</p>";
    expect(rebuildArticleBody(html)).toBe(
      "<p>A real sentence follows, and it keeps its place in the article.</p>",
    );
  });
});

describe("rebuildArticleBody — infographic blocks", () => {
  it("draws each bar as a proportion of the largest real figure", () => {
    const html =
      '<div class="mk-bars">' +
      '<div class="mk-bar"><span>Referral</span><strong>78%</strong></div>' +
      '<div class="mk-bar"><span>Paid social</span><strong>39%</strong></div>' +
      "</div>";
    expect(rebuildArticleBody(html)).toBe(
      '<div class="mk-bars">' +
        '<div class="mk-bar" style="--mk-width:100%"><span>Referral</span><strong>78%</strong></div>' +
        '<div class="mk-bar" style="--mk-width:50%"><span>Paid social</span><strong>39%</strong></div>' +
        "</div>",
    );
  });

  it("reads magnitudes out of prices and thousands separators", () => {
    const html =
      '<div class="mk-bars">' +
      '<div class="mk-bar"><span>Full-time hire</span><strong>$4,800</strong></div>' +
      '<div class="mk-bar"><span>Managed VA</span><strong>$1,200</strong></div>' +
      "</div>";
    expect(rebuildArticleBody(html)).toContain('style="--mk-width:25%"');
  });

  it("drops a bar with no figure, no label, or a non-numeric figure", () => {
    const html =
      '<div class="mk-bars">' +
      '<div class="mk-bar"><span>No figure</span></div>' +
      '<div class="mk-bar"><strong>42%</strong></div>' +
      '<div class="mk-bar"><span>Unreadable</span><strong>lots</strong></div>' +
      '<div class="mk-bar"><span>Kept</span><strong>42%</strong></div>' +
      "</div>";
    expect(rebuildArticleBody(html)).toBe(
      '<div class="mk-bars"><div class="mk-bar" style="--mk-width:100%"><span>Kept</span><strong>42%</strong></div></div>',
    );
  });

  it("keeps a process flow and lets the stylesheet draw the numbers", () => {
    const html =
      '<div class="mk-flow">' +
      '<div class="mk-step"><strong>Define the questions</strong><span>Write them down.</span></div>' +
      '<div class="mk-step"><strong>Connect the sources</strong><span>No exports.</span></div>' +
      "</div>";
    expect(rebuildArticleBody(html)).toBe(
      '<div class="mk-flow">' +
        '<div class="mk-step"><strong>Define the questions</strong><span>Write them down.</span></div>' +
        '<div class="mk-step"><strong>Connect the sources</strong><span>No exports.</span></div>' +
        "</div>",
    );
  });

  it("keeps a mockup title and its figures", () => {
    const html =
      '<div class="mk-mockup">' +
      '<div class="mk-mockup-title">Bookings · today</div>' +
      '<div class="mk-stat"><strong>12</strong><span>confirmed</span></div>' +
      "</div>";
    expect(rebuildArticleBody(html)).toBe(
      '<div class="mk-mockup"><span class="mk-mockup-title">Bookings · today</span>' +
        '<div class="mk-stat"><strong>12</strong><span>confirmed</span></div></div>',
    );
  });

  it("drops a mockup with no figures, and a bare title div is unwrapped", () => {
    expect(rebuildArticleBody('<div class="mk-mockup"><div class="mk-mockup-title">Empty</div></div>')).toBe("");
    expect(rebuildArticleBody('<div class="mk-mockup-title">Just a title</div>')).toBe("");
  });
});

describe("stripDuplicateTitle", () => {
  it("drops a leading heading that repeats the article title", () => {
    const html = "<h2>Boost Growth</h2><p>Body.</p>";
    expect(stripDuplicateTitle(html, "Boost Growth")).toBe("<p>Body.</p>");
  });

  it("ignores case, punctuation and inline markup in the comparison", () => {
    const html = "<h2>Boost <em>Growth</em>:</h2><p>Body.</p>";
    expect(stripDuplicateTitle(html, "boost growth")).toBe("<p>Body.</p>");
  });

  it("drops a title the body announces with a different wording", () => {
    const html =
      "<h2>Boost Growth: Integrate Business Intelligence into Your Daily VA Dashboard</h2><p>Body.</p>";
    expect(
      stripDuplicateTitle(html, "Boost Growth: Integrate BI into Your Daily VA Dashboard"),
    ).toBe("<p>Body.</p>");
  });

  it("keeps a leading heading that is a real first section", () => {
    const html = "<h2>Why it matters</h2><p>Body.</p>";
    expect(stripDuplicateTitle(html, "Boost Growth")).toBe(html);
  });

  it("leaves a body without a leading heading untouched", () => {
    const html = "<p>Body.</p>";
    expect(stripDuplicateTitle(html, "Boost Growth")).toBe(html);
  });
});
