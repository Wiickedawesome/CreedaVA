/**
 * Design + HTML content rules for AI-generated marketing content.
 *
 * Replaces the pre-`--mk-*` guidance that lived in `ai-system-prompt.ts`
 * (`DESIGN_SYSTEM`, `CREATIVE_HTML_FRAMEWORK`, `LANDING_PAGE_RULES`,
 * `BLOG_CONTENT_RULES`). Those blobs described a palette the site no longer
 * uses — teal→navy gradients, a gold accent (#E8A838), `#FF6B35` highlights,
 * cool-grey neutrals and `<style>` blocks full of `@keyframes` — so anything the
 * AI wrote was off-brand before a single word was read.
 *
 * Why a separate module instead of editing in place: those four constants are
 * a single contiguous prompt blob each, and rewriting them in situ meant
 * reproducing ~700 lines. This module is the source of truth; the legacy
 * constants are unused and marked superseded.
 *
 * Two facts drive everything here, both measured against the live site:
 *
 *   1. Generated HTML is injected into `.mk-article` (globals.css). That
 *      stylesheet already styles h2–h4, p, ul, ol, blockquote, table, code,
 *      hr, img and figcaption. So the correct instruction is "write semantic
 *      HTML", not "write inline styles" — inline styles *beat* the stylesheet.
 *   2. Section grounds alternate paper/white because a `bg-mk-white` card on a
 *      white band is invisible. Same reason a legacy `background:#fff` block
 *      disappears: colour decisions belong to the section, not the fragment.
 */

// ─── Design system ──────────────────────────────────

