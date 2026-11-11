/**
 * Rebuild a stored article body as semantic HTML.
 *
 * Why this exists: blog bodies are generated HTML written against an older
 * design system. A real published post looks like this:
 *
 *   <div class="cv-fade-up">
 *     <div class="cv-grid-2">
 *       <div style="padding:32px">
 *         <div><svg ...star...></div>
 *         <div><div class="cv-counter"></div><span>%</span>
 *              <div>Increase in Lead Conversion</div></div>
 *       </div>
 *     </div>
 *     <svg ...wave shape...>
 *
 * Stripping inline *styling* left all of that on the page as unstyled fragments:
 * an empty box where an animated counter used to be, a lone `%` sign, a wave
 * graphic painted in the old off-white, and list items whose bullets were killed
 * by `style="list-style:none"`. Colour and spacing were never the problem — the
 * markup was.
 *
 * So this does not patch the old markup, it throws the scaffolding away and
 * keeps only what an article actually has: headings, paragraphs, lists, tables,
 * quotes, images and captions. Anything a layout engine needed is unwrapped and
 * its text kept; anything that only existed to be animated, drawn or padded is
 * dropped.
 *
 * Rules of thumb:
 * - A `div`/`section`/`span`/`font` is not content. It is unwrapped; its text
 *   becomes a paragraph if it was inline on its own — except for the four
 *   sanctioned infographic wrappers below, which are the only ones that carry
 *   meaning on their own.
 * - A paragraph with no letters, or a bare label (no terminal punctuation, very
 *   few words) is a leftover card caption and is dropped.
 * - `svg`, `style`, `script`, `iframe`, `form`, `video` and friends never reach
 *   the page.
 * - `class`, `id`, `style`, `align`, `width`, `height` never survive; only
 *   `href`, `src`, `alt`, `open` and the sanctioned class names below are
 *   carried over.
 *
 * Output is intentionally boring, well-formed HTML. The stylesheet in
 * `globals.css` owns everything after that.
 */

const VOID_TAGS = new Set(["br", "hr", "img", "source", "wbr", "col"]);

/** Never rendered. These are drawing, scripting or embedded-UI containers. */
const DROPPED_TAGS = new Set([
  "svg",
  "path",
  "g",
  "circle",
  "rect",
  "polygon",
  "polyline",
  "line",
  "ellipse",
  "defs",
  "use",
  "lineargradient",
  "radialgradient",
  "stop",
  "style",
  "script",
  "link",
  "meta",
  "noscript",
  "template",
  "iframe",
  "object",
  "embed",
  "video",
  "audio",
  "canvas",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "label",
]);

/** Inline elements worth keeping; everything else inline is unwrapped. */
const INLINE_TAGS = new Set([
  "a",
  "strong",
  "b",
  "em",
  "i",
  "cite",
  "code",
  "sup",
  "sub",
  "u",
  "mark",
  "abbr",
  "time",
]);

/** Block elements reproduced as themselves. */
const BLOCK_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "blockquote",
  "figure",
  "figcaption",
  "pre",
  "hr",
  "details",
  "summary",
  "img",
]);

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/**
 * The sanctioned block vocabulary — the only wrappers the renderer keeps.
 *
 * An article that names three numbers in a row reads as a paragraph; the same
 * three numbers read as a dashboard. Almost every post the model writes is
 * about figures, stages or a before/after, and a bare `<p>` cannot say "these
 * are comparison values, scan them". So four shapes are sanctioned:
 *
 *   metric strip   <div class="mk-stats">  of <div class="mk-stat">
 *   bar chart      <div class="mk-bars">   of <div class="mk-bar">
 *   process flow   <div class="mk-flow">   of <div class="mk-step">
 *   screen mockup  <div class="mk-mockup"> of <div class="mk-stat">
 *
 * The class names are matched exactly and an unknown class is still unwrapped,
 * so this is a closed vocabulary, not a utility system that grows by accident.
 * `.mk-article--wide` owns how each one looks (globals.css).
 */
const STATS_CLASS = "mk-stats";
const STAT_CLASS = "mk-stat";
const BARS_CLASS = "mk-bars";
const BAR_CLASS = "mk-bar";
const FLOW_CLASS = "mk-flow";
const STEP_CLASS = "mk-step";
const MOCKUP_CLASS = "mk-mockup";
const MOCKUP_TITLE_CLASS = "mk-mockup-title";

interface Token {
  kind: "open" | "close" | "text";
  name: string;
  attrs: string;
  selfClosed: boolean;
  text: string;
}

