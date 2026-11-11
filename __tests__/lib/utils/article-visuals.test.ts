import { describe, expect, it } from "vitest";
import { measureArticleVisuals, visualGaps } from "@/lib/utils/article-visuals";

/** Filler prose, so a fixture clears the word floor without padding by hand. */
const prose = (words = 900) => `<p>${Array.from({ length: words }, () => "word").join(" ")}</p>`;

const RICH_BODY = `
  <p>Opening paragraph that sets up the article.</p>
  <h2>One</h2><p>Words.</p>
  <h2>Two</h2>
  <figure><img src="/a.jpg" alt="A"><figcaption>A</figcaption></figure>
  <figure><img src="/b.jpg" alt="B"><figcaption>B</figcaption></figure>
  <h2>Three</h2>
  <table><tr><th>A</th></tr><tr><td>1</td></tr></table>
  <h2>Four</h2>
  <div class="mk-stats"><div class="mk-stat"><strong>15</strong><span>days</span></div></div>
  <div class="mk-bars"><div class="mk-bar"><span>A</span><strong>1</strong></div></div>
  <div class="mk-flow"><div class="mk-step"><strong>A</strong><span>B</span></div></div>
  <div class="mk-mockup"><div class="mk-stat"><strong>1</strong><span>B</span></div></div>
  ${prose()}
`;

describe("measureArticleVisuals", () => {
  it("counts every sanctioned block", () => {
    const visuals = measureArticleVisuals(RICH_BODY);
    expect(visuals.sections).toBe(4);
    expect(visuals.figures).toBe(2);
    expect(visuals.tables).toBe(1);
    expect(visuals.metricStrips).toBe(1);
    expect(visuals.barCharts).toBe(1);
    expect(visuals.flows).toBe(1);
    expect(visuals.mockups).toBe(1);
  });

  it("does not count markup or stylesheet text as words", () => {
    const visuals = measureArticleVisuals("<style>p{color:red}</style><p>One two three.</p>");
    expect(visuals.words).toBe(3);
  });

  it("does not count a plain div as a visual", () => {
    const visuals = measureArticleVisuals('<div><div><p>Words only.</p></div></div>');
    expect(visuals.tables + visuals.metricStrips + visuals.barCharts).toBe(0);
  });
});

describe("visualGaps", () => {
  it("reports nothing for a body that has the shapes", () => {
    expect(visualGaps(measureArticleVisuals(RICH_BODY))).toEqual([]);
  });

  it("names every gap in a prose-only body", () => {
    const gaps = visualGaps(measureArticleVisuals("<h2>One</h2><p>Short.</p>"));
    expect(gaps).toEqual([
      "under 800 words",
      "fewer than 4 sections",
      "fewer than 2 images",
      "no table, bar chart or mockup",
      "no metric strip or bar chart",
    ]);
  });

  it("treats a mockup as a chart, and a metric strip as a figure", () => {
    const body = `
      <h2>A</h2><h2>B</h2><h2>C</h2><h2>D</h2>
      <figure><img src="/a.jpg" alt="A"></figure>
      <figure><img src="/b.jpg" alt="B"></figure>
      <div class="mk-mockup"><div class="mk-stat"><strong>1</strong><span>B</span></div></div>
      <div class="mk-stats"><div class="mk-stat"><strong>1</strong><span>B</span></div></div>
      ${prose()}
    `;
    expect(visualGaps(measureArticleVisuals(body))).toEqual([]);
  });
});