export const DESIGN_SYSTEM_2026 = `CREEDAVA DESIGN SYSTEM (2026) — the only palette and shape language generated content may use.

═══════════════════════════════════
1. COLOUR — \`--mk-*\` CUSTOM PROPERTIES
═══════════════════════════════════

SURFACES (warm neutrals — the site is CREAM, never blue-white):
| Token             | Hex     | Usage                                       |
|-------------------|---------|---------------------------------------------|
| --mk-paper        | #F7F7F2 | Default page ground (the cream)             |
| --mk-paper-deep   | #EDEDE4 | Inset / code ground                         |
| --mk-white        | #FFFFFF | Card + sheet surfaces ON a paper ground     |
| --mk-line         | #E2E2DE | Hairline borders, dividers                  |
| --mk-line-strong  | #CFD0CA | Emphasised rule, idle button border         |

TEXT:
| --mk-ink       | #0B2135 | Headings, strong emphasis — 15.2:1 on paper |
| --mk-ink-soft  | #2C4460 | Body copy — 9.3:1                           |
| --mk-ink-mute  | #566B85 | Captions, labels, meta — 5.1:1              |

BRAND (green is the brand):
| --mk-brand        | #005148 | Primary CTA, links, active state      |
| --mk-brand-bright | #007A6D | Hover for the above                   |
| --mk-brand-deep   | #06211D | Dark green band, footer, closing card |
| --mk-accent       | #3FD9C0 | Accent marks ON brand-deep ONLY       |
| --mk-accent-soft  | #D8F5EF | Icon-chip fill on light surfaces      |

BLUE (deliberate and scarce — 3 of 11 routes):
| --mk-navy        | #002D72 | One deep band per page, at most      |
| --mk-navy-deep   | #001B47 | Darker navy band                     |
| --mk-navy-bright | #2E6FD4 | Bloom tint inside a navy band        |
| --mk-navy-soft   | #E8EFF9 | Navy-tinted chrome surface           |
| --mk-navy-line   | #C6D7EE | Border on navy-soft                  |

SEMANTIC (states only, never decoration):
| --success #24A148 | --warning #F1C21B | --error #DA1E28 |

GRADIENTS: none. The design is flat. Never emit linear-gradient() or
radial-gradient().

BANNED: #FF6B35 (warm orange), #E8A838 (gold), #007A6E/#00685C old teal aliases,
cool greys (#F2F4F8 #DDE1E6 #697077 #1A1A2E), teal→navy gradients, any dark-mode
remap. There is no dark theme on the marketing surface.

═══════════════════════════════════
2. TYPOGRAPHY
═══════════════════════════════════

Display/headings: var(--font-jakarta), applied by .mk-article — never set it.
Body: Roboto, inherited from the page — never set font-family.

| Element | Established by the stylesheet                            |
|---------|----------------------------------------------------------|
| h2      | clamp(1.3rem, 2.2vw, 1.6rem) / 800 / 1.25 / -0.02em      |
| h3      | 1.15rem / 700 / 1.3 / -0.01em                             |
| h4      | 1rem / 700 / 1.35                                         |
| body    | 1.0625rem / 1.75, colour --mk-ink-soft                    |
| caption | 0.85rem, colour --mk-ink-mute                             |
| eyebrow | 0.68rem / 600 / uppercase / tracking 0.2em                |

Do not hardcode font sizes or weights. Emphasis is <strong> and <blockquote>,
never a bigger px number or a coloured span.

═══════════════════════════════════
3. SPACING (4px base grid)
═══════════════════════════════════

1 / 2 / 3 / 4 / 6 / 8 / 12 / 16 / 20 / 24 → 4px … 96px.
Section vertical padding: 64px mobile → 112px desktop. Card padding 24–28px.
Text measure 46–58ch. Max content width 1280px.

═══════════════════════════════════
4. RADIUS & SHADOWS (two and three tokens)
═══════════════════════════════════

RADIUS: --mk-radius 0.875rem (chips, inputs, inline squares);
--mk-radius-lg 1.5rem (cards, sheets, panels); 9999px for pills and buttons.

SHADOWS: --mk-shadow-card (resting card), --mk-shadow-float (elevated/hover),
--mk-shadow-brand (primary green CTA). Never write a raw rgba() shadow.

═══════════════════════════════════
5. COMPONENT PATTERNS
═══════════════════════════════════

BUTTON / CTA
- Fully round (9999px), min-height 48px, icon gap 8px.
- primary: --mk-brand fill, white text, hover --mk-brand-bright
- outline: transparent, 1px --mk-line-strong, --mk-ink text, hover border --mk-brand
- light: --mk-paper fill, --mk-brand-deep text — ONLY on a green panel
- quiet: --mk-brand text, no fill, no border
- One primary action per band. Never two green buttons side by side.

CARD
- Surface --mk-white, and only ON a --mk-paper ground. A white card on a white
  band is invisible; that is why section tones alternate (see §7).
- 1px solid --mk-line, radius --mk-radius-lg, padding 24–28px.
- No shadow at rest; --mk-shadow-card on hover with translateY(-2px).
- Never invert to a coloured fill on hover.

PANEL (dark band or closing block)
- --mk-brand-deep ground, --mk-paper text, numerals --mk-accent.
- At most two blurred blooms (/18 and /25 alpha). Nothing else decorative.

STAT BLOCK
- Value clamp(1.9rem, 4vw, 2.6rem) / 800 / tabular-nums, --mk-accent on dark,
  --mk-brand on light.
- Label 0.78rem, --mk-ink-mute (or --mk-paper/60 on dark).
- Separator is a 1px top border, never a filled card.

ICONS
- Inline SVG only, 20×20 default, stroke="currentColor" stroke-width 1.6–2.
- fill="none" for outline icons. Colour is inherited, never hardcoded.

═══════════════════════════════════
6. ADMIN SURFACE IS A DIFFERENT SYSTEM
═══════════════════════════════════

The dashboard still uses --primary / --gray-* tokens. That dual token set is
intentional and must NOT be migrated, copied, or referenced from generated
marketing content. If you are writing for /admin, follow the existing admin
tokens; if you are writing anything a visitor can see, follow §1–§5.

═══════════════════════════════════
7. SECTION RHYTHM
═══════════════════════════════════

- Ground is CREAM (--mk-paper). White is a card/sheet surface, never the page.
- Tones alternate paper → navy/white → paper. Two identical tones never touch.
- No wave dividers, no gradients, no photo overlays, no decorative SVG blobs.
  Depth = one hairline + one shadow + whitespace.
- No motion. No <style> tags, no @keyframes, no hover choreography.
- Blue appears on at most one band per page, only when content calls for it.
- Photos: approved images.unsplash.com URLs with ?w=800&q=80, inside a
  rounded overflow-hidden wrapper. Alt text REQUIRED.`;