interface Node {
  name: string;
  attrs: string;
  children: Node[];
  text: string;
}

const TOKEN = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  TOKEN.lastIndex = 0;

  for (let match = TOKEN.exec(html); match; match = TOKEN.exec(html)) {
    if (match.index > cursor) {
      tokens.push({ kind: "text", name: "", attrs: "", selfClosed: false, text: html.slice(cursor, match.index) });
    }
    cursor = TOKEN.lastIndex;

    // A comment token has no name group; nothing to emit.
    if (match[0].startsWith("<!--")) continue;

    tokens.push({
      kind: match[1] ? "close" : "open",
      name: match[2].toLowerCase(),
      attrs: match[3] ?? "",
      selfClosed: match[4] === "/",
      text: "",
    });
  }

  if (cursor < html.length) {
    tokens.push({ kind: "text", name: "", attrs: "", selfClosed: false, text: html.slice(cursor) });
  }

  return tokens;
}

function parse(tokens: Token[]): Node {
  const root: Node = { name: "#root", attrs: "", children: [], text: "" };
  const stack: Node[] = [root];

  for (const token of tokens) {
    const parent = stack[stack.length - 1];

    if (token.kind === "text") {
      parent.children.push({ name: "#text", attrs: "", children: [], text: token.text });
      continue;
    }

    if (token.kind === "open") {
      const node: Node = { name: token.name, attrs: token.attrs, children: [], text: "" };
      parent.children.push(node);
      if (!VOID_TAGS.has(token.name) && !token.selfClosed) stack.push(node);
      continue;
    }

    // Close: pop back to the matching element. Stray closes are ignored, which
    // is what browsers do too.
    for (let i = stack.length - 1; i > 0; i -= 1) {
      if (stack[i].name === token.name) {
        stack.length = i;
        break;
      }
    }
  }

  return root;
}

const ATTR = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;

function readAttrs(attrs: string): Map<string, string> {
  const out = new Map<string, string>();
  ATTR.lastIndex = 0;
  for (let match = ATTR.exec(attrs); match; match = ATTR.exec(attrs)) {
    out.set(match[1].toLowerCase(), match[3] ?? match[4] ?? match[5] ?? "");
  }
  return out;
}

