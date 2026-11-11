/**
 * Visual coverage of an article body.
 *
 * The generation rules ask for images, tables, bar charts, metric strips and
 * mockups, but a prompt is a request, not a guarantee — a model can return
 * 1,500 words of paragraphs and nothing else, and it will look fine in the
 * editor. This measures what a body actually contains so the admin can be told
 * before publishing, instead of finding out on the live page.
 *
 * It counts the markup the renderer keeps (`rebuildArticleBody` in
 * `article-body.ts`), not raw tags: a `<div>` does not count as a visual, but
 * `<div class="mk-bars">` does.
 */

/** Minimum shape a published article is expected to have. */
const MIN_WORDS = 800;
const MIN_SECTIONS = 4;
const MIN_FIGURES = 2;

export interface ArticleVisuals {
  words: number;
  sections: number;
  figures: number;
  tables: number;
  metricStrips: number;
  barCharts: number;
  flows: number;
  mockups: number;
}

function count(html: string, pattern: RegExp): number {
  return (html.match(pattern) ?? []).length;
}

/** Count the visual elements in a body. Cheap string scan — no DOM needed. */
export function measureArticleVisuals(html: string): ArticleVisuals {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ");

  return {
    words: text.split(/\s+/).filter(Boolean).length,
    sections: count(html, /<h2[\s>]/gi),
    // An image, not a `<figure>`: the wrapper and its `<img>` are one visual,
    // and counting both would let a single picture satisfy the minimum.
    figures: count(html, /<img[\s>]/gi),
    tables: count(html, /<table[\s>]/gi),
    metricStrips: count(html, /class="mk-stats"/g),
    barCharts: count(html, /class="mk-bars"/g),
    flows: count(html, /class="mk-flow"/g),
    mockups: count(html, /class="mk-mockup"/g),
  };
}

/**
 * What is missing, in the reader's terms.
 *
 * Ordered most-important first so a truncated toast still says the useful part.
 * An empty array means the body clears every threshold.
 */
export function visualGaps(visuals: ArticleVisuals): string[] {
  const gaps: string[] = [];
  const charts = visuals.tables + visuals.barCharts + visuals.mockups;
  const figures = visuals.metricStrips + visuals.barCharts;

  if (visuals.words < MIN_WORDS) gaps.push(`under ${MIN_WORDS} words`);
  if (visuals.sections < MIN_SECTIONS) gaps.push(`fewer than ${MIN_SECTIONS} sections`);
  if (visuals.figures < MIN_FIGURES) gaps.push(`fewer than ${MIN_FIGURES} images`);
  if (charts === 0) gaps.push("no table, bar chart or mockup");
  if (figures === 0) gaps.push("no metric strip or bar chart");

  return gaps;
}