// ─── HTML content rules ─────────────────────────────

export const HTML_CONTENT_RULES_2026 = `HTML CONTENT RULES — how generated markup must be written.

WHERE IT RENDERS
Generated HTML is injected with dangerouslySetInnerHTML into a container styled
by the \`.mk-article\` block in app/globals.css. That stylesheet already covers
h2–h4, p, ul, ol, li, blockquote, table, th/td, code, pre, hr, img, figure and
figcaption for this brand. It is not the Tailwind-typography "prose" system.

THE FIVE RULES
1. Write SEMANTIC HTML ONLY — h2, h3, h4, p, ul, ol, li, blockquote, figure,
   figcaption, table, strong, em, a, details, summary, hr, code, pre.
2. NEVER emit a <style> tag. Stored <style> blocks are global once injected and
   leak the old palette onto every page.
3. NEVER use style="" for colour, background, font, border, border-radius,
   box-shadow or line-height. Those are exactly the declarations that fight the
   stylesheet. Inline styles are acceptable for LAYOUT only: display, grid,
   flex, gap, width, height, aspect-ratio, margin, padding, text-align,
   position, overflow.
4. Do not invent class names. The container does the styling; the only class
   values that survive are the eight listed in BLOG BODY RULES (\`mk-stats\`,
   \`mk-stat\`, \`mk-bars\`, \`mk-bar\`, \`mk-flow\`, \`mk-step\`, \`mk-mockup\`,
   \`mk-mockup-title\`). Any other class is stripped with its wrapper.
5. No animation of any kind.

RICH CONTENT FROM ELEMENTS, NOT STYLES
- Lead paragraph      → <p><strong>…</strong></p>
- Benefit list        → <ul> with parallel phrasing, no icons
- Comparison          → <table> with <thead>/<tbody>; hairlines are automatic
- Callout / takeaway  → <blockquote> (green rule, larger text)
- Ordered sequence    → <ol>, or <div class="mk-flow"> for a labelled process
- Figures compared    → <div class="mk-bars"> — real values, drawn by CSS
- Dashboard / screen  → <div class="mk-mockup"> — a titled panel of figures
- Two to four numbers → <div class="mk-stats">
- Chart or diagram    → an approved image inside <figure>
- FAQ                 → <details><summary>Question</summary><p>Answer</p></details>
- Topic break         → <hr>
- Emphasis            → <strong>, never a coloured span

LENGTH AND SHAPE
- Blog post 700–900 words; landing body 400–600. (Blog posts: see
  BLOG BODY RULES — the article body has its own, longer target.)
- One <h2> every 150–250 words. Never open with <h1> — the page owns the H1.
- Nothing deeper than <h4>.
- End with a CTA paragraph containing ONE link to /contact or /join.

CLAIMS THAT ARE BANNED CONTENT, NOT JUST STYLE
- Unsubstantiated numbers: "500+ clients", "hundreds of businesses",
  "98% satisfaction", "47 businesses this month". The CRM holds 0 active
  clients. Only figures this site can prove: one flat monthly fee, 3 packages,
  English/Spanish, 5–7 day onboarding.
- Guarantees that do not exist in the contract: "money-back", "risk-free",
  "free trial", "100% Satisfaction Guarantee", refund windows.
- Pricing: never publish a rate or "starting at $X". Packages are quoted.
- No fake urgency ("3 spots remaining").`;

// ─── Landing page body ──────────────────────────────