function escapeText(value: string): string {
  return value.replace(/&(?![a-z#0-9]+;)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The exact `class` value on an element, or an empty string. */
function classNameOf(node: Node): string {
  return (readAttrs(node.attrs).get("class") ?? "").trim();
}

/**
 * One metric: a figure in `<strong>`, its label in everything else.
 *
 * Rendering the figure inside `<strong>` keeps the semantics the design system
 * asks for (`<strong>` is emphasis, never a coloured span) while giving the
 * stylesheet something stable to size. A stat with no figure, or with no label
 * to say what the figure counts, is not a stat and is dropped — an unlabelled
 * number is the old animated-counter bug wearing a new hat.
 */
function renderStat(node: Node): string | null {
  const figure = node.children.find((child) => child.name === "strong");
  if (!figure) return null;

  const value = renderInline(figure.children).trim();
  const label = renderInline(node.children.filter((child) => child !== figure)).trim();
  if (!value || !label) return null;

  return `<div class="${STAT_CLASS}"><strong>${value}</strong><span>${label}</span></div>`;
}

/** Children of a sanctioned wrapper that carry the given class. */
function childrenWithClass(node: Node, className: string): Node[] {
  return node.children.filter((child) => child.name === "div" && classNameOf(child) === className);
}

function renderStats(node: Node): string | null {
  const stats = childrenWithClass(node, STAT_CLASS)
    .map(renderStat)
    .filter((stat): stat is string => Boolean(stat));

  if (stats.length === 0) return null;
  return `<div class="${STATS_CLASS}">${stats.join("")}</div>`;
}

/**
 * The first number in a string, as a magnitude — `$1,200` → 1200, `42 %` → 42.
 *
 * Bars are drawn relative to the largest value in the group, so the model only
 * has to write the real figure; it never invents a bar length. A bar whose
 * figure cannot be read is dropped rather than drawn at an arbitrary width.
 */
function magnitudeOf(text: string): number | null {
  const match = /-?\d[\d,]*(?:\.\d+)?/.exec(text);
  if (!match) return null;
  const value = Number.parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

/**
 * A bar chart, drawn from figures the model actually wrote.
 *
 * `<strong>` holds the value (and stays visible, so the chart is readable
 * without the bar), `<span>` holds the label. The bar width is computed here
 * from the largest figure in the group and emitted as a custom property, so
 * every `style` attribute in the output is generated by this file from a
 * validated number — never copied from model markup.
 */
function renderBars(node: Node): string | null {
  const bars = childrenWithClass(node, BAR_CLASS)
    .map((bar) => {
      const figure = bar.children.find((child) => child.name === "strong");
      if (!figure) return null;
      const value = renderInline(figure.children).trim();
      const label = renderInline(bar.children.filter((child) => child !== figure)).trim();
      const magnitude = magnitudeOf(value);
      if (!value || !label || magnitude === null || magnitude <= 0) return null;
      return { value, label, magnitude };
    })
    .filter((bar): bar is { value: string; label: string; magnitude: number } => Boolean(bar));

  if (bars.length === 0) return null;

  const largest = Math.max(...bars.map((bar) => bar.magnitude));
  const rows = bars.map((bar) => {
    const width = Math.round((bar.magnitude / largest) * 1000) / 10;
    return (
      `<div class="${BAR_CLASS}" style="--mk-width:${width}%">` +
      `<span>${bar.label}</span><strong>${bar.value}</strong></div>`
    );
  });

  return `<div class="${BARS_CLASS}">${rows.join("")}</div>`;
}

/**
 * A numbered sequence. The number is generated by CSS counters, so the model
 * writes the step's name and description and never a "Step 1:" prefix that
 * would double up with the marker.
 */
function renderStep(node: Node): string | null {
  const title = node.children.find((child) => child.name === "strong");
  if (!title) return null;

  const heading = renderInline(title.children).trim();
  const detail = renderInline(node.children.filter((child) => child !== title)).trim();
  if (!heading || !detail) return null;

  return `<div class="${STEP_CLASS}"><strong>${heading}</strong><span>${detail}</span></div>`;
}

function renderFlow(node: Node): string | null {
  const steps = childrenWithClass(node, STEP_CLASS)
    .map(renderStep)
    .filter((step): step is string => Boolean(step));

  if (steps.length === 0) return null;
  return `<div class="${FLOW_CLASS}">${steps.join("")}</div>`;
}

/**
 * A screen mockup — a titled panel of metrics, drawn in CSS.
 *
 * This exists because the posts are about dashboards and there is no
 * screenshot to show. The frame is the design system's card, not a fake
 * photograph: a title, a hairline, and the same `<strong>`/`<span>` pair the
 * metric strip uses, so the same content reads either as a band or as a panel.
 */
function renderMockup(node: Node): string | null {
  const stats = childrenWithClass(node, STAT_CLASS)
    .map(renderStat)
    .filter((stat): stat is string => Boolean(stat));

  if (stats.length === 0) return null;

  const titleNode = node.children.find(
    (child) => child.name !== "#text" && classNameOf(child) === MOCKUP_TITLE_CLASS,
  );
  const title = titleNode ? renderInline(titleNode.children).trim() : "";
  const heading = title ? `<span class="${MOCKUP_TITLE_CLASS}">${title}</span>` : "";

  return `<div class="${MOCKUP_CLASS}">${heading}${stats.join("")}</div>`;
}

const SANCTIONED_RENDERERS: Record<string, (node: Node) => string | null> = {
  [STATS_CLASS]: renderStats,
  [BARS_CLASS]: renderBars,
  [FLOW_CLASS]: renderFlow,
  [MOCKUP_CLASS]: renderMockup,
};

/**
 * Render a `div` that carries a sanctioned class.
 *
 * `undefined` means "not a sanctioned wrapper" — the caller keeps unwrapping it
 * like any other container. `null` means "sanctioned but empty", so it is
 * dropped rather than left as an empty box.
 */
function renderSanctioned(node: Node): string | null | undefined {
  if (node.name !== "div") return undefined;
  const renderer = SANCTIONED_RENDERERS[classNameOf(node)];
  return renderer ? renderer(node) : undefined;
}

/** `javascript:` and friends never survive; relative and http(s) links do. */
function safeUrl(value: string | undefined): string | null {
  if (!value) return null;
  const url = value.trim();
  if (!url) return null;
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("data:image/")) return url;
  return null;
}

function renderInline(nodes: Node[]): string {
  const parts: string[] = [];

  for (const node of nodes) {
    if (node.name === "#text") {
      parts.push(escapeText(node.text));
      continue;
    }
    if (DROPPED_TAGS.has(node.name)) continue;

    if (node.name === "br") {
      parts.push(" ");
      continue;
    }

    if (node.name === "img") {
      const image = renderImage(node);
      if (image) parts.push(image);
      continue;
    }

    if (node.name === "a") {
      const href = safeUrl(readAttrs(node.attrs).get("href"));
      const inner = renderInline(node.children).trim();
      if (!inner) continue;
      parts.push(href ? `<a href="${escapeAttr(href)}">${inner}</a>` : inner);
      continue;
    }

    if (INLINE_TAGS.has(node.name)) {
      const inner = renderInline(node.children);
      if (!inner.trim()) continue;
      parts.push(`<${node.name}>${inner}</${node.name}>`);
      continue;
    }

    // Any other element is a container: keep its text, drop its box.
    const inner = renderInline(node.children);
    if (inner.trim()) parts.push(" " + inner + " ");
  }

  return parts.join("").replace(/[ \t]{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderImage(node: Node): string | null {
  const attrs = readAttrs(node.attrs);
  const src = safeUrl(attrs.get("src"));
  if (!src) return null;
  const alt = (attrs.get("alt") ?? "").trim();
  return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy">`;
}

/** Text with no letters or digits is punctuation, a bullet glyph or a spacer. */
function hasContent(text: string): boolean {
  return /[a-zA-Z0-9\u00C0-\u024F]/.test(text);
}

/**
 * A paragraph is worth keeping when it reads like a sentence or a real sentence
 * fragment. Short, unpunctuated strings are the captions of cards that this
 * template does not render any more, and they read as orphaned labels.
 */
function isMeaningfulParagraph(text: string): boolean {
  const plain = text.replace(/\s+/g, " ").trim();
  if (!hasContent(plain)) return false;
  if (/[.!?:;]$/.test(plain)) return true;
  if (plain.length >= 32) return true;
  return plain.split(" ").filter(Boolean).length >= 5;
}

function renderList(node: Node, ordered: boolean): string | null {
  const items: string[] = [];

  for (const child of node.children) {
    if (child.name !== "li") {
      // A stray paragraph inside a list still belongs to the list.
      const inline = renderInline([child]).trim();
      if (inline && hasContent(inline)) items.push(`<li>${inline}</li>`);
      continue;
    }
    const inline = renderInline(child.children).trim();
    if (inline && hasContent(inline)) items.push(`<li>${inline}</li>`);
  }

  if (items.length === 0) return null;
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.join("")}</${tag}>`;
}

function renderTable(node: Node): string | null {
  const rows: string[] = [];

  const walkRows = (parent: Node) => {
    for (const child of parent.children) {
      if (child.name === "tr") {
        const cells: string[] = [];
        for (const cell of child.children) {
          if (cell.name !== "td" && cell.name !== "th") continue;
          const inline = renderInline(cell.children).trim();
          if (!inline) continue;
          cells.push(`<${cell.name}>${inline}</${cell.name}>`);
        }
        if (cells.length > 0) rows.push(`<tr>${cells.join("")}</tr>`);
        continue;
      }
      if (child.name === "thead" || child.name === "tbody" || child.name === "tfoot") {
        walkRows(child);
      }
    }
  };

  walkRows(node);
  if (rows.length === 0) return null;
  return `<table>${rows.join("")}</table>`;
}

function renderNode(node: Node): string | null {
  const name = node.name;

  if (DROPPED_TAGS.has(name)) return null;

  if (name === "img") return renderImage(node);
  if (name === "hr") return "<hr>";

  if (HEADING_TAGS.has(name)) {
    const inline = renderInline(node.children).trim();
    if (!hasContent(inline)) return null;
    return `<${name}>${inline}</${name}>`;
  }

  if (name === "p") {
    const inline = renderInline(node.children).trim();
    return isMeaningfulParagraph(inline) ? `<p>${inline}</p>` : null;
  }

  if (name === "ul" || name === "ol") return renderList(node, name === "ol");
  if (name === "table") return renderTable(node);

  if (name === "blockquote") {
    const inline = renderInline(node.children).trim();
    return inline ? `<blockquote><p>${inline}</p></blockquote>` : null;
  }

  if (name === "pre") {
    // `<pre><code>` is the usual shape; unwrap the inner element so it is not
    // wrapped a second time.
    const codeNode = node.children.find((child) => child.name === "code");
    const code = renderInline(codeNode ? codeNode.children : node.children);
    return code.trim() ? `<pre><code>${code}</code></pre>` : null;
  }

  if (name === "figure") {
    const image = node.children.map((child) => (child.name === "img" ? renderImage(child) : null)).find(Boolean);
    if (!image) return null;
    const caption = node.children
      .filter((child) => child.name === "figcaption")
      .map((child) => renderInline(child.children).trim())
      .find((text) => text && hasContent(text));
    return caption ? `<figure>${image}<figcaption>${caption}</figcaption></figure>` : `<figure>${image}</figure>`;
  }

  if (name === "details") {
    const summary = node.children.find((child) => child.name === "summary");
    const rest = node.children.filter((child) => child.name !== "summary");
    const question = summary ? renderInline(summary.children).trim() : "";
    const answer = rest
      .map((child) => renderNode(child))
      .filter(Boolean)
      .join("");
    if (!question || !answer) return null;
    return `<details><summary>${question}</summary>${answer}</details>`;
  }

  // li / th / td / tr outside their parent — treat as a paragraph rather than
  // emitting an orphan tag.
  const inline = renderInline([node]).trim();
  return isMeaningfulParagraph(inline) ? `<p>${inline}</p>` : null;
}

interface Blocks {
  blocks: string[];
  /** Inline content collected since the last block boundary. */
  pending: string;
}

function flush(blocks: Blocks): void {
  const text = blocks.pending.trim();
  blocks.pending = "";
  if (isMeaningfulParagraph(text)) blocks.blocks.push(`<p>${text}</p>`);
}

function walk(nodes: Node[], blocks: Blocks): void {
  for (const node of nodes) {
    if (node.name === "#text") {
      blocks.pending += escapeText(node.text);
      continue;
    }
    if (DROPPED_TAGS.has(node.name)) continue;

    const isBlock = BLOCK_TAGS.has(node.name);
    const isInline = INLINE_TAGS.has(node.name) || node.name === "br";

    if (isInline) {
      blocks.pending += renderInline([node]);
      continue;
    }

    if (isBlock) {
      flush(blocks);
      const rendered = renderNode(node);
      if (rendered) blocks.blocks.push(rendered);
      continue;
    }

    // The sanctioned vocabulary keeps its wrapper; every other container loses
    // its own. `undefined` means "not sanctioned", so it falls through below.
    const sanctioned = renderSanctioned(node);
    if (sanctioned !== undefined) {
      flush(blocks);
      if (sanctioned) blocks.blocks.push(sanctioned);
      continue;
    }

    // Container (`div`, `section`, `span`, `font`, …): drop the box, keep what is
    // inside it. Walking the children instead of flattening the whole subtree is
    // what preserves the headings — flattening turned a `<h2>` into plain text
    // inside the surrounding paragraph.
    walk(node.children, blocks);
  }
}

/**
 * Turn a stored body into clean semantic HTML for the article template.
 *
 * Returns the rebuilt body only. Styling is the stylesheet's job; the caller
 * still runs heading anchors on the result.
 */
export function rebuildArticleBody(html: string): string {
  if (!html || !html.trim()) return "";

  const tree = parse(tokenize(html));
  const blocks: Blocks = { blocks: [], pending: "" };

  walk(tree.children, blocks);
  flush(blocks);

  return blocks.blocks.join("");
}

function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/[^a-zA-Z0-9\u00C0-\u024F]+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * How much of the title a leading heading has to repeat to count as a copy of it.
 *
 * Exact matching is not enough: a stored body announces the article as
 * "Boost Growth: Integrate Business Intelligence into Your Daily VA Dashboard"
 * while the post title is stored as "Boost Growth: Integrate BI into Your Daily
 * VA Dashboard". Same sentence, edited. Two thirds of the words in common is far
 * above what a genuine first section shares with a title.
 */
const TITLE_OVERLAP_THRESHOLD = 0.66;

function wordSet(value: string): Set<string> {
  return new Set(value.split(" ").filter(Boolean));
}

/**
 * Drop a leading heading that only repeats the article title.
 *
 * Stored bodies were written as standalone documents, so they open with their
 * own `<h1>` of the title. The template already renders that as the page's only
 * `<h1>`, and a demoted copy becomes a duplicate section with a duplicated
 * contents entry at the top of the rail.
 */
export function stripDuplicateTitle(html: string, title: string): string {
  const match = /^\s*<h([1-6])>([\s\S]*?)<\/h\1>/.exec(html);
  if (!match) return html;

  const heading = plainText(match[2]);
  const wanted = plainText(title);
  if (!heading || !wanted) return html;

  const headingWords = wordSet(heading);
  const titleWords = wordSet(wanted);
  let shared = 0;
  for (const word of titleWords) if (headingWords.has(word)) shared += 1;

  const shorter = Math.min(headingWords.size, titleWords.size);
  if (shorter === 0 || shared / shorter < TITLE_OVERLAP_THRESHOLD) return html;

  return html.slice(match[0].length);
}