export const LANDING_PAGE_RULES_2026 = `LANDING PAGE BODY RULES.

CONTEXT: the route already renders a hero (headline + subheadline + form) ABOVE
your bodyHtml, and a green closing CTA panel with a form BELOW it. Your bodyHtml
is the argument in between — it is a page fragment, not a page.

STRUCTURE (in this order, all optional except the first and last)
1. An opening <p><strong>claim</strong></p> that continues the hero's promise.
2. <h2>Benefits</h2> + a <ul> of 3–5 parallel outcomes.
3. <h2>How it works</h2> + an <ol> of exactly 3 steps, one sentence each.
   Do NOT rebuild this as cards with number circles — /contact owns that visual.
4. A <blockquote> with the single most important takeaway.
5. <h2>What we handle</h2> + a <ul>, or a <table> if the content is comparative.
6. <h2>FAQ</h2> + 2–3 <details>/<summary> pairs.
7. Closing <p> with one link to /contact or /join.

HARD LIMITS
- No <style> tag, no gradient, no wave divider, no decorative SVG, no
  @keyframes, no cv-* classes, no Unsplash hero (the route has its own).
- No second <h1>: the route renders the headline as the only H1.
- No testimonial cards and no stat banners — there are no verified quotes or
  substantiated metrics to fill them, and inventing them is an advertising-claims
  exposure. If real data exists, the admin passes it in the data context and you
  may quote it verbatim with attribution.
- Never restate the hero headline as an <h2>; it is already on screen.

WHY THIS IS SHORTER THAN IT USED TO BE
The old rules asked for gradient stat banners, flip cards, animated counters,
wave dividers and a guarantee block. None of those fit the current design, and
several of them required claims the business cannot support. A calm, well-set
argument converts better than decoration, and it is the only version the
stylesheet can render correctly.`;

// ─── Blog body ──────────────────────────────────────

export const BLOG_BODY_RULES_2026 = `BLOG BODY RULES.

The article route renders the title as the only <h1>, the excerpt as the lede,
and your HTML between the cover image and the sources list. You are writing the
body of a real article, not a teaser: a post that can be summarised in four
lines has nothing to index, nothing to cite and nothing to read.

SHAPE
- 1,200–1,600 words. This is a floor, not a ceiling to pad toward — reach it by
  saying more, never by repeating the same point in a new wrapper.
- 6–9 <h2> sections, each phrased as a claim or a question a reader would
  actually search for. One <h2> every 150–250 words.
- Use <h3> for the sub-points inside a section: the decision, the trade-off, the
  sequence.
- Open with one <p> that states the problem in the reader's words. No "In
  today's fast-paced business environment".
- End with a <p> containing one link to /contact or /join.

WHAT MAKES IT WORTH READING
- Concrete, checkable specifics: a named task, a sequence of steps, a
  before/after pair, a trade-off, the thing that usually goes wrong.
- Tables for anything comparative — pricing tiers, DIY vs in-house vs CreedaVA,
  tool categories. <table> already renders with hairlines.
- <blockquote> for the one idea worth pulling out.
- <ul> for parallel items; <ol> when order matters.
- <details>/<summary> for FAQ blocks.
- A worked example with real numbers that come from the reader's own inputs or
  from a cited source, never invented ones.

VISUALS — PROSE ALONE IS AN UNFINISHED ARTICLE
An article that is 1,500 words of paragraphs is a page nobody scrolls. Every
post is built from paragraphs, images, figures, tables and infographic blocks —
paragraphs are the floor, not the default. Aim for one visual in every section.

1. IMAGE — 3 to 5 per article, one every two or three sections.
   <figure>
     <img src="APPROVED_URL" alt="what the picture shows">
     <figcaption>Why this picture is here, in one sentence.</figcaption>
   </figure>
   - Only URLs from the approved thumbnail list you were given. Never invent a
     photo id and never use another host.
   - The alt text describes the picture; the caption earns it — "The booking
     funnel, read top to bottom" is a caption, "Dashboard image" is not.
   - Never place two figures back to back, and never open the body with one.

2. METRIC STRIP — when a section turns on two to four figures, show them.
   <div class="mk-stats">
     <div class="mk-stat"><strong>15</strong><span>minutes a day to read it</span></div>
     <div class="mk-stat"><strong>7</strong><span>days to a usable first version</span></div>
   </div>

3. BAR CHART — when three or more figures are compared against each other.
   <div class="mk-bars">
     <div class="mk-bar"><span>Referral</span><strong>78%</strong></div>
     <div class="mk-bar"><span>Paid social</span><strong>42%</strong></div>
   </div>
   - Write the REAL figure in <strong>; the renderer computes each bar's length
     from the largest value in the group. Never write a percentage that is
     only there to make a bar look right.
   - <span> is the row label, <strong> the value. Nothing else is read.

4. PROCESS FLOW — when the section is a sequence the reader will follow.
   <div class="mk-flow">
     <div class="mk-step"><strong>Define the three questions</strong><span>One sentence on what happens.</span></div>
     <div class="mk-step"><strong>Connect the sources</strong><span>…</span></div>
   </div>
   - The step number is drawn by the stylesheet. Never write "Step 1" yourself.

5. SCREEN MOCKUP — when the section describes a dashboard, a screen or a panel.
   <div class="mk-mockup">
     <div class="mk-mockup-title">Bookings · today</div>
     <div class="mk-stat"><strong>12</strong><span>confirmed</span></div>
     <div class="mk-stat"><strong>3</strong><span>awaiting reply</span></div>
   </div>
   - This is the honest stand-in for a product screenshot: a real frame around
     the reader's own numbers. Never describe it as a screenshot of our product
     and never fill it with figures we did not measure.

6. TABLE — anything comparative, and most things measurable.
   A metric section reads better as a table than as ten paragraphs:
   | Metric | What it tells you | Act when… |
   Three columns is the ceiling; a table wider than that wraps badly on a phone.

7. PULL QUOTE — one per article, via <blockquote>, for the sentence you want
   the reader to remember if they read nothing else.

THE ONLY CLASS NAMES THAT SURVIVE
\`mk-stats\`, \`mk-stat\`, \`mk-bars\`, \`mk-bar\`, \`mk-flow\`, \`mk-step\`,
\`mk-mockup\`, \`mk-mockup-title\`. They are matched exactly. Any other class, any
other wrapper, every inline style and every SVG is deleted by the renderer — so
writing them wastes the output. There is no chart library and no way to draw a
custom shape: if the point cannot be made with a figure, a bar, a flow, a
mockup, a table or an image, make it in prose.

WHAT MAKES A VISUAL HONEST
- A number in a strip, bar, mockup or table is a claim like any other. It is
  either sourced, or explicitly framed as a target the reader sets for
  themselves ("a planning target, not a benchmark"), or it does not go in.
- Never invent a chart, a screenshot, a client logo or a testimonial to make a
  section look richer. There are no verified client quotes: do not write one.
- Never restate a paragraph as a table, or a table as three bullet points. The
  visual replaces prose; it does not duplicate it.

SOURCES — THIS IS NOT OPTIONAL
- Every factual claim that is not common knowledge carries a numbered marker in
  the text, written as a link: <a href="#source-1">[1]</a>.
- Numbers, percentages, market sizes, adoption rates, salary figures, legal
  requirements: all of them need a source or they do not go in.
- Return the matching entries in the \`references\` array, in the order the
  markers first appear:
    "references": [
      { "label": "Title of the page or report", "url": "https://…", "source": "Publisher", "year": "2025" }
    ]
- Use sources you were actually given — web search results, the data context —
  or well-known primary sources (a government statistics office, the OECD, the
  World Bank, a named company's own published documentation). Prefer the
  publisher's own page over a blog summarising it, and prefer anything from the
  last two years.
- If a claim cannot be sourced, cut the claim. Do not hedge it into vagueness
  and do not attach a plausible-looking URL. A shorter article with five real
  sources is better than a longer one with invented credibility.
- Never cite CreedaVA's own CRM, analytics or clients — that data is private to
  the admin and must not appear on a public page.

WHAT IS BANNED
- A <style> tag or any inline colour/typography style (see HTML CONTENT RULES).
- <h1> in the body — it produces a second page title.
- Any wrapper or class name outside \`mk-stats\` / \`mk-stat\`.
- Invented statistics, client counts, review scores, awards, "studies show",
  testimonial quotes attributed to a person, and numbers placed in a metric
  strip or table without a source or a stated "this is a target".
- Invented or unverifiable URLs, and citations that do not match the claim.
- Invented guarantees, refund windows or trial periods.
- Prices and "starting at $X". Packages are quoted per client.
- Emoji as section markers.`;

// ─── Exports as one bundle ──────────────────────────

/** Everything a content-generating call needs, in prompt order. */
export const DESIGN_MODULES_2026 = {
  designSystem: DESIGN_SYSTEM_2026,
  htmlRules: HTML_CONTENT_RULES_2026,
  landingRules: LANDING_PAGE_RULES_2026,
  blogRules: BLOG_BODY_RULES_2026,
} as const;
