# Marketing redesign — homepage (phase 1)

Branch: `redesign/modern-2026`
Date: 2026-11-02
Status: **DONE (homepage)** / **NOT STARTED (other marketing pages)**

## Decisions locked with the owner

| Question | Choice |
|---|---|
| Palette | A — Deep Teal + Bone |
| Typography | Plus Jakarta Sans headings + Roboto body |
| Imagery | No people — UI-artifact compositions only |
| First pass | Full homepage in one pass, then adjust |

## What changed

- Homepage went from **5 sections to 10**, with real product artifacts instead of a
  logo-only hero.
- New marketing token set (`--mk-*`) in `app/globals.css`, mapped to Tailwind via
  `@theme inline`. **`--primary` and `--gray-*` are untouched**, so `/admin` is
  unaffected.
- `Plus Jakarta Sans` added as `--font-display` in `app/layout.tsx`. Admin pages
  never use `font-display`, so they do not download it.
- FAQPage JSON-LD now emitted on `/` — the visible FAQ section is the required
  backing content for that markup.

### Tokens

| Token | Value | Note |
|---|---|---|
| `--mk-paper` | `#F7F7F2` | warm page base |
| `--mk-ink` | `#0B2135` | navy-black headings (15.2:1 on paper) |
| `--mk-ink-soft` | `#2C4460` | body copy (9.3:1 on paper) |
| `--mk-ink-mute` | `#566B85` | captions (5.1:1 on paper) |
| `--mk-brand` | `#005148` | existing brand teal — human + action |
| `--mk-brand-deep` | `#06211D` | dark bands |
| `--mk-accent` | `#3FD9C0` | 9.6:1 on the dark band |
| `--mk-navy` | `#002D72` | brand blue — the software layer (12.1:1 on paper) |
| `--mk-navy-deep` | `#001B47` | navy text on navy tint (14.5:1) |
| `--mk-navy-soft` | `#E8EFF9` | tint surface for navy chrome |
| `--mk-navy-line` | `#C6D7EE` | navy tint border |

### Colour roles — green vs navy

The brand has always been teal **and** blue. Green was carrying three jobs at
once (ink, fill, accent), which squeezed blue out entirely and made the whole
page read green. The fix is to give each colour a distinct job rather than
adding blue on top:

| Layer | Colour | Where |
|---|---|---|
| **Human + action** | green | avatars, CTAs, checkmarks, brand surfaces, presence/status pills, dark bands |
| **Software + data** | navy | window URL chrome, inbox icon, metric icon, calendar day + booked chip |
| **Ink** | navy-black | every heading and body line (`--mk-ink*`) |

**The anti-clash rule:** navy and green must never appear as two large fills
side by side. Navy stays on ink, small chrome and tints; green keeps the fills.
The dark bands stayed green for exactly this reason.

Presence indicators (`Disponible` / `En línea`) are green in both the hero
mockup and the chat panel — a green "online" dot is a universal convention, and
splitting it across two colours read as two different states.

### Section order

1. Hero — copy + layered work-queue / inbox / calendar artifacts
2. Sector strip
3. Counter band (dark) — the four verifiable figures
4. Service grid — **4 featured services** (one per family), not the full catalogue
5. Comparison — DIY vs in-house vs CreedaVA
6. Day in the life (dark) — timeline artifact
7. How it works — 3 steps
8. Real people — chat artifact
9. Hand-off picker — client-side task selector, local state only
10. FAQ + closing CTA

## Copy rules

Learned the hard way during this redesign — apply to every section:

- **Never describe the layout to the visitor.** Copy like "six of the twelve
  things we handle, two that nearly every business needs and four where our
  specialists go deepest" is design rationale, not customer copy. It reads as a
  note to the owner. Write what the work is and what it does for them.
- **Don't count your own cards** ("twelve kinds of work", "four services"). The
  visitor is scanning for their problem, not auditing the grid.
- **No negative framing.** "Before you need a team" implies they lack one. Say
  "support and a team you can afford."
- **State constraints honestly** (hours are set by the plan, not adjustable within
  it). Vagueness here becomes a billing dispute.

## Naming hierarchy

Three names, three jobs. Never mix them up:

| Form | Where | Why |
| --- | --- | --- |
| **CreedaVA** | Logo, `alt` text, `<title>` suffix, `og:site_name`, keywords, legal pages, `@creedava.com` addresses, domain chrome | Brand mark only. Never the subject of a sentence in marketing copy. |
| **Creeda Virtual Assistants** | First mention on any page (hero description, About opening line, footer copyright, JSON-LD `name`) | The full name — tells a first-time visitor what the company is. |
| **Creeda** | Every mention after the first (headings, FAQ questions, CTAs, comparison labels) | The short name people will actually say out loud. |

The point of the pattern is that "Creeda" can be introduced on its own without a
visitor wondering whether it is a different company — the full name appears once,
first, and explains it.

## Files

- `components/marketing/primitives.tsx` — `Section`, `Eyebrow`, `SectionHeading`, `CtaLink`, `Pill`
- `components/marketing/mockups.tsx` — window frame, work queue, inbox, calendar, chat, timeline
- `components/marketing/home/*.tsx` — one file per band
- `lib/constants/service-glyphs.tsx` — glyphs keyed by `SERVICE_ANCHORS`
- `app/(marketing)/home-content.tsx` — composition only
- `app/(marketing)/about/about-content.tsx` — About page, its own editorial vocabulary
- `app/(marketing)/contact/page.tsx` — Server Component; `contact-content.tsx`
  (server, intake-sheet vocabulary) + `contact-form.tsx` (the only client JS)
- `app/(marketing)/join/page.tsx` — Server Component; `join-content.tsx`
  (client, appointment-ledger vocabulary — the only JS on the route)
- `app/(marketing)/services/services-content.tsx` — Server Component; rule-based
  directory for the twelve anchors, everything else built from `primitives` so it
  matches Home
- `app/(marketing)/pricing/page.tsx` — Server Component; `pricing-content.tsx`
  (server). Plans, "every plan includes", terms. Packages data still lives under
  `t.services.packages` — only the page moved
- `components/ui/world-map.tsx` — marketing map; `world-map-land.ts` is GENERATED
  by `scripts/build-world-map-paths.mjs`
- `lib/i18n/en.ts` / `es.ts` — new `home.*` copy, old unused keys removed

## Revision log

### 2026-11-03 — full-surface audit (final pass before sign-off)

Owner: *"align everything… audit all pages and look for any errors, bugs, alignment issues,
junk… final complete audit before we finish."* Audited by measurement, not by eye. Everything
below was found by script, fixed, then re-measured.

**1. Heading hierarchy was broken on 10 of 12 pages.**
- The footer labelled its three link columns with `<h4>`, so every page that ended its
  content on an `h2` skipped two levels (`h2 → h4`). Now `<h2>`: a footer column heading can
  never skip, whatever level the page ends on.
- `/services` jumped `h1 → h3`: the industry cards under the `level={1}` heading were `<h3>`.
  Now `<h2>`.
- `/forum` had **two `h1`s** — an `sr-only` "CreedaVA Community Forum" plus a visible
  "Forum". Kept the descriptive `sr-only` h1 and demoted the visible bar heading to `<h2>`,
  so the page keeps its keyword-rich level-1 heading without the duplicate.
- Result: **all 12 routes have exactly one `h1` and zero skipped levels.**

**2. `/join` calendar: disabled dates were 1.77:1.** `text-mk-ink-mute/40` on white. The day
numbers were effectively unreadable, so a visitor could not tell an unavailable day from a
blank cell. Now full `text-mk-ink-mute` (**5.53:1**); the muted colour, missing availability
dot and `cursor-default` already carry the "disabled" meaning.

**3. The legacy `Button`/`Input` primitives were leaking onto public pages.** This is the
"two kinds of buttons" problem again, in places the earlier sweep missed because they import
through the barrel (`@/components/ui`), not the file path:
- `lp/[slug]/lp-contact-form.tsx` → `Button` (painted `rounded-md` in `--primary`)
- `forum/forum-list.tsx` → `Button` **and** `Input` (`Input` renders `bg-card` / `border-gray-40`
  / `text-gray-100`, i.e. dark-theme admin chrome on a light public page)

Added **`Button` to `components/marketing/primitives.tsx`**, sharing `CtaLink`'s
`CTA_CLASSES` so a form submit and a nav link cannot drift apart again. Both files migrated.

**4. The forum was importing `Modal` from `@/components/admin`.** A public page rendering a
modal with `bg-card`, `text-gray-90`, `border-border` and `rounded-xl`. Created
`components/marketing/modal.tsx` — same behaviour (portal, Escape, focus trap, scroll lock)
on `--mk-*` tokens — and pointed the forum at it.

**5. `AboutButton` was a duplicate of `CtaLink`** with `rounded-lg` instead of `rounded-full`
and its own variant map. Its three variants (`primary`/`light`/`quiet`) map 1:1 onto
`CtaLink`. Deleted the local component; `/about` now uses the shared pill. **This changes
About's buttons from 8px-squared to pill** — the previous docblock called the squared shape
"deliberate", so if that look was wanted it needs restoring site-wide, not just on `/about`.

**6. Landing pages were still on the old design system** — and publicly listed in `sitemap.ts`.
`lp/[slug]/lp-content.tsx` used `text-4xl lg:text-5xl font-bold` (not `font-display`, not the
clamp scale), `rounded-3xl`/`2xl`/`xl`, and **`prose` classes, which emit no CSS because
`@tailwindcss/typography` is not installed** — the article body rendered as raw unstyled HTML.
Rebuilt on `Section` + `mk-article` (the fix already proven on the news article) with the
standard closing-CTA panel.

**7. The LP success card was invisible on the hero.** It used `bg-mk-white/10` + `text-white`,
but the same form renders in the light hero as well as the dark CTA panel — so after
submitting from the hero the confirmation was white-on-white. Now a solid `bg-mk-white` card
with `text-mk-ink`, which reads on both surfaces.

**8. Radii and button shapes normalised.** `rounded-lg`/`xl`/`2xl`/`3xl` replaced with
`rounded-(--mk-radius)` / `rounded-(--mk-radius-lg)` on: the About CTA panel, the contact navy
inset, `/error`'s `<pre>`, the LP skeleton, the LP form fields, the forum create-post form and
the public satisfaction survey. Submit buttons on `/contact` and the survey moved from
`rounded-lg` to `rounded-full` to match every other CTA. **Deliberately left:** the
`rounded-lg rounded-tl-sm` chat bubbles inside `service-mockups.tsx` and `mockups.tsx` — that
asymmetry *is* the chat-bubble shape, not a stray radius.

**9. Forum auth modal had no dialog semantics.** Added `role="dialog"`, `aria-modal`,
`aria-labelledby` and a labelled close button.

**10. Contact navy inset was the last flat navy surface.** Given the same two blue blooms as
the About band and the footer.

**Checked and found clean (so nobody re-does this):**
- **0** legacy `gray-*`/`primary`/`border-border` tokens on the marketing surface.
- **0** admin components imported by marketing (after fix 4).
- **0** orphaned components — all 17 marketing components have importers; `mockups.tsx` and
  `service-mockups.tsx` are different things (product artifacts vs service illustrations).
- **0** unused design tokens — every `--color-mk-*` has utility-class consumers.
- **0** adjacent dark bands on any page; the block above the footer is light everywhere.
- Raw `text-red-*`/`text-green-*` are semantic (errors, liked) and intentionally not tokenised.

**Measured after all fixes — 14 routes × 3 widths (1440 / 375 / 1920):**
- **0 contrast failures** across 793 text nodes per width (oklab resolved via canvas, alpha
  composited properly — the earlier 1.25:1 "failures" were the parser, not the page).
- **0** routes with wrong `h1` count or skipped heading level.
- **0px** horizontal overflow anywhere.
- **0** JS page errors; 404 route still 404s.
- `tsc` clean · lint **0 errors** · **381/381** tests · build OK.

**Could not verify visually:** the forum *create-post* modal (reached only after sign-in) and
any `/lp/<slug>` page (no landing-page documents exist locally, so every slug 404s). Both are
covered by typecheck and token grep and are stated as unverified rather than claimed green.

### 2026-11-03 — navy surfaces now lit the same way as the green ones

**Owner:** *"See how the green card on home are gradient and look? thats how the cards for
about and the footer should look. but blue. i dont think you get what im trying to do."*

- **What I had been doing wrong.** I built the footer a bespoke `radial-gradient` stack and
  kept tuning stop positions. The site already had a house style and I was not using it:
  **every green band is lit by blurred tint circles**, not by gradients —

  | Where | Blooms |
  |---|---|
  | `home/hero` | `bg-mk-accent/30` + `bg-mk-brand/10`, `blur-[110px]` |
  | `home/process` | `bg-mk-accent/8`, `blur-[110px]` |
  | `home/proof` | `bg-mk-accent/10`, `blur-[100px]` |
  | `home/closing` | `bg-mk-accent/18` + `bg-mk-brand-bright/25` |
  | `pricing` ×4, `services` ×2, `news` ×1 | same pattern |

  The about navy band had **none** — `bg-mk-navy-deep` and nothing else. That is why it read
  as a slab next to the green bands.
- **New shared `Bloom` component** in `components/marketing/primitives.tsx` — owns
  `absolute` + `pointer-events-none` + `aria-hidden`; the call site supplies size, corner,
  tint and blur, because those legitimately differ per band. **All 17 blooms now go through
  it**, including the 15 that were inline `div`s. One mechanism, not two.
- **New token `--mk-navy-bright: #2E6FD4`.** `--mk-navy` `#002D72` sits too close to
  `--mk-navy-deep` `#001B47` to read as light, so it cannot serve as a bloom tint the way
  `--mk-accent` serves the green bands.
- **Blue blooms added to** the about Mission/Vision band (`/25` top-right, `/15`
  bottom-left, both `blur-[110px]`) and the footer, which is now plain `bg-mk-navy-deep` +
  the same two blooms. **`--mk-footer-surface` and `--mk-footer-base` deleted** — dead
  tokens, and the footer should not have its own private painting method.
- **Contrast:** the scan flagged `Our Mission` / `Our Vision` as 1.25:1, but that is a
  **scanner artifact** — the colour is `oklab(… / 0.7)` and the parser read oklab channels
  as RGB. The real composited values are `text-mk-paper/70` **8.13:1** on navy-deep and
  **6.56:1** on the brightest bloom, `--mk-paper/60` **6.27 / 5.23:1**. All pass.
- **Verified:** 11 routes × 2 breakpoints — all 200, **0px overflow**. Bloom counts per page
  at 1440: `/` 8 · `/about` 4 · `/services` 4 · `/pricing` 6 · `/news` · `/contact` ·
  `/join` · `/faq` · `/privacy` · `/terms` · `/forum` 2 each. Heights unchanged where the
  green bands were only refactored (`/services` 9325, `/pricing` 4421). tsc clean, lint 0
  errors, **381/381** tests, build OK.
- **Still flat navy:** `contact-content.tsx:152` — `rounded-lg bg-mk-navy-deep px-6 py-7`,
  no blooms (and it uses the legacy `rounded-lg` rather than `--mk-radius`). Not changed:
  it is a card, not a band, and was not part of the ask.

### 2026-11-03 — footer surface: navy field, green from the four corners

**Owner feedback:** *"the footer color… clashes with our green too much… i feel like the
footer is bold and good but not enough green is used… boom you see the blue and its a throw
off"*, then, after a first attempt: *"it should be primarily blue then maybe green coming in
from all corners its mostly green right now we want the blue mostly."*

- **Reverses the earlier "gradient rejected" decision** recorded further down. That
  rejection was specific to a **linear `green → navy` ramp**, which passes through petrol
  (~`#003648` at the 50% stop) and puts green in charge of the first 40% of the field.
  Neutralising both faults gives a different construction: **navy base, green only as
  corner glows.** The earlier note is not contradicted — it is superseded by a shape it
  did not consider.
- **Implementation:** `--mk-footer-surface` is four `radial-gradient(ellipse 70% 70% …)`
  layers at the four corners over `background-color: var(--mk-navy-deep)`. Top corners use
  `--mk-brand-bright` at 0.45–0.55 alpha; bottom corners use the darker `--mk-brand` at
  0.55–0.62, because the bottom bar's `text-mk-paper-mute` sits there. Every fade ends in
  `rgba(same-colour, 0)` — **never** the `transparent` keyword, which would let the blend
  drift toward grey.
- **⚠️ Bug found and fixed while verifying:** the token initially ended with
  `var(--mk-navy-deep)` as a fifth layer. A bare colour is not a valid `<image>` in
  `background-image`, so the **entire declaration was invalid and the footer painted
  white.** Navy must be `background-color` on the element, and the token must contain
  gradients only. Caught because the footer was pixel-sampled rather than eyeballed.
- **Measured on real rendered pixels** (1440, footer element screenshot decoded to canvas,
  glyph pixels excluded): **88.8% blue / 10.5% green**, average `#02264a`. Analytic model
  of the same stops agrees: **88.2% / 11.8%**, centre pixel exactly `rgb(0,27,71)`
  (`--mk-navy-deep`), corners `rgb(0,79,92)` → `rgb(0,57,72)`.
- **Contrast across the whole surface, worst case anywhere:** `--mk-paper` **8.60:1**,
  `--mk-paper-mute` **6.30:1**, `--mk-accent` **5.23:1** — all pass (4.5 / 4.5 / 3).
- **Seam checked on every page.** The block immediately above the footer is light
  everywhere — `--mk-paper` `rgb(247,247,242)` on `/`, `/about`, `/services`, `/pricing`,
  `/faq`, `/contact`; white on `/news`, `/join`, `/privacy`. The rule "never place two dark
  bands edge to edge" therefore still holds after the change.
- **Verified:** 0px overflow at 1440 and 375 · tsc clean · lint 0 errors · **381/381** tests
  · build OK.

**Tuned 2026-11-03** — *"tune it up a bit so you can see darker spots and nice and clean."*
The first cut was one flat navy wash with hazy corner blooms. Four variants were modelled
and rendered before picking:

| Variant | Tonal range | Verdict |
|---|---|---|
| A — 58% blooms + two offset dark pools | 0.0684 | visible smudge across the top |
| B — 55% blooms + single vignette | 0.0679 | clean but shallow |
| C — 55% blooms + top shade band | 0.0580 | flattest; band reads as a stripe |
| **D — 48% blooms + centred pocket + `#00112F` base** | **0.0720** | **chosen** |

- Corner radii tightened 58%→**48%** so the glow reads crisp instead of hazy, and the base
  dropped from `--mk-navy-deep` `#001B47` to **`#00112F`** so the centred pocket has
  somewhere darker to fall to. Two offset pools were **rejected on sight** — they left a
  visible stain rather than shading.
- Base moved to its own token `--mk-footer-base` (the gradient stack cannot carry a bare
  colour; see the white-footer bug above).
- **Measured on the pure surface** (footer children hidden, 64,800 samples): **90.9% blue /
  9.1% green**, luminance **0.0034 → 0.0739** (range **0.0706**, up from 0.0684), darkest
  `rgb(0,11,31)`, lightest `rgb(0,86,90)`. Worst-case contrast: `--mk-paper` **7.88:1**,
  `--mk-paper-mute` **5.78:1**, `--mk-accent` **4.80:1** — all pass.
- Re-swept 12 marketing routes at 1440 and 375: all 200, 0px overflow, 5 gradient layers
  present. `/login` has no footer by design — it sits outside the `(marketing)` layout.

**Re-shaped 2026-11-03 — corners → sides.** *"still seem weird i think its the literal 4
corners you did. let gradient come from both left and right side lightly completely instead
of top and bottom."*

- The four corner blooms read as **four separate spots**, not as shading. Two tall side
  washes instead give one continuous **left-light → dark centre → right-light** sweep.
- Geometry: `ellipse 36% 130% at 0% 50%` and the mirror at `100% 50%`. The **130% height**
  is the point — it runs the full height of the band instead of pooling at top and bottom.
  A centred `rgba(0,7,19,0.42)` shade keeps the middle navy so the two washes cannot meet
  and go muddy where they overlap.
- **Alpha had to drop from 0.55 to 0.38 to keep blue in charge.** Measured by hue at four
  strengths:

  | Side alpha | Green | Blue |
  |---|---|---|
  | 0.62 | 55.6% | 44.4% |
  | 0.55 | 56.2% | 43.8% |
  | 0.44 | 41.9% | 58.1% |
  | **0.38** | **30.2%** | **69.8%** |

- **Measured on the visible band** (header removed — the sticky navbar was being painted
  over the footer in the first mobile capture and produced a phantom white `rgb(223,228,224)`
  reading; that was a measurement artifact, not the surface): **1440 → 72.4% blue / 27.6%
  green**, **375 → 75.6% / 24.4%**. Horizontal luminance profile at mid-height is symmetric:
  `0.041 0.027 0.015 0.007 0.004 0.004 0.004 0.007 0.015 0.027`.
- Contrast **improved** because the peak green is now lighter: `--mk-paper` **11.64:1**
  (was 7.88), `--mk-paper-mute` **8.53:1**, `--mk-accent` **7.09:1**. All pass.
- 11 marketing routes re-swept at both widths: 200, 0px overflow, 3 layers, base `#00112F`.

### 2026-11-03 — support pages (`/faq`, `/privacy`, `/terms`, `/forum`)

Four pages were still on the pre-redesign vocabulary. All four are now on `--mk-*`
tokens. **No page's behaviour changed** — this is a surface pass, not a rewrite of
what the pages do.

| Page | What it was | What it is |
|---|---|---|
| `/faq` | flat `<details>` list, no grouping | grouped reading surface: five categories in a `lg:grid-cols-12` rail (name left, questions right), mirroring `/about`'s Mission/Vision grid |
| `/privacy` | bespoke layout per page | one `LegalDocument` component |
| `/terms` | bespoke layout per page | the same `LegalDocument` component |
| `/forum` | `bg-primary` / `gray-*` / `border-border` | `--mk-*` equivalents only, markup and logic untouched |

- **`components/marketing/legal-document.tsx` is the new shared shell** for
  `/privacy` and `/terms`; `privacy-content.tsx` and `terms-content.tsx` are now
  thin wrappers over the dictionary. `LegalSection.paragraphs` must be
  `readonly string[]` — `Widen<T>` makes every dictionary array readonly, and a
  plain `string[]` fails `tsc` against both locales.
- **No section index was added** to the legal pages: the section titles already
  carry their own numbers ("1. Information We Collect"), so a second numbering
  would have been duplicate chrome.
- **`/faq` has no section marker.** It is the one support page whose hero is a
  plain `h1` + lede, matching `/news`.
- **`/forum` was a token swap, nothing else.** Six files, ~1,100 lines, including
  the thread detail page. Auth context, Firestore wiring, the create-thread
  modal, likes and sharing are byte-identical in behaviour. `hover:text-red-500`
  was deliberately kept: it is a destructive affordance, not a brand colour.
- **Measured:** 0px horizontal overflow at 1440 and 375 on all four pages; 0
  contrast failures (42 nodes on `/faq`, 32 `/privacy`, 31 `/terms`, 11
  `/forum`). Heights at 1440/375: `/faq` 3,856/5,522 · `/privacy` 3,318/4,192 ·
  `/terms` 3,637/4,616 · `/forum` 1,702/2,280. tsc clean, lint 0 errors,
  **381/381** tests, build OK.

**Those five leftovers were then migrated too** — see the "whole-surface sweep"
entry above. The only files still on `--gray-*` / `--primary` are `/admin` and the
three admin-only primitives in `components/ui/`, which is deliberate: the token
set was designed to leave the dashboard untouched.

**`/forum` is not localised.** `forum/page.tsx` hardcodes "Community Forum" and
its `h1` is `sr-only`; the ES render therefore shows the English title. This
predates the redesign and was left alone rather than half-fixed.

### 2026-11-03 — whole-surface sweep (the pages nobody had looked at)

After the four support pages, the remaining surface was swept by grepping the
entire tree for pre-redesign tokens rather than by guessing which pages were old.
That found **fifteen** more files, every one re-verified as zero-legacy-token after
the edit: `loading.tsx`, `error.tsx`, `not-found.tsx`, `login/page.tsx`,
`contact/contact-form.tsx`, `join/join-content.tsx`, `news/news-list.tsx`,
`news/[slug]/blog-post-content.tsx`, `lp/[slug]/lp-content.tsx`,
`lp/[slug]/lp-contact-form.tsx`, `satisfaction/[token]/page.tsx`,
`forum/[id]/thread-content.tsx`, `components/survey/satisfaction-survey.tsx`,
`components/layout/navbar.tsx`, `components/layout/footer.tsx`.

**What "everywhere" actually excludes, and why:**

| Left on the old palette | Reason |
|---|---|
| `app/(admin)/**` — 30+ files | `/admin` is intentionally not part of the marketing redesign; `--primary`/`--gray-*` are still defined for it |
| `components/admin/**` — 17 files | same |
| `components/ui/{button,input,textarea}.tsx` | **zero** non-admin imports (verified) — admin-only primitives |
| `app/globals.css` | it is where `--primary` and `--gray-*` are *defined*; removing them breaks `/admin` |

**Eight raw Tailwind palette colours survive on purpose** — they are semantic, not
brand: `text-red-600`/`text-red-500` for form errors and destructive affordances
(`login`, `contact-form`, `join-content`, `forum-auth-modal`, `forum-list` ×2,
`thread-content`), `text-green-700` for the liked/success state (`forum-list`,
`thread-content`). Tokenising these would make "error" and "brand" the same
colour, which is worse.

**Navbar mobile menu** already existed and had a focus trap, Escape-to-close and
`aria-controls`; only its colours needed changing. Verified open at 375px: 8
links, panel 343×414 at y=64, 0px overflow.

**Measured after the sweep:** all 13 routes return 200 at 1440 and 375 with **0px
horizontal overflow** (`/nope-404` correctly 404s). tsc clean, lint 0 errors,
**381/381** tests, build OK. `/forum` renders "No posts yet" — there is no thread
data in this environment, so the thread route was verified by typecheck and token
grep, **not** visually. That gap is real and is stated rather than glossed over.

**Not done, deliberately:** `/forum` is still not localised — `forum/page.tsx`
hardcodes "Community Forum" and its `h1` is `sr-only`, so the ES render shows the
English title. Its strings are inline, not in the dictionary, so translating it is
a real job rather than a token swap.

### 2026-11-03 — /services rebuilt as an interactive card grid

- **Owner feedback on the grouped directory:** *"you did exactly what i expected
  and didnt want, there is no design looks boring. even the home page displays it
  better. its just text, client will feel like viewing a book… i need it more like
  the home page interactive."* That is a fair verdict: the grouped directory was
  twelve identical text blocks with no glyph, no surface, and no response to the
  pointer.
- **Root cause of the previous attempt:** I optimised the wrong variable. Two
  rounds went into *structure* — flatten, then group, then three columns — when
  the complaint was that the page had no visual design at all. Structure cannot
  fix a page that has no cards.
- **What shipped:** `components/marketing/services-grid.tsx` — a client component
  reusing Home's established card vocabulary rather than inventing a new one:
  | Home device | Reused |
  |---|---|
  | `ServiceGlyph` icon tile | yes, all 12 anchors have glyphs |
  | `rounded-(--mk-radius-lg)` card on `bg-mk-paper/50` | yes |
  | hover lift + `shadow-(--mk-shadow-card)` + glyph tile inverting to brand | yes |
  | ticked task list under a small caps label | yes (`What we handle`) |
- **Interactivity** is a filter row using the same toggle-chip pattern as Home's
  handoff picker: `All services` / `By industry` / `By function`, `aria-pressed`
  per chip, `useState` for the active filter. Verified by clicking: 12 → 3
  (`legal, real-estate, insurance`) → 9, with `aria-pressed="true"` and the
  brand-filled chip state.
- **`SERVICE_GROUPS` survived the rewrite.** The filter reads the same constant the
  grouped directory used, so the industry/function split stays the single source
  of truth and its three drift-guard tests keep protecting it. `anchorsFor()` maps
  a filter to anchors through it.
- **Cards are not links.** This page is the destination the footer deep-links
  into, so each card carries its own anchor id (`scroll-mt-24` for the fixed
  header). Home's cards link here; these have nowhere further to go.
- **Accessibility:** the filter result count is announced through an
  `aria-live="polite"` `sr-only` paragraph (`"3 services shown"`), because the
  cards otherwise appear and disappear silently. Chip labels carry `aria-pressed`.
- **Measured:** 12 cards, 397–407px tall, 3 columns at 1440 / 2 at `sm` / 1 at
  375. Page 3,912px — taller than the 3,721px directory, which is the expected
  trade: cards add surface and breathing room, and the filter means a reader no
  longer has to scroll the whole list.
- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/`
  warning) · **380/380 tests** · build succeeds · 0px overflow at 1440 and 375 ·
  0 contrast failures across 119 text nodes · ES renders (`Empieza por el trabajo
  que más te está costando.`, `Todos los servicios` / `Por industria` / `Por
  función`).

### 2026-11-03 — /services regrouped into industry and function clusters

- **Context:** with packages gone to `/pricing`, this page is purely a catalogue,
  so it can be organised around the work rather than around selling.
- **The actual defect was flatness, not length.** Measured before the change:
  12 entries, 72 feature lines, 642 words, 3,990px tall, and **every entry the
  same height (347 / 323px)**. Twelve equal-weight blocks give the eye nowhere to
  start; 642 words was never the problem.
- **The grouping was already latent in the data.** Nine services are sold by
  function; three are sold by sector (Legal, Real Estate, Insurance). Flattened,
  a law firm read past eight unrelated services before reaching theirs.
- **`SERVICE_GROUPS` in `lib/constants/services.ts`** expresses the split as
  indexes over `SERVICE_ANCHORS`, not a second list — anchor order is load-bearing
  for the footer's index pairing, so duplicating it would have let the two drift.
  Industry = `[3, 9, 10]`, function = `[0, 1, 2, 4, 5, 6, 7, 8, 11]`.
- **Three drift-guard tests added** (`__tests__/lib/constants/services.test.ts`):
  every anchor index appears exactly once across the groups, every group is
  non-empty and in range, and group ids are unique. A dropped index would have
  silently deleted a service while its footer deep link still pointed at it.
- **Industry first.** It is the differentiator — most VA agencies do not sell by
  sector — so it leads rather than sitting eleventh in a list.
- **Three columns, because both counts divide by three** (3 and 9). Two columns
  would have left a single entry stranded beside empty space in the nine-item
  group. Verified: 0 of 72 feature lines wrap at 368px column width.
- **Numbering restarts per group.** Global numbering was tried first and read as
  broken — the industry cluster displayed "04, 10, 11" because the numbers were
  dictionary indexes rather than positions. Now `01 02 03` / `01 … 09`.
- **`GroupHeader`** uses `border-t-2 border-mk-brand` so a cluster boundary is
  visually heavier than the `border-t border-mk-line` on each entry. Heading level
  is `h2`, giving a clean outline: h1 (page) → h2 (group) → h3 (service).
- **Pricing bridge:** the closing panel now has a second CTA, `"See what it
  costs"` → `/pricing` (`outlineDark`). The pages are separate now, so the
  catalogue has to say what it costs to buy from it.
- **Measured after:** page 3,990 → **3,721px**; 12 entries and all 12 anchors
  intact; single entry height 347px; 0px overflow at 1440 and 375.
- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/`
  warning) · **380/380 tests** (3 new) · build succeeds · 0 contrast failures
  across 105 text nodes on `/services` · ES renders (`Servicios por industria`,
  `Servicios por función`).

### 2026-11-03 — integrations band, variant 2: claim left, tools right

- **Owner request:** *"much better but still kinda iffy, try another way of
  displaying it and we will see what we choose."* So this is an alternative to
  compare against the one-line version, not a replacement decision.
- **What was iffy about v1:** all ten tools sat on a single 93px line while the
  sentence sat above it, so the band was mostly empty and the claim and the
  evidence carried the same weight.
- **v2 layout:** `lg:grid-cols-[minmax(0,20rem)_1fr]` — the sentence as a real
  2-line heading on the left (306px), the tools as a ticked grid on the right.
  `lg:grid-cols-5` for the list because ten items divide evenly into two rows of
  five; three columns left a fourth row holding a single orphan item.
- **Measured:** band 1216×101px at 1440px (grid content 45px, 2 rows, five
  columns of 134px, no truncation). At 375px: 235px, 2 columns, 5 rows, 0px
  overflow. Compare v1: 93px at 1440, 200px at 375.
- **Revert path:** v1 is the previous commit of this file — a single
  `flex flex-wrap` list under an `h3`, no grid wrapper.
- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/`
  warning) · 377/377 tests · build succeeds · 0px overflow at 1440 and 375 ·
  0 contrast failures across the band's 11 nodes.

### 2026-11-03 — integrations block collapsed to a small check band

- **Owner request:** *"lets make it like this, all plans integrate into what you
  already use title or workflow you already use. then check marks for (check)
  Gmail, Outlook, Google Calendar (check) Shopify, WooCommerce etc. something
  small."* Reference: a single tinted band with a sentence and inline ticked items.
- **What changed:** the four cards became one band. Heading
  `"Integrates with the software you already use"` → the full sentence
  **"All plans integrate with the workflow you already use."** and the four
  category cards collapsed into ten tool names with a tick each, inline.
- **Why a band and not cards:** the content is one sentence plus a list of proper
  nouns. A card per category gave every item a heading and a rule it did not need,
  and made the reader parse four groups to find one tool name.
- **Styling:** `rounded-(--mk-radius-lg) bg-mk-accent-soft`, one row of inline
  ticks with `flex flex-wrap gap-x-5 gap-y-2`, `text-[0.84rem]` and
  `leading-none` so the ticks and text sit on the same baseline. Tick is a 14px
  `text-mk-brand` stroke, `aria-hidden` — the tool name is the content.
- **Measured:** 93px tall at 1440px with all ten items on a single row; 200px at
  375px over five short rows. Previously 75px per card plus a 4-up grid.
- **Contrast on the new background:** the band is `#D8F5EF`, which the previous
  cards did not use. Re-measured rather than assumed — 11 nodes, 0 failures; tick
  stroke at 8.03:1.
- **⚠️ STILL UNVERIFIED — needs owner confirmation before launch.** The ten tool
  names are a claim that we support each one. The owner named Gmail, Outlook,
  Shopify, and Salesforce; **Google Calendar, WooCommerce, HubSpot, Slack, Notion,
  and Asana are my additions.** `grep -riE "gmail|outlook|slack|notion|hubspot|
  salesforce|woocommerce|asana|shopify"` over `lib/i18n/` returns only the generic
  `"Tool setup and integration support"`, so nothing in the repo evidences any of
  them. Same class of error as the seven "no setup fees" claims fixed earlier on
  this page — trim or confirm before launch.
- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/`
  warning) · 377/377 tests · build succeeds · 0px overflow at 1440 and 375 ·
  10 ticks in both locales · 0 contrast failures across the band's 11 nodes.

### 2026-11-03 — "Every plan also includes" → integrations, in place

- **Owner request:** *"I dont want a new section, revert. we simply want to change
  this small section here. because its repetitive. so we want it to now say we
  integrate into your workflow and the software you use, so gmail, outlook,
  shopify, salesforce, etc but small the same size as it exists now."*
- **Reverted first.** An `Integrations` section had been added as a *separate*
  section, replacing the "Every plan includes" checklist and relocating the hours
  panel. That was built on an assumption the owner never approved and is now
  fully undone: `Integrations` deleted, `Included` restored, `HoursPanel` back in
  its own section, `integrations*` keys removed, `included*` keys restored,
  `hoursPanelLabel` renamed back to `includedMockupLabel`. Confirmed by grep: no
  `Integrations` symbol, no `integrations` keys, `TICK` in use again.
- **What changed instead:** the four small cards under Plans, in place, same
  footprint. Heading `"Every plan also includes"` → **"Integrates with the
  software you already use"**. Each card is a category with the tools named on
  one line, so a reader can scan for their own tool without reading a paragraph.
  | Card | Tools |
  |---|---|
  | Email & calendar | Gmail, Outlook, Google Calendar |
  | Retail & e-commerce | Shopify, WooCommerce |
  | CRM & sales | Salesforce, HubSpot |
  | Team & docs | Slack, Notion, Asana |
- **Size preserved:** four cells at 1440px, each 75px tall (the previous cards
  were 97px — shorter because the tool list is one line rather than a two-line
  sentence). `sm:grid-cols-2 lg:grid-cols-4`, rule above each, unchanged.
- **⚠️ UNVERIFIED — needs owner confirmation before launch.** Every vendor name
  above is a claim that we support that integration. Nothing in the repository
  evidences support for **any** of them: `grep -riE "gmail|outlook|slack|notion|
  hubspot|salesforce|quickbooks|xero|asana|shopify"` over `lib/i18n/` returns
  only the generic `"Tool setup and integration support"` and `"Custom workflows
  & integrations"`. The owner named Gmail, Outlook, Shopify, and Salesforce;
  **Google Calendar, WooCommerce, HubSpot, Slack, Notion, and Asana are my
  additions and were not requested.** Remove or confirm each one. This is the same
  class of error as the seven "no setup fees" claims fixed earlier on this page.
- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/`
  warning) · 377/377 tests · build succeeds · 0px overflow at 1440 and 375 ·
  four cards in both locales · `Included` section and hours panel confirmed still
  present · 0 contrast failures across 52 text nodes on `/pricing`.

### 2026-11-03 — "Every plan also includes" settled on four highlighted cards

Three shapes were tried before this landed; recording them so the oscillation is
not repeated.

1. **Six cards with descriptions** — owner: *"thats too much now"*. The section
   below ("Every plan includes") restated the same ground.
2. **A one-line text strip** — owner: *"too simple now… it needs to be highlight
   not just text"*.
3. **Four cards with descriptions** — shipped.

- **Why four and not six.** The duplication was the real defect, not the count.
  Two items were cut because the section below already carried them:
  | Cut | Already covered below by |
  |---|---|
  | "Works inside your tools" | `"A dedicated assistant assigned to your business"` |
  | "Scope agreed in writing" | `"Setup work quoted before it begins"` |
  `includedItems` was also trimmed from 6 to 5 (the onboarding line moved up into
  the extras), so the two blocks now partition rather than overlap: extras hold
  the four differentiators, the block below holds the five foundation items.
- **Descriptions kept but shortened** — one clause each, no second sentence. The
  cards carry weight from the rule and the heading, not from word count.
- **Layout:** `border-t border-mk-line` per cell, `sm:grid-cols-2 lg:grid-cols-4`.
  Measured at 1440px: 104 / 418 / 732 / 1046, all flush with the `h3` at 104.
- **Note on the text strip:** it was rejected for being visually flat, but it was
  also structurally broken on mobile — mapped as separate flex items, each one
  wrapped onto its own line, turning a one-line strip into five. `join(" · ")` as
  inline text fixed the wrapping; the design was then rejected on visual grounds,
  not layout.
- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/`
  warning) · 377/377 tests · build succeeds · 0px overflow at 1440 and 375 ·
  4 cards in both locales · 0 contrast failures across 52 text nodes on `/pricing`.

### 2026-11-03 — support pages rebuilt: /faq, /privacy, /terms, /forum

**Owner request.** *"lets do the support pages too now"* → *"yes do all in a batch proceed"*.
Scope taken from the footer's own grouping, `supportHrefs` in `components/layout/footer.tsx`:
`/faq`, `/forum`, `/privacy`, `/terms`. `/contact` is in `companyHrefs` and was already on
`mk-*` tokens, so it was left alone.

**All four were still on the legacy `gray-*` / `primary` palette** — the last marketing pages
that had never been migrated. `/faq`, `/privacy`, `/terms` were also still centre-aligned with
`text-4xl lg:text-5xl font-bold`, the pre-redesign type.

#### `/faq` — rebuilt
- Reading surface rather than a landing page: hero with the `h1` and lede, then five groups
  with the group name in a **left rail** (`lg:grid-cols-12`, label on 3, questions on 9) and
  Q&As separated by hairlines. The rail mirrors the Mission / Vision band on `/about` — same
  grid, same uppercase label weight — so the two pages read as one site.
- **No eyebrow above the `h1`.** The title already says "Frequently Asked Questions"; a label
  repeating it would only push the title down. Given the `/news` mistake, no markers were
  added to any of these pages.
- Closing panel inset on paper, not full-bleed: the footer directly below is navy, and a
  full-bleed green band would put two saturated dark blocks edge to edge. Same pattern as
  `/about`.
- The 15 questions and 5 group names are unchanged — copy was not touched.

#### `/privacy` and `/terms` — one shared component
- The two files were **the same markup twice**: title, "last updated", then sections made of
  paragraphs, an optional bullet list, and an optional `contactEmail` appended to the last
  paragraph. Both are now thin wrappers over `components/marketing/legal-document.tsx`.
- **No second implementation left to drift** — a fix to one legal page is a fix to both.
- Layout is a single `max-w-[68ch]` column, deliberately not the FAQ's two-column rail: legal
  prose is read top to bottom, and a rail would squeeze the text at every width where the
  rail has room.
- **Section titles already carry their own numbers** ("1. Information We Collect"), so no
  index was added — that would have printed the number twice.
- `LegalSection.paragraphs` / `.list` are `readonly` because `Widen<T>` in `lib/i18n` makes
  every dictionary array readonly; the mutable version failed `tsc` against both locales.

#### `/forum` — token migration only
- The forum is an interactive surface (auth context, Firestore reads, create-post modal,
  like / share actions) across six files and ~1,100 lines. **Behaviour, markup structure and
  state were not touched** — only the colour classes were migrated to `mk-*`.
- Mapping applied: `bg-primary` → `bg-mk-brand`; `hover:bg-primary-light` →
  `hover:bg-mk-brand-bright`; `text-primary` → `text-mk-brand`; `gray-60/40` →
  `text-mk-ink-mute`; `gray-70` → `text-mk-ink-soft`; `gray-80/100` → `text-mk-ink`;
  `gray-10` → `bg-mk-paper-deep`; `gray-10/40` and `gray-10/30` → `bg-mk-paper`;
  `border-gray-20` → `border-mk-line`; `divide-gray-20` → `divide-mk-line`;
  `border-border` → `border-mk-line-strong`; `bg-white` → `bg-mk-white`;
  `focus:border-primary` → `focus:border-mk-brand`.
- `hover:text-red-500` on the image-remove button was **kept** — it is the destructive
  affordance, not a brand colour.

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests · build succeeds · **0 contrast failures** and **0px overflow** at 1440 and
375 on all three — `/privacy` 32 nodes, `/terms` 31, `/forum` 11 (the forum renders its
signed-out empty state) · zero legacy `gray-*` / `primary` / `border-border` classes left in
`app/(marketing)/forum/` · ES serves "Política de Privacidad", "Términos de Servicio" and
"Última actualización: 14 de febrero de 2026".
**Page totals:** `/privacy` 3,318px @1440 / 4,192px @375 · `/terms` 3,637 / 4,616 ·
`/forum` 1,702 / 2,280 · `/faq` 3,856 / 5,522.

### 2026-11-03 — homepage handoff CTA now opens /join, not /contact

**Owner request.** *"the talk it through should lead to join instead of taking you to the
contact page."*

- `components/marketing/home/handoff-picker.tsx` — the CTA that appears once a reader has
  picked one or more services pointed at `/contact`; it now points at `/join`.
- **Analytics id renamed with it**, `home_handoff_contact` → `home_handoff_join`. Leaving the
  old id would have attributed sign-up intent to the contact funnel in reporting. The naming
  matches the other join CTAs (`home_final_join`, `pricing_hero_join`).
- **The label was left alone** — "Talk it through" / "Conversemos". The owner asked for the
  destination only; flagging that the wording now sits slightly oddly on a sign-up page, in
  case they want it changed too.
- **Verified by clicking, not by reading the source:** selecting one service renders the CTA
  with `href="/join"` and `data-analytics-cta="home_handoff_join"`, and following it lands on
  `http://localhost:3100/join` (h1 "Book a Free Consultation"). The CTA is not in the server
  HTML because it only mounts once a service is selected.

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests · build succeeds.

### 2026-11-03 — one section marker across the whole site

**Owner request.** *"we need to use the same button as the about page everywhere, we are using
2 types of these cards."*

- **There really were two.** `/about` had a local `Label`: a 32×1px hairline rule followed by
  `text-[0.68rem]` / `tracking-[0.2em]` / `text-mk-ink-mute`. Everything else used
  `Eyebrow` from `primitives.tsx`: an `6×6px` rounded dot followed by `text-[0.72rem]` /
  `tracking-[0.18em]` / `text-mk-brand`. Same job, different marker, different size, different
  colour — visible side by side on any two pages.
- **About's version won and became the only implementation.** `Eyebrow` now renders the rule
  and inherits About's metrics and colours. The `onDark` variant moved with it
  (`text-mk-paper/70` + `bg-white/25`), so the dark bands kept a readable marker.
- **Three duplicate copies were deleted, not left to drift:**
  - `about-content.tsx` — local `Label` removed, now imports `Eyebrow`.
  - `pricing-content.tsx` — hand-rolled dot `<p>` in the hero replaced with `<Eyebrow>`.
  - `home/closing.tsx` — hand-rolled dot `<p>` on the dark CTA band replaced with
    `<Eyebrow onDark>`.
- **Not changed:** the dot at `home/human.tsx:46` is a chat "online" status inside a mockup,
  and `mockups.tsx:96` is a pill chip. Neither is a section marker.
- **Verified uniformity by measurement, not by eye:** every `main p > span[aria-hidden]`
  across `/`, `/about`, `/pricing`, `/services` and `/news` now reports the **same single
  signature** — `10.88px`, `letter-spacing 2.176px`, `gap 12px`, marker `32px × 1px`,
  `border-radius 0`. 20 markers total (9 / 5 / 4 / 1 / 1).

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests · build succeeds · **0 contrast failures** on `/about` (66 nodes),
`/pricing` (100), `/services` (387) and `/news` (10) at 1440 and 375 · 0px overflow
everywhere.

**✅ CORRECTION (2026-11-03) — the "process numerals fail contrast" note below was WRONG.**
It was carried forward through several sessions without re-checking and repeated to the owner
twice as an open bug. It is not one. Measured on the live page: `01`/`02`/`03` render
`rgb(86,107,133)` (`--mk-ink-mute`) at `35.2px`/`800` on white → **5.47:1**, against a 3:1
minimum for large text. `text-mk-line-strong` **does not appear anywhere in
`process.tsx`** (`grep` for `text-mk-line-strong` across `app/` + `components/` returns zero
non-admin hits). The original note had either measured the wrong node or a border rule rather
than the numeral. Do not re-file this as a bug.

### 2026-11-03 — /services and /pricing titles given the two-tone treatment

**Owner request.** *"home and about uses the two color title but pricing and services dont and
can, we need to make them the same. for services 'not a generic list' can be green and in
pricing 'without the hiring'."*

- **`/` and `/about` already split their title in two**, via `heroTitle` + `heroTitleHighlight`
  keys rendered as `<span className="text-mk-brand">`. `/pricing` and `/services` each rendered
  one flat string, so their titles were single-colour.
- **Same pattern, two new keys** — no new mechanism invented:
  - `services.industriesTitle` → "Built around your sector," + **`industriesTitleHighlight`**
    → "not a generic list." (ES: "Diseñado para tu sector," / "no una lista genérica.")
  - `pricing.heroTitle` → "The help you need," + **`heroTitleHighlight`** → "without the
    hiring." (ES: "La ayuda que necesitas," / "sin contratar.")
  The comma stays with the leading half, matching `/about`'s split. `es.ts` carries
  `heroTitleHighlight` for `about` already, so the pricing key reuses the same name; the
  services one is new to both locales.
- **No forced `<br>`.** `/about` breaks the line because its two halves are separate
  sentences. Both headings here are one sentence continued after a comma, so a hard break
  would cut mid-phrase — the span is inline and wraps naturally. At 1440 the `/services`
  title breaks as "Built around your / sector, **not a generic** / **list.**" and `/pricing`
  as "The help you need, / **without the hiring.**"; at 375 both read cleanly.
- **Contrast holds.** `--mk-brand` `#005148` on the `--mk-accent-soft` `#D8F5EF` band clears
  the large-text threshold, and on `--mk-paper` for `/pricing`.

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests · build succeeds · **0 contrast failures** and **0px overflow** at 1440
(387 nodes on `/services`, 100 on `/pricing`) and 375 · both titles still compute to
**72px / 800 / 70.56px / -3.24px**, identical to `/about` and `/news` · ES renders
`no una lista genérica.` and `sin contratar.` inside the brand span.

### 2026-11-03 — /services: industries heading given the page-title scale, illustrations unpinned

**Owner request.** *"the heading here needs to match the other heading font size and style
since this title is not the main title. then make the cards keep position, i dont like how
they move when we scroll."* Clarified immediately after: the industries title should *be*
like the titles on the other pages.

- **First attempt was wrong and was reverted.** It read "not the main title" as "make it
  smaller" and added a `compact` scale (`clamp(1.55rem,2.8vw,2.15rem)` → 34.4px). The
  owner's intent was the opposite: match the sibling pages, do not demote.
- **Correct fix ties scale to heading level.** `SectionHeading` now maps `level` to a scale
  instead of taking a separate `scale` prop:
  - `level={1}` → `clamp(2.4rem,6vw,4.5rem)` / `leading-[0.98]` / `tracking-[-0.045em]`
  - `level={2}` → `clamp(1.9rem,3.6vw,3rem)` / `leading-[1.08]` / `tracking-[-0.025em]`

  `level={1}` is used **only** by the industries band, so this changes one heading and no
  other page. The `h1` itself stays — the page still needs exactly one.
- **Measured parity with `/pricing`:** both `/services` `h1` and the `/pricing` `h1` compute
  to **72px / weight 800 / line-height 70.56px / letter-spacing -3.24px / Plus Jakarta Sans**
  — the same values, not merely similar. `/about` and `/news` use the same clamp in bespoke
  markup. The catalogue `h2` remains at 48px, so the page keeps a real hierarchy.
- **`lg:sticky lg:top-28` removed** from the illustration column in `service-detail.tsx`.
  Pinning it meant the mockup drifted independently of the copy beside it for the whole
  length of a row (rows are 462–562px tall), which read as the card moving on scroll. It now
  sits at the top of its own grid cell and stays there. Verified: `position: sticky` count
  inside the rows is **0**.

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests · build succeeds · **0 contrast failures across 386 nodes** and **0px
overflow** at 1440 and 375 · all twelve mockups still render at `491px` wide · exactly one
`h1` per page · ES still serves `Una mirada de cerca a lo que hacemos`. **Page totals:**
9,326px at 1440 · 18,288px at 375.

### 2026-11-03 — /services: band heading rewritten twice; final tone is a plain introduction

**Owner request.** *"lets change the title too now that we have redesigned it, this is
basically repeat of whats in the home page. lets use something relative and new."*

- **The duplication was exact, not approximate.** `services.directoryTitle` was the same
  string as `home.servicesTitle` — "Start with the work that is costing you the most." — and
  the lede repeated the homepage's "dedicated bilingual assistant" line as well. Two pages
  opened with the same sentence.
- **New heading: "Every service, spelled out."** / **"Todos los servicios, al detalle."**
  It describes what *this* band is — the complete catalogue, each row giving the coverage
  list, the reasoning and an illustration — which is a claim the homepage cannot make. The
  homepage keeps its persuasive framing because there the list is a teaser.
- **New lede** avoids both prior versions: *"No shortlist and no teaser — each one says what
  it covers, what it changes for you, and what the work actually looks like. Start wherever
  your week is heaviest."* It also avoids repeating the industries band directly above,
  which already carries "Built around your sector, not a generic list."
- **Keys were reused, not added.** `directoryTitle` / `directoryDesc` already existed and
  only this band consumes them, so no i18n surface changed — just the two values, both
  locales together.

**Revised the same session.** "Every service, spelled out." was rejected — it claimed a
completeness the page does not promise, and the tone was wrong for a band that is simply
introducing the catalogue. Final copy is an introduction, not a claim:

- **"A closer look at what we do."** / **"Una mirada de cerca a lo que hacemos."**
- Lede: *"Each service in turn — what it covers, why it helps, and what the work looks like.
  Read straight through or jump to the one you need."*

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests · build succeeds · `/services` renders the new `h2` · `/` still renders the
homepage's own string **3×**, so it is untouched · ES renders `Una mirada de cerca a lo que
hacemos`.

### 2026-11-03 — /services: catalogue numeral removed, sample flight re-routed

- **The `01`–`12` pill is gone** from every service row (owner request). It was a leftover
  from the deleted card grid, where the numeral gave each card a stable identity as filters
  changed which ones were on screen. With all twelve always rendered in a fixed order it
  identified nothing, and it pushed the glyph and heading down for no gain. The row now opens
  on the glyph tile. `Pill` is still imported by the news pages, so the primitive stays.
- **The sample flight now goes to Atlanta**, not Belize City (`Vuelo a Atlanta` in Spanish).
  The illustration is meant to be a plausible business trip for any reader, and Belize was a
  tell that it had been written by a Belizean company. Nothing else in the mockups is
  location-specific.
- **Row heights fell** from 507/572 to 462/527 at 1440 — the pill was 28px plus its margin.

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests · build succeeds · **0 contrast failures across 384 nodes** and **0px
overflow** at 1440 and 375 · no `Belize City` / `Ciudad de Belice` left in either locale.
**Page totals:** 9,269px at 1440 (was 9,771) · 18,301px at 375.

### 2026-11-03 — /services: mockups given real content instead of grey bars

**Owner request.** *"they all need a bit more further development … it needs to look more
realistic to what it is, like document is just basically blank, conversations too, maybe we
add text to them where needed too. publish section what is it publishing just tiles lol?"*

- **Every placeholder bar that stood for words became words.** A "Documents" panel with four
  blank rows never said *e-filing*; a subject line does. Each mockup now carries the text its
  real interface would carry: sender names and subject lines, event titles with times, a job
  title and its pipeline stages, matter and file names, the actual message exchange, post
  captions, report findings, invoice ids and clients, a post headline and standfirst, an
  address and price, a claim number with its attachments, three named process steps.
- **The social mockup was the worst offender** and is the one that changed shape. Six empty
  tiles with a repeated *Published* label said nothing about publishing. It is now three post
  rows: thumbnail, real caption, and a quiet scheduled-state marker.
- **Numbers appear only where the depicted interface would have them** — invoice ids, amounts,
  pipeline counts, clock times. They belong to the invented example, not to our results, and
  the caption under every frame still says it is an illustration.
- **`t.services.mockup` was restructured** from a flat list of 28 label strings into one
  nested object per mockup (senders, subjects, events, stages, files, messages, posts,
  findings, invoice rows, steps). Both locales written together; `MockupLabels` became
  `MockupCopy = Dictionary["services"]["mockup"]`, and each component takes the whole slice.
- **A floor on the frame body** (`min-h-64`): the twelve compositions ranged 210–400px, so the
  short ones left dead space under the illustration in a 572px row. They now bottom out at
  294px and the caption sits on a consistent baseline.
- **Still CSS only, still `aria-hidden`, still no dependency.** No images, no icon library.

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests · build succeeds · all twelve captured and inspected · **0 contrast
failures across 396 nodes** and **0px overflow** at 1440 and 375 · **0 English strings on
the ES page** (all seventeen sampled Spanish strings present, all six sampled English ones
absent, in the server-rendered HTML) · rows stay a uniform **572px**.
**Page totals:** 9,771px at 1440 · 18,838px at 375.

### 2026-11-03 — /services: twelve bespoke mockups, one per service

**Owner request.** *"all the mock up needs to be better … for admin support a proper mock up
for admin support related task like inbox management, exec calendar management, For HR maybe
a job posting, legal files getting e-filed, customer service maybe a troubleshooting call,
social media some posts, data research some reports, bookkeeping invoices, web support blogs,
real estate house getting sold open house schedule, insurance claims docs, optimization a
workflow … we can focus on their emotion and frustration about processes with visuals and us
getting it done."*

- **Six reused mockups became twelve bespoke ones.** The old set cycled `inbox`, `calendar`,
  `checklist`, `gallery`, `chart`, `flow` across the twelve services, so Legal and HR showed
  the same drawing. Recognition is the entire job of these illustrations; a reused one is
  filler. `ServiceMockup` is now a twelve-member union and `SERVICE_MOCKUPS` is one-to-one.
- **New compositions:** `hiring` (a live posting over a shortlist), `conversation` (a
  frustrated message and the reply that closes it), `invoices` (a summary strip over
  paid/overdue rows), `editor` (a post with a formatting toolbar), `listing` (a photo, a
  price row and an *Under contract* badge), `claim` (a shield header over ticked documents).
- **Each one is a small story, not a panel.** Messy input on top, resolved state at the
  bottom: an inbox with an empty-search counter and two *Replied* chips, documents with a
  rotated *Filed* stamp, a claim with every supporting document ticked. The point is the
  relief of the finished state.
- **Recognition devices, not decoration:** avatar initials in the inbox and chat, a
  `B I U` toolbar in the editor, a today-column wash and hour gutter in the calendar, a
  vertical rail joining the three workflow steps, folded-corner file badges, a search field
  with a `0` badge. Every one of them is a real UI affordance a reader has used before.
- **Still CSS only, still no dependency, still `aria-hidden`.** No images, no icons library,
  and no numbers that could read as a measured claim — the only numerals are clock hours,
  step ordinals and a zero-unread badge.
- **The last hardcoded English word is gone.** `HiringMockup` had a literal `Live` chip;
  it now reads from `t.services.mockup.live` (`Live` / `Activa`). `MockupLabels` grew from 11
  to 28 keys, added to both locales together.
- **Two self-inflicted bugs caught before shipping.** A `Publish` chip had been borrowed as a
  placeholder on a workflow step, where it means nothing — replaced with a status dot. And
  the listing photo was drawn with `border-x-16 border-b-12`, which are not reliable
  Tailwind border widths; it is now plain blocks.

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests · build succeeds · all twelve captured and inspected at 493px ·
**0 contrast failures across 330 nodes** and **0px overflow** at 1440 · **0 English mockup
labels on the ES page** (checked in the server-rendered HTML with a `creedava-lang=es`
cookie, because `innerText` upper-cases these labels and produced a false negative).

### 2026-11-03 — /services: the card grid is gone; all twelve render in full

**Owner request.** *"What if we make these replace the entire card … so it displays all of
these instead of the cards … all 12 display the new design we like and replaces these old
cards."*

**Supersedes the master–detail entry below.** That version kept the 12-card grid and opened
a panel on top of it. This one deletes the grid and renders the panel's design twelve times,
once per service.

- **Why the grid had to go, beyond taste:** it stated each service twice — once as a card,
  again in the detail band — and the card version carried less (no headline, no rationale,
  no illustration). A reader met the weaker description first. Two descriptions of one
  thing is a content problem, not a layout one.
- **`components/marketing/services-grid.tsx` deleted.** Its filters, its `ServicesFilter`
  type and its `aria-live` count went with it: with all twelve always on the page there is
  nothing to filter and nothing to open.
- **`SERVICE_GROUPS` and `ServiceGroupId` removed** from `lib/constants/services.ts`, plus
  the three tests that guarded them. `INDUSTRIES` and `SERVICE_ANCHORS` are untouched.
- **`ServiceDetail` is now one row, not a panel.** No `onClose`, no selection state, and the
  `id={anchor}` moved onto the row so the footer's `/services#<anchor>` links and the
  industries band's own links both resolve. Rows are separated by a hairline
  (`border-t`, cleared on `first:`) rather than each carrying its own `Section` padding.
- **The close button became the pricing link.** With nothing to close, the second action in
  each row is "See what it costs" → `/pricing`. Twelve "Start with this one" buttons and
  twelve pricing links, one pair per row.
- **Headings re-levelled.** `h1` stays on the industries band; the band heading above the
  rows is `h2`; each service name is `h3`; *What it covers* / *Why it works* are `h4`.
  Counts verified: **1 / 2 / 18 / 27** (18 `h3` = 12 services + 6 industry cards).
- **`detailEyebrow` and `detailClose` deleted** from both locales — "Selected service" above
  every row would have been false twelve times over.
- **`detailWhy` reworded** (owner request) from "Why it works with an assistant" to **"Why it
  matters"** / **"Por qué importa"**. The old label addressed the reader about *our* staffing
  model; the three reasons underneath are outcomes the reader gets, so the heading now asks
  the question those reasons answer. Label only — the `why` strings themselves were already
  reader-facing and are unchanged. Also removed: `filterAll`,
  `filterIndustry`, `filterFunction`, `filterCountLabel`, `cardLabel`. `directoryTitle` /
  `directoryDesc` were **kept** and now head the rows band, so the "start with what is
  costing you most" framing survives.
- **`ServicesExplorer` is a Server Component now** — no `useState`, no `useRef`, no
  `requestAnimationFrame` scroll helper. The page has no client boundary at all.

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**381/381** tests (three `SERVICE_GROUPS` tests removed) · build succeeds · **12/12** rows
render · **0px overflow** and **0 contrast failures across 310 nodes** at 1440 and 375 ·
`/services#legal` lands at **`top: 96px`** · ES renders in Spanish.
**Page totals:** **9,771px** at 1440 (was 4,705 with the grid) and **18,057px** at 375 (was
10,364). Rows are a uniform **572px** on desktop, so the length is twelve equal blocks, not
ragged content.

### 2026-11-03 — /services becomes master–detail: pick a service, see the work

> **Superseded later the same day** — the card grid described here was removed entirely.
> See the entry above. Kept for the reasoning about the panel itself, which survived.

**Owner request.** *"while nothing is selected i will show like a start with whats
costing you more landing page… you select something like social media management, the
card displays and you see what it entails… with mock ups, why its best to get a
creedava agent… you choose something else then another card appears for it."*

- **Landing state is unchanged** — industries band, then the full catalogue. Nothing is
  hidden behind the interaction, so the page still works for a reader who never clicks
  and for a crawler that never runs JS.
- **Selecting opens a panel between the two bands**, not a modal and not a route. Three
  reasons: the catalogue stays one scroll away, no history entry is created for a
  purely visual choice, and the twelve cards keep their `#anchor` deep-links intact.
- **`components/marketing/service-detail.tsx`** — argument on the left (numeral, glyph,
  headline, *What it covers*, *Why it works with an assistant*), illustration on the
  right in a `lg:sticky` column. The illustration column is deliberately the narrower
  one (`1.15fr / 0.85fr`): it is evidence of *what kind of work* this is, not the main
  event.
- **`components/marketing/service-mockups.tsx`** — **six** CSS compositions
  (`inbox`, `calendar`, `checklist`, `gallery`, `chart`, `flow`) mapped to the twelve
  services by `SERVICE_MOCKUPS` in `lib/constants/service-detail.ts`. Six rather than
  twelve because the work genuinely clusters; a bespoke drawing per service would have
  been twelve variations of the same three rectangles.
  - **No images and no new dependency** — every mark is a div or a border.
  - **`aria-hidden`, `select-none`, and no numbers** that could be read as a measured
    claim. The panel beside them does the arguing; the art only makes the work
    recognisable at a glance. A caption says so out loud: *"An illustration of the
    work, not a live screenshot."*
  - **Chrome labels are props, not constants.** `MockupLabels` arrives from
    `t.services.mockup` — the illustrations are *visible*, so a hardcoded English
    "This week" inside a Spanish page is a defect, not a detail. Caught in the ES pass
    and fixed before shipping.
- **Cards are `<article>` + an inset overlay `<button>`, not a `<button>` wrapping the
  card.** A `<button>` may only contain phrasing content, so wrapping the `<h3>` would
  have been invalid markup and would have flattened the heading for assistive tech. The
  overlay keeps the heading, keeps `id={anchor}` on the article for footer deep-links,
  and draws its focus ring **inset** (`focus-visible:ring-2 ring-inset`) — an outer
  outline would be clipped by the card's `overflow-hidden`, which exists to round the
  spine. A `has-[button:focus-visible]:outline-*` variant on the card was tried first
  and dropped: the ring is simpler and does not depend on an arbitrary variant
  compiling. Verified by keyboard traversal, not programmatic `.focus()` — the latter
  never matches `:focus-visible`, so it silently reports "no ring".
- **Industry card service names became buttons too**, so both pickers select rather than
  navigate. `onNavigate`'s filter reset is folded into `select()`.
- **Selecting resets the filter to `all`.** The panel sits *above* the grid; a reader who
  closes it and returns to the catalogue should not find it still narrowed to a cluster
  they did not choose.
- **Scroll offset bug, measured and fixed.** The first build called `scrollIntoView` on a
  wrapper with no scroll margin while `scroll-mt-24` sat on the inner `Section`, so the
  panel landed at `top: 0` — directly under the 96px sticky header. Moved the margin to
  the element that is actually scrolled: panel now lands at **`top: 96px`**.
- **Ordinal contrast bug, measured and fixed.** The `01/02/03` markers in the *why*
  column used `text-mk-line-strong` and measured **1.44:1** — the same trap as the `/`
  separator earlier in this file. They are text, not decoration, so they moved to
  `text-mk-ink-mute`.
- **New i18n keys, both locales, added together:** `detailEyebrow`, `detailClose`,
  `detailIncludes`, `detailWhy`, `detailStart`, `detailMockupNote`, `detailPricingLink`,
  `detail` (all twelve anchors, each `{ headline, why: [3] }`), and `mockup` (11 chrome
  labels).

**Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
**384/384** tests · build succeeds · **all twelve** services open at 375px with **0px
overflow** · **0 contrast failures across 195 nodes** (1440, panel open) and **200
nodes** (375, panel open) · landing state renders with no panel and exactly **one `h1`**
· close returns to landing · `/services#legal` still resolves to the grid card at
`top: 96px` with no panel · ES renders `Servicio seleccionado` / `Lo que cubre` / `Por
qué funciona con un asistente` / `Empezar por este` and the illustrations in Spanish
(`Esta semana`, `Plazos y reuniones en un solo calendario`).
**Page totals:** 4705px landing → 5384px with a panel open (1440).

### 2026-11-03 — /services: cards given identity, industries band added

**Diagnosis, measured before changing anything.** The page was not badly styled, it
was badly *hierarchised*: 12 cards at exactly 397px, all on `bg-mk-paper/50` with a
`border-mk-line`, all with the same 20px glyph in a 44px tile, all with six feature
lines (72 lines of text total). Nothing distinguished a card from its neighbours, so
the eye had no entry point and the page read as a document.

- **Card identity, three devices, no new data:**
  - a coloured spine along the top edge cycling `--mk-brand` → `--mk-brand-bright` →
    `--mk-accent`;
  - a catalogue numeral `01`–`12` in the label row, so each service keeps a stable
    identity even when a filter changes which cards are on screen;
  - a larger glyph tile (48px, glyph 24px) on a ground that also cycles, with a
    `scale-105` response on hover.
  - Cards moved from `bg-mk-paper/50` to `bg-mk-white` so the spine and the numeral
    read against the surface.
- **New `Industries we serve` band.** Six sectors — small business, legal, HR &
  recruiting, agencies & marketing, insurance, real estate — on `tone="tint"`
  (`--mk-accent-soft`) with white cards and *inverted* glyph tiles (`bg-mk-brand`,
  `text-mk-accent`). The inverted surface is the point: two bands, two rhythms, instead
  of one long field of cards. Each sector lists the services that actually get bought
  for it, and each service name deep-links to that card's anchor in the grid below.
- **Order: industries first, catalogue second** (changed on owner request after the
  first build put the grid on top). The sector band is now the entry point because a
  reader arrives knowing their sector, not our service names.
- **The hero was then removed entirely** (owner request): *"if they clicked on services
  they know they will be viewing our services"*. `/services` now opens on the industries
  band — page total 5094px → 4775px at 1440. Three sections remain: tint industries
  (1128px) → white grid (2183px) → paper closing (578px).
  - **The `h1` moved with it.** Removing the hero would have left the page with no main
    heading, so `SectionHeading` gained an optional `level` prop (`1 | 2`, default `2`)
    and the industries band renders `level={1}`. Verified: exactly **one `h1`** per page.
  - The eyebrow now reads **"Our services"** / **"Nuestros servicios"** — it names the
    page in place of the deleted title. Previously "Industries we serve".
  - `services.heroTitle` / `heroDesc` were deleted from **both** locales; the hero was
    their only consumer. `industriesEyebrow` changed value in both.
  - `IndustriesSection` no longer takes a `className` prop (added and removed in the same
    session, never used by more than one caller) and uses default `Section` padding now
    that it is the first band.
  - Re-verified after both moves: filter → *by function* leaves 9 cards and `#legal`
    absent; the Legal industry link resets to `all`, renders 12 cards and lands on
    `#legal` at `top: 96px`.
- **`INDUSTRIES` lives in `lib/constants/services.ts`**, as indexes into
  `SERVICE_ANCHORS` — the same pattern as `SERVICE_GROUPS`, so the anchor list stays
  the single source of truth. Three new tests assert every industry anchor resolves,
  both locales carry a copy entry per industry, and ids are unique.
- **Filter state was lifted into `ServicesExplorer`.** This is a correctness fix, not
  a refactor for its own sake: the industry links jump to `#anchor`, so a reader who
  had selected "By function" would have followed a link to a card that was not in the
  DOM.
- **`/services` deliberately has no logo.** Asked for and then withdrawn — do not add
  one without a new instruction.
- **`/` separator replaced with a hairline.** The `/` between the numeral and "What we
  handle" measured **1.55:1** against the white card. It is now a 1px `bg-mk-line-strong`
  rule: decoration carries no contrast requirement, text does.

- **Card heights are equal per row, not content height** (owner: *"let them stay same size.
  looks weird if they are smaller"*). Cards had briefly been set to end where their content
  ended; side by side with a five-service card that read as broken rather than compact, so
  `h-full` + a `flex` list item is back and each row stretches to its tallest card.
  - The slack is **above the divider**, not below the last link: the link list carries
    `mt-auto`, so the `border-t` rules line up across a row instead of floating at
    different heights.
  - **Sector order is the lever that keeps the slack small.** The grid fills row-first, so
    the order in `INDUSTRIES` decides who shares a row. Current order — agencies (3),
    small business (5), HR (1) · insurance (1), real estate (1), legal (1) — pairs the two
    multi-service sectors together and puts the four single-service sectors in a row of
    their own. Measured: 3-col rows **372 / 236**, 2-col rows **394 / 259 / 236**, 1-col
    natural heights (no stretching in a single column).
  - `INDUSTRIES` order pairs with `t.services.industries` **by index**, so both locale
    arrays were reordered with it. Verified ES order:
    `Agencias y marketing, Pequeños negocios, Recursos Humanos, Seguros, Bienes raíces,
    Despachos legales`.

**Sector coverage is now complete.** The first build left three services
(executive support, bookkeeping, process & workflow optimisation) in no sector,
described as a deliberate gap. The owner assigned all three to **small business**,
which is where they are actually bought. Coverage: small business 5 · agencies 3 ·
legal 1 · HR 1 · insurance 1 · real estate 1 = **12 of 12**.

- A test now asserts full coverage (`covers every service with at least one sector`),
  so a service added to `SERVICE_ANCHORS` without a sector fails the suite instead of
  silently disappearing from the band.
- **Card heights:** briefly set to content height, then reverted to equal-per-row on
  owner request — see the height note above. Order, not `items-start`, is what keeps the
  slack small.

- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
  **384/384** tests (4 new) · build succeeds · 0px overflow at 1440 and 375 ·
  **0 contrast failures across 156 text nodes** at both widths (final state) · ES renders
  (`Nuestros servicios`, `Diseñado para tu sector, no una lista genérica.`,
  `Pequeños negocios` … `Bienes raíces`).
- **Page height:** 4590px before this work → 5942px with both bands → **4775px** after
  the hero was removed (all at 1440).

### 2026-11-03 — /news index + article template rebuilt; article body was never styled

**Pre-existing production bug found and fixed.** `blog-post-content.tsx` styled the
post body with `prose prose-lg prose-headings:…`. `@tailwindcss/typography` is **not
installed** in this project — `package.json` carries only `tailwindcss` and
`@tailwindcss/postcss`. Those classes therefore generated **no CSS at all**, so every
published post on the live site rendered its body as raw browser defaults: Times-ish
serif fallback, default link blue, browser bullet indents, unstyled images. This was
not a redesign decision; the article body was simply unstyled.

- **Fix:** a `.mk-article` block in `app/globals.css` (in `@layer base`, so a utility
  class on a child still wins). It styles `h2/h3/h4`, `p`, `a`, `strong`, `em`,
  `ul`/`ol`/`li` + `::marker`, `blockquote`, `img`, `figure`/`figcaption`, `hr`,
  `code`, `pre`, and tables off the `--mk-*` tokens. Vertical rhythm comes from a
  single `.mk-article > * + *` rule rather than a margin on every element, so a body
  that opens with a heading cannot leave a gap above the first line.
- **No dependency added.** The typography plugin was deliberately *not* installed;
  ~90 lines of token-based CSS does the job and stays inside the marketing palette.

**Index layout: featured article + rule-separated rows, not a card grid.** Two reasons.
Home already owns the three-across card grid and `/services` was rejected for reading
as a Home clone; and only **two posts are published on live**, so a three-column grid
renders one card and one orphan gap. A featured article plus an editorial index reads
as deliberate at any count — two posts, six, or twenty. With two posts it is one
featured card and one row under a `MORE POSTS` label.

- **Featured cover fallback.** Posts without `featuredImage` originally fell back to a
  pale `bg-mk-accent-soft` block with the category initial at 20% brand. Measured at
  1440 that is a ~450 × 450 px near-empty mint rectangle — it reads as a missing
  asset. Replaced with a `bg-mk-brand-deep` panel, an accent blur glow, the initial at
  `clamp(5rem,11vw,8.5rem)` in `text-mk-accent/45`, and a hairline rule. The dark
  panel also gives the white content column real contrast.
- Rows are links in their entirety (`group` on the `Link`), so the whole line is a
  target rather than just the headline.
- LinkedIn CTA rebuilt as a bordered `bg-mk-white` button on a `bg-mk-paper` inset —
  the legacy `bg-linkedin` brand blue is not part of the marketing palette.

**Article template: full-width editorial.** Superseded 2026-11-06 — see *Editorial
article page* below. The body originally sat in
`rounded-(--mk-radius-lg) bg-mk-white px-6 py-10 shadow-(--mk-shadow-card)` over the
`paper` band, to separate reading text from page furniture; the owner read that card
as an article "in a frame" and asked for a whole-page editorial layout instead.

- Preserved unchanged: `demoteBodyH1`, `getTranslatedTitle` / `getTranslatedExcerpt` /
  `getTranslatedContent`, `AICitationReadiness`, `blogPostingJsonLd`, `revalidate = 300`,
  `generateStaticParams`, the slug-derived fallback metadata, and the not-found state.
- New i18n keys in **both** locales: `eyebrow`, `postCountLabel`, `readArticle`,
  `morePosts`, `byAuthor`.

- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
  **380/380** tests · build succeeds · 0px overflow at 1440 and 375 · 0 contrast
  failures across 48 text nodes at both widths (the only flagged node was the
  decorative, `aria-hidden` cover initial; raised from `/35` to `/45` anyway) · ES
  renders (`PERSPECTIVAS`, `3 publicaciones`, `Leer artículo`, `MÁS PUBLICACIONES`,
  Spanish dates) · empty state and not-found state both render.
- **Measured on a temporary preview route** (`/news/zz-preview`) rendering three mock
  posts, because local Firestore is unavailable and `/news` therefore always renders
  the empty state. The route was deleted before the final build; `.next/types` had to
  be regenerated by a fresh build before `tsc` went clean again.
- **Still unverified:** the two live posts have not been rendered against this template
  — their real `featuredImage`, `tags`, `author` and body HTML are unknown locally.
  Check both on live after deploy.

### 2026-11-03 — /pricing hero retitled; "Built into every plan" widened to six

- **Owner request:** change the hero title, and add real differentiators to
  "Built into every plan" — weekly meetings and reports, priority human response
  for email and phone — keeping the 5–7 day onboarding.
- **Hero title:** `"Simple plans. Nothing hidden."` → **"Priced in hours. Quoted
  in writing."** The old line sat too close to the retired "No setup fees. No
  hidden costs." claim; the new one states the actual model (you buy hours) and
  the actual promise (the figure is in writing), which is what reconciles the
  setup fee instead of hiding it. ES: `"Tarifas por horas. Cotización por
  escrito."`
- **Extras went from three to six.** Every item is grounded in copy that already
  existed, mostly the package feature lists:
  | # | Item | Grounded in |
  |---|---|---|
  | 1 | Priority response | `"Priority response"` (Starter), `"Priority support 24/7"` (Pro), `"Live chat and phone coverage"` |
  | 2 | Weekly reporting | `"Weekly progress reports"` (Starter), `"Advanced reporting & analytics"` (Pro) |
  | 3 | Onboarded in a week | existing `"5–7 business days"` (kept, owner approved) |
  | 4 | Works inside your tools | `humanLede` — "works inside your tools" |
  | 5 | Scope agreed in writing | kept; the honest replacement for "no setup fees" |
  | 6 | Move between plans | kept |
- **Wording caution — "weekly meetings" vs "weekly reports".** The user asked for
  meetings *and* reports. Starter's card promises **weekly progress reports** but
  `"Weekly sync meetings"` only appears on Professional. A blanket "weekly
  meetings" in a block headed "every plan" would have contradicted the card
  directly above it, so the item is **"Weekly reporting"**. If meetings should be
  universal, Starter's feature list needs the change too — not just this block.
- **Layout fixed while adding items.** The old `grid gap-px bg-mk-line` with
  `sm:first:pl-0` only aligned the first cell of the first row; from row two the
  left edge drifted 28px out of line with the `h3`. With six items that would have
  been visible on every desktop viewport. Replaced with one `border-t border-mk-line`
  rule per cell — the same pattern `/services` and the `/pricing` objections block
  use. Measured at 1440px: columns at 104 / 523 / 942, and row two at 104 / 523 /
  942 — `row2Aligned: true`.
- **Seventh false claim found and fixed.** `app/(marketing)/pricing/page.tsx`'s SEO
  description ended *"…and clear terms with no setup fees."* That is served to
  Google and social cards, so it was the most visible of the seven. Now reads
  "…and what you are not paying for."
- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/`
  warning) · 377/377 tests · build succeeds · 0px overflow at 1440 and 375 ·
  6 items in both locales · 0 contrast failures across 56 text nodes on `/pricing`.

### 2026-11-03 — "No setup fees" was false; section rebuilt around objections

- **Blocker reported by the owner:** *"here, we do have a setup fee."* Setup is
  quoted where a workflow needs it — it is not always free, and it is not always
  charged.
- **This was not one wrong sentence.** The claim was published in **six** places
  across both locales:
  | Location | Old copy |
  |---|---|
  | `pricing.termsTitle` | "No setup fees. No hidden costs." |
  | `pricing.termsItems[1]` | "No setup charges and no onboarding fees." |
  | `pricing.extras[0]` | "No setup fees — nothing is added at signing." |
  | `pricing.includedItems[4]` | "No setup fees and no onboarding charges" |
  | `faq` (EN) | *"Are there any setup fees?"* → **"No."** |
  | `faq` (ES) | *"¿Hay cargos de configuración?"* → **"No."** |
  The FAQ answer was the worst of them: it denied setup fees exist at all, in a
  direct question-and-answer. All six are corrected; `grep -rn "No setup fees|no
  setup charges|No hidden costs|No hay cargos" lib/i18n/` now returns nothing.
- **Why the section topic changed, not just the wording:** the section was called
  "The fine print" and led with a cost claim. But the owner's real intent was
  competitive positioning — *no AI answering, no per-minute billing, all-inclusive
  pricing, save on employer fees*. That is not fine print. Fine print now has its
  own quieter strip at the bottom, carrying the contractual facts only.
- **Six items, not four.** The owner's four, plus two that honesty required:
  | # | Item | Grounding |
  |---|---|---|
  | 1 | A person answers, not a bot | `heroProof: "100% human"`, `humanTitle: "Real people, not software"` |
  | 2 | No per-minute meters | plans are priced in hours (80 / 160 / custom) |
  | 3 | One plan, one invoice | `plansNote: "Hours are set by the plan you choose."` |
  | 4 | No employer overhead | no payroll tax / benefits / equipment / recruitment |
  | 5 | No hiring cycle | capacity moves by changing plan |
  | 6 | Setup is quoted, not sprung | replaces the false claim — states the fee plainly |
  Six is the ceiling: 3×2 on desktop, and a seventh would dilute.
- **Layout changed from `gap-px` grid to one rule per item.** The old
  `grid gap-px bg-white/10` + `sm:odd:pl-0` only aligns flush-left at exactly two
  columns; at three the left edge drifts 28px out of line with the `h2`. Each cell
  now carries `border-t border-white/15`, so alignment holds at any column count.
  Same pattern `/services` already uses.
- **Deliberately not claimed:** "no lock-in". The FAQ states an initial one-year
  commitment, so that claim would contradict us. The one-year term is stated in
  the fine-print strip instead.
- **Fine print strip: added, then removed on owner feedback.** It carried the
  one-year term, plan changes, and billing. Owner: *"remove the fine print no
  reason to add that, its negative, we dont need to say that."* Removed, along
  with `finePrintLabel` / `finePrintItems` in both locales so no dead keys remain.
  Nothing is lost: the FAQ already answers the term, plan changes, and payment
  methods — the strip was a second, gloomier copy of facts nobody was asking for
  at that point on the page. The section now ends on the six objections.
- **Verification:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/`
  warning) · 377/377 tests · build succeeds · 0px overflow at 1440 and 375 ·
  ES renders (`Lo que no estás pagando.`) · no false claim left in either locale ·
  0 contrast failures across 287 text nodes on `/pricing`, `/services`, `/about`,
  `/contact`, `/join` · `/pricing` section re-measured at 0 failures (14 nodes).
- **⚠️ Correction to a previous verification claim.** The contrast scanner had a
  second bug: it pre-filled the 1×1 canvas with white before sampling, so
  `rgba(0,0,0,0)` read back as **opaque white** and `bgOf()` stopped at the first
  transparent ancestor — every element resolved to a white background. On light
  pages that was accidentally right; on the dark `/pricing` section it reported 21
  false failures at ratio ≈1.05. The parser now samples on a transparent canvas so
  alpha survives. **Earlier "0 contrast failures" results were computed with the
  broken walker and are only trustworthy because those pages are light.** All five
  pages were re-measured with the corrected scanner.

### 2026-11-03 — /pricing mockup replaced with an hours panel

- **Owner request:** the mockup *"repeats what was just stated, add something with
  value"* — with PatLive as the reference.
- **What was wrong:** the right-hand `WindowFrame` in `Included` mapped
  `copy.includedItems` — the exact same array as the checklist beside it. It looked
  like product art but carried zero new information, and it was `aria-hidden` only
  because the duplication made it unreadable to assistive tech. Duplication, not
  decoration, was the defect.
- **Why not copy PatLive literally:** PatLive sells minutes, so a receptionist
  dashboard mockup answers *their* buyer's question. We sell **hours**, so the
  question a buyer actually has is *"what does 160 hours buy me?"* — and no page
  answered it. Answering that is worth more than a second-hand dashboard.
- **What shipped:** `HoursPanel` — a header row (`A month of hours` /
  `Professional · 160 hours`), one stacked proportional bar, a legend of four
  workstreams with their hours, and a footnote stating the split is illustrative
  and agreed in week one.
- **Data integrity:** the bar widths are computed from `hoursBreakdown`
  (`width: (hours / total) * 100%`), so segments always fill the bar and the
  numbers always match the widths — they cannot drift apart. Measured at 1440px:
  segments 139/116/116/93px in a 465px bar, summing to 464.66px (sub-pixel
  rounding only).
- **The hour split is a placeholder, not a published fact.** 48 + 40 + 40 + 32 =
  160 is illustrative and labelled as such on the page. It needs the owner to
  confirm or replace it before launch.
- **Accessibility correction:** the panel is no longer `aria-hidden`. It now carries
  information the checklist does not, so hiding it would have hidden real content.
  The bar has `role="img"` and `aria-label` (`Allocated: 160h` / `Asignadas: 160h`).
- **Retired keys:** `includedMockupTitle` in both locales (the panel's own headings
  replaced it). `includedMockupLabel` was kept and repointed from
  `your-plan.creedava.com` to `your-month.creedava.com`, which reads correctly for
  a monthly allocation.
- **Verified:** `tsc` clean · lint 0 errors (1 pre-existing `coverage/` warning) ·
  377/377 tests · build succeeds · 0px overflow at 1440 and 375 · 0 contrast
  failures across all 11 panel text nodes (canvas-pixel method) · ES renders
  (`Un mes de horas`, 0 overflow).

### 2026-11-03 — Service Packages split onto their own `/pricing` page

- **Owner request:** /services felt flat next to Home, and combining a service
  catalogue with pricing was the likely cause. Move the packages to a
  reintroduced Pricing tab, then borrow three *structural* ideas — extra benefits
  under the plans, an "every plan includes" block with a mockup, and a
  fine-print/benefits block — while keeping our own design language.
- **Why the split is right structurally, not just visually:** /services answers
  *what do you do*; pricing answers *how do I buy*. Combined, the catalogue read
  as a sales page and the plans sat buried under twelve service entries.
- **New route:** `app/(marketing)/pricing/page.tsx` (server, SEO + JSON-LD) and
  `pricing-content.tsx` (server, no client JS). Sections: hero → plans (`#plans`)
  → "built into every plan" → "every plan includes" + mockup → terms → closing.
  Built entirely from `primitives` + `WindowFrame`, so it is Home's vocabulary.
- **`/services` is now 3,990 px** (was 4,888) and contains no package markup.
  All twelve anchors untouched; the `Packages`/`PackageCard`/`Tick` components
  and the `Pill`/`SectionHeading` imports they needed were deleted, not orphaned.
- **Two constraints deliberately respected — both are corrections to the brief:**
  1. **No "no contract" claim.** The FAQ states an initial one-year commitment
     with 30 days' written notice after. A "no contract" section would have
     contradicted our own FAQ, so the block is titled **"No setup fees. No hidden
     costs."** and states the commitment plainly.
  2. **No prices.** The admin AI guardrails forbid publishing rates or "starting
     at $X"; packages are quoted per client. Cards carry hours only — verified no
     `$` figure appears anywhere in `<main>`.
- **Every new claim is traceable** to copy that already existed (package feature
  lists, or the FAQ: setup fees, one-year term, plan changes, payment methods,
  5–7 day onboarding). Nothing was invented.
- **Wiring:** `PACKAGES_ANCHOR` replaced by `PRICING_PATH`; Pricing added to the
  navbar and footer services column; sitemap entry at priority 0.9; the home
  closing CTA and all 7 admin AI prompt references repointed from
  `/services#packages` to `/pricing`; the pricing FAQ answer updated; /services
  metadata no longer advertises packages.
- **Verified:** no `$` figures, 4 JSON-LD blocks, 0 contrast failures, 0 px
  overflow at 1440 and 375, ES renders all four headings, navbar marks Pricing
  `aria-current="page"`, footer links to `/pricing`, sitemap lists it.
- `tsc` clean, lint 0 errors, 377/377 tests, build succeeds.

**Known pre-existing quirk (not introduced here, not fixed):** locale is stored in
`localStorage` but server components read the cookie, and `LanguageProvider` writes
the cookie only after mount. So the *first* visit after switching language renders
server copy in the previous language and corrects on the next load. Confirmed on
/pricing: first load showed an English `h1` with a Spanish navbar; a reload showed
both Spanish.

### 2026-11-03 — /services jump index removed (it stated the twelve twice)

- **Owner report:** the page named every service twice — once in the hero index,
  once in the directory. That is the exact duplication this redesign has been
  removing everywhere else (contact's hours, join's timezone note).
- **Fix:** the hero `<nav>` is gone. The hero is now the `h1` and its lede, full
  stop, and the directory follows immediately. Nothing else moved.
- **Why the index had no remaining job:** it existed to make twelve *stacked*
  entries navigable. At six rows of two the directory is short enough to scan
  without a table of contents, so the index was paying 293 px and a full repeat
  of the twelve titles for navigation the page no longer needed.
- **Anchors unaffected.** All twelve `article[id]` targets stay exactly where they
  were — the footer's deep links are the reason those ids exist, and they do not
  depend on an on-page index. Re-verified: all 12 still land at 96 px from the
  top, clear of the sticky header.
- **Measured:** page **5,182 → 4,888 px**; hero band 495 px. Directory unchanged
  at 2,106 px.
- Verified no service title is stated twice on the page (the only match flagged by
  the duplicate scan was "Legal Administrative Support" containing
  "Administrative Support" as a substring — a false positive, not a repeat).
- ES verified: no nav, 0 px overflow. Mobile unchanged at one column.
- `tsc` clean, lint 0 errors, 376/376 tests, build succeeds.

### 2026-11-03 — /services directory collapsed to two columns

- **Owner request:** the directory was "too big and too much"; two columns chosen.
- **Measured before deciding, and the obvious answer was wrong.** Each entry was
  exactly 240 px, but the 72 feature strings — the part that *feels* excessive —
  were only **52 px per entry** (22%), because they sat three across. **46% of
  every entry was whitespace** (`py-10` plus the section's own 112 px top padding,
  which stacked on the hero's 112 px bottom padding). Trimming content was
  therefore the weakest available lever: deleting all 72 features would have saved
  624 px of 3,103.
- **Layout:** `grid-cols-1 sm:grid-cols-2` with `gap-x-10 lg:gap-x-14`. The
  numeral left rail is gone — at ~548 px per entry there is no room for it — and
  the numeral now sits inline, baseline-aligned with the title.
- **Features stay one column, deliberately.** At 548 px a 2-up list gives ~274 px
  per cell, which wraps long strings ("Client intake and conflict-check data
  entry") onto two lines. 3 rows × 2 lines is exactly the height of 6 rows × 1
  line, so it buys nothing and costs legibility.
- **Padding stack fixed:** the directory is now `padding="none"` with only a
  bottom pad, because the hero's `lg:pb-28` already supplies the 112 px before the
  first entry. Previously the two Sections stacked into ~224 px of nothing.
- **Measured result (1440):** section **3,103 → 2,106 px (−32%)**; page
  **6,179 → 5,182 px**. Entries 240 → 347 px each, but 6 rows instead of 12.
  Rule alignment verified row by row: both items in every row share an identical
  top and height, so the horizontal rules stay continuous.
- **Mobile** stays one column (342 px) — there is no room for two at 375 px.
- **Spanish** holds the same two-column layout at the same 347 px max entry height.
- **Verified:** all 12 anchors land at exactly 96 px from the top, clear of the
  sticky header. 0 px overflow at 1440 and 375. 0 contrast failures.
- `tsc` clean, lint 0 errors, 376/376 tests, build succeeds.

### 2026-11-03 — /services pulled back onto the Home vocabulary

- **Owner correction:** the first pass at `/services` drifted. Home and About do
  not use hard-cornered rectangle cards; the services page did — square-cornered
  package boxes, square buttons, and an `--mk-navy-deep` CTA slab. It read as a
  third design language fighting the other two. Home is the reference.
- **The rule now written into the file header:** `/services` uses the shared
  `primitives` rather than hand-rolling its own surfaces.
  - `Section` bands own the rhythm and surface colour (paper → white → paper →
    paper-panel), matching Home's own tone sequence.
  - `SectionHeading` owns the packages heading.
  - Package cards are Home's soft cards: `rounded-(--mk-radius-lg)` (**24px**,
    measured — same value as Home's service cards), `border-mk-line`,
    `bg-mk-white`, hover lift plus `--mk-shadow-card`.
  - CTAs are `CtaLink` **pills** (`rounded-full`), not squares.
  - The closing panel is Home's `rounded-4xl bg-mk-brand-deep` slab with the two
    blurred accent glows, reused verbatim.
- **`--mk-navy-deep` removed from the page.** Navy is Contact's accent; Home and
  About both close on `--mk-brand-deep`. Verified: `mk-navy` no longer appears
  anywhere inside `<main>` on /services.
- **The featured package card** is `bg-mk-brand-deep` with an inner accent glow
  and `Pill onDark` for its badge — the same deep-surface treatment Home uses for
  its dark bands, not a filled rectangle.
- **Directory entries keep rules and numerals.** That is About's editorial
  device (`border-t` rows, numeral in a left rail), so the twelve services stay
  scannable without twelve cards. The two list idioms are deliberately distinct:
  hairline markers in the directory, Home's `TaskTick` in the package cards.
- **Kept:** all 12 anchor ids, `id="packages"`, `package_${id}_quote` analytics,
  both `/contact` destinations, Server Component with no client JS.
- **Verified:** 0 px overflow at 1440 and 375; `mk-navy` absent from `<main>`;
  card radius 24px and CTA radius fully rounded, both matching Home.
- `tsc` clean, lint 0 errors, 376/376 tests, build succeeds.

**Correction to earlier verification claims.** The contrast scanner used for
`/contact`, `/join` and the first `/services` pass parsed colours with a numeric
regex, which silently mis-read `oklab()` values — Tailwind v4 emits those for any
`/opacity` modifier. It reported **10 false failures** on the featured package
card and could equally have produced false passes elsewhere. Re-scanned all four
pages with canvas-pixel resolution (true sRGB compositing): **0 failures on
`/services`, `/contact`, `/join` and `/about`.** The earlier "0 contrast
failures" results stand, but they are now backed by a correct measurement.

### 2026-11-03 — /services rebuilt as a numbered directory

- **Owner request:** redesign the services page, flagged as the hardest page.
- **The problem was shape, not length.** Twelve services × six line items each is
  tabular data, but the page rendered it as twelve identical white `rounded-2xl`
  cards in a 3-column grid — 2,075 px of interchangeable boxes where nothing was
  findable. Two measured defects went with it: the `<h1>` read **"Service
  Packages"** while "Our Services" sat in an `<h2>` *below* it, and the whole page
  still used the pre-redesign palette (`gray-10`, `border-border`, `shadow-xl`,
  `primary-hover`, `text-success`) — zero `mk-*` tokens.
- **Fifth visual vocabulary — "directory".** A printed catalogue, not a card
  wall: a numbered jump index in the hero, then one rule-separated entry per
  service with its numeral in a left rail and the six features as a 3-up list
  under hairline markers. Deliberately no icons — `ServiceGlyph` already carries
  those marks on the homepage, so a second appearance reads as repetition rather
  than identification. The numerals do that job here.
- **Heading hierarchy fixed:** `h1` is now "Our Services", `h2` "Service
  Packages". Packages moved below the services so the page answers "what do you
  do" before "how much" — `id="packages"` still resolves from the footer and the
  hero index links to it.
- **Dead code deleted:** the page carried its own copy of the twelve icon paths,
  byte-identical to `lib/constants/service-glyphs.tsx`. Gone, not swapped — see
  open item 3.
- **Package cards:** equal height, no `md:scale-105`. That scale-up was the thing
  actively breaking column alignment; `flex-1` on the feature list now pushes all
  three CTAs onto a shared baseline whatever the feature count (7 / 8 / 8). The
  "popular" card is keyed off `"badge" in pkg` rather than a hardcoded `i === 1`,
  so the highlight follows the data instead of the array position.
- **No behaviour changed.** All 12 anchor ids, `id="packages"`, every
  `package_${id}_quote` analytics attribute and both `/contact` destinations are
  untouched. The page is still a Server Component with no client JS.
- **Verified:** 12 anchors present and each index link lands 96 px from the top —
  clear of the sticky header. `h1`/`h2` hierarchy correct. 0 contrast failures,
  0 px overflow at 1440 and 375, EN and ES both render.
- `tsc` clean, lint 0 errors, 376/376 tests, build succeeds.

### 2026-11-03 — /join service dropdown now mirrors /services

- **Owner report:** the booking form's "Service" list was missing the newer
  services. It was a hand-kept copy of seven labels in `lib/i18n/{en,es}.ts`
  (`join.services`) that had drifted from the twelve the /services page renders.
- **Fix:** the dropdown is now derived from `t.services.categories` — the same
  list /services and the footer read. Adding a category to the dictionary now
  updates the booking form automatically; there is no second list to remember.
- `join.services` is gone, replaced by a single `join.generalConsultation` key
  that supplies the leading "not decided yet" option and the form's default
  value, so the submitted default is unchanged.
- **Verified:** 13 options in EN and 13 in ES, both matching /services one-for-one.
  Submitting with "Insurance Processing" captured
  `service: "Insurance Processing"` in the `/api/booking` payload — the real
  category title, not a stale label. 0 px overflow in both locales.
- Added a drift guard to `__tests__/lib/constants/services.test.ts`: each
  locale's `services.categories` must have exactly `SERVICE_ANCHORS.length`
  entries. /services pairs the two **by index**, so a mismatch would silently
  drop a section id.

### 2026-11-03 — /join (Book a Consultation) rebuilt as an appointment ledger

- **Owner request:** continue from `/contact` to the booking page.
- **Files:** `page.tsx` (now a Server Component, holds the citation data),
  new `join-content.tsx` (client — the only JS on the route).
- **Fourth visual vocabulary — deliberately the inverse of `/contact`.** Contact
  is an open intake sheet with underline fields, so `/join` is enclosed: boxed
  hairline fields, squared controls, a calendar grid whose rules are drawn by
  `gap-px` over a line-coloured parent, and a bordered panel with **no shadow**
  (the old version was a `rounded-2xl shadow-lg` floating card). Both pages are
  forms, but they should not read as one template.
- **Booking behaviour is unchanged, and verified by capturing the request.** The
  payload is byte-identical to the previous implementation:
  `{firstName, lastName, email, phone, company, service, date, time, notes,
  source:"join-page"}`. `SLOTS_URL`, `generateFallbackSlots()` (so the form still
  works when the calendar integration is down), the `step` state machine,
  calendar-grid maths and `trackEvent` are all untouched.
- **Accessibility fixed in passing:** the notes `<label>` had no `htmlFor`, and
  the select relied on `aria-label` alone. Every control now has a real
  associated label — verified: 7 labels resolve (First Name, Last Name, Email,
  Phone, Company, Service, Notes).
- **Three self-inflicted defects caught and fixed during the build:**
  1. The success slip's eyebrow read "Your Details" — wrong on a confirmation
     page. Replaced with a solid brand bar as the ticket stub.
  2. `timezoneNote` appeared twice (hero and step 1) — the same duplication
     removed from `/contact`. Now only in the hero.
  3. A pointless `submitting ? copy.bookConsultation : copy.bookConsultation`
     ternary.
- **Real overflow bug found by measuring, then fixed:** at narrow widths the step
  rail's `whitespace-nowrap` labels pushed the page **33 px wider than the
  viewport**. Labels now wrap, the connector rule is `hidden sm:block`, and the
  rail uses `min-w-0`. Re-measured: **0 px overflow at 320 / 375 / 414 / 768 /
  1024 / 1440**.
- **Verified in both locales:** EN and ES render, 0 overflow, 0 contrast failures
  page-wide. The full flow (pick date → pick time → details → submit →
  confirmation) was exercised at 1440 and 375, with `/api/booking` intercepted so
  no real booking was created.
- `tsc` clean, lint 0 errors, 375/375 tests, build succeeds.

### 2026-11-03 — /contact rebuilt as an intake sheet

- **Owner request:** "lets start with the contact redesign", with the constraint
  "our form works so we want to keep it working".
- **Files:** `page.tsx` (now a Server Component), new `contact-content.tsx`
  (server), new `contact-form.tsx` (client). Only the form ships client JS now;
  the rest of the page renders as static HTML.
- **Third visual vocabulary, deliberately.** Contact is a transaction page, so it
  uses neither the homepage's cards/icon chips/pills nor About's editorial rules
  and atlas plate. Its own language is: underline fields with no box or fill, a
  letterhead detail block (label above value, no rules), process steps that open
  with a rule and end with the numeral, and one navy inset panel.
- **The brand blue appears once, as an inset.** The "Book a Consultation" panel
  is `--mk-navy-deep` rather than the previous `primary/5` tint. It is a small
  panel inside a white section, not a band, so it cannot stack against the navy
  footer.
- **Duplication caught and removed during the build.** The first draft showed
  business hours and response time twice — once in the hero strip, once in the
  detail rail. The rail now carries direct channels (email, phone) only, and the
  hero strip carries the two facts a visitor wants before writing. Verified:
  each string appears exactly once in the rendered page.
- **Form behaviour is unchanged, and verified.** Same endpoint (`/api/contact`),
  same JSON keys, same `source: "contact-page"`, same `trackEvent` call. Captured
  the actual request during a live run:
  `{firstName, lastName, email, phone, company, message, source}` — identical to
  the previous implementation. Success panel still renders "Message Sent!".
- **Accessibility contract kept.** The e2e suite asserts on accessible roles, so
  every field keeps a real `<label for>`; all five text fields, the textarea and
  the `/send|submit/i` button resolve to exactly one match each.
- **Fields are local, not the shared `Input`/`Textarea`.** Those are styled for
  the admin surface and are still used there. Overriding their classes from the
  outside would depend on Tailwind utility ordering, which is not a contract
  worth relying on. The local fields also need no per-field error/helper slots,
  so they are simpler than the shared ones rather than duplicates of them.
- **Zero i18n churn.** Every string already existed in `t.contact`, so `en.ts`
  and `es.ts` were not touched — no risk of the two locales drifting.
- **One latent bug fixed in passing:** the phone field label was hard-coded
  `"Phone"` in English; it now reads `t.contact.phoneLabel`, so it translates.
- **Measured:** 0 contrast failures at 1440 and 375, 0 px horizontal overflow at
  both. `tsc` clean, lint 0 errors, 375/375 tests, build succeeds.
- **Owner follow-up:** the info strip sat too close to the hero copy. Raised the
  gap above the rule from 40 → **64 px** (`pb-14 lg:pb-16`) and the in-cell
  padding from 20 → **32 px** (`pt-8`). Measured after: paragraph→rule 64 px,
  rule→label 33 px.
- **Second follow-up:** the cream surface ended flush against the white band, so
  the rule read as the section boundary. The hero section had no bottom padding
  at all. Added `pb-6 sm:pb-8 lg:pb-10` → **40 px** of cream below the last line
  on desktop (24 px on mobile). A first attempt at 96 px was rejected as too
  much; the point is a breathing gap, not a band.
- **Third follow-up:** the email address wrapped mid-word, orphaning its final
  "m" onto a second line. Cause was measured, not guessed: at `lg` the rail is
  389 px, minus `pl-10` leaves 349 px, and the old `sm:grid-cols-2` split that
  into ~158 px cells while `contact@creedava.com` renders 161 px wide. The two
  entries are now stacked in a single column, so each gets the full 349 px and
  both share one left edge. Verified single-line at 375 / 640 / 768 / 1024 /
  1280 / 1440 in **both locales** (Spanish labels are longer and still fit), with
  0 px horizontal overflow at every width.

### 2026-11-03 — world map: real geometry, generated from the bundled atlas

- **Owner feedback:** "the shape of belize is still wrong", then "can you add the
  islands too", then "still forgetting the reef which give the real look with
  the atolls".
- **Root cause 1 — the outline was hand-drawn.** The previous `BELIZE_PATH` was a
  17-point approximation that was not the country's shape. Replaced with the
  **Natural Earth 10m** country boundary (314 vertices, simplified to 143).
- **Root cause 2 — the land was hand-drawn too.** The whole `LAND_PATHS` array
  (~20 KB, 110 paths) had been hand-transcribed. It is now **generated** from
  `public/world-atlas-110m.json` — the same Natural Earth TopoJSON the admin map
  already reads at runtime — by the new
  `scripts/build-world-map-paths.mjs`, which emits
  `components/ui/world-map-land.ts` (119 paths, 33 KB, marked GENERATED).
  Nothing is hand-traced now; the plate matches real coastlines.
- **Projection, derived rather than assumed:** `x = (lon + 180) × (1000/360)`,
  `y = (90 − lat) × (1000/360)`. Confirmed by mapping Belize's real bounds
  (89.24°W–88.08°W, 15.88°N–18.49°N) onto x 252.1–255.3 / y 198.6–205.9 — the
  same box the old outline occupied. Only the *shape* was ever wrong.
- **Why the inset exists:** Belize is 3.2 × 7.2 units on this plate, i.e. about
  3 × 7 px at render width. No outline is legible at that size, so a magnified
  panel repeats the *same* path at 13× rather than drawing a second, divergent
  one. Stroke width inside the panel is divided by the scale (`0.5 / 13`) or it
  renders 13× too thick.
- **Which islands are included, verified by listing all 10 rings:** Ambergris
  Caye (`#2`), Caye Caulker (`#7`), **Turneffe Atoll (`#1`)** and **Lighthouse
  Reef (`#4`)** are present in the country polygon and now drawn (9 caye rings
  total).
- **Glover's Reef is absent, and that is a data limitation, not an oversight.**
  It is in none of the reachable sources: not the Belize country polygon, not
  `ne_10m_minor_islands`, not `ne_10m_land`. `ne_10m_reefs` only carries 4
  sparse `LineString`s in Belize waters, not atoll outlines. An OpenStreetMap
  attempt returned **HTTP 502 — Overpass at capacity**. Owner decision:
  **ship Turneffe + Lighthouse now, retry OSM later**; no schematic ring was
  invented.
- **Atoll legibility is a scale limit, not a missing shape.** Measured at 13×:
  Turneffe 5.7 × 9.6 px, Lighthouse 1.5 × 3.9 px. At 26× Turneffe reads
  (11.4 × 19.3 px) but Lighthouse is still a speck and the mainland no longer
  fits the panel. Owner chose to **keep 13×**, so the atolls read as marks
  rather than rings.
- **Also added:** `prefers-reduced-motion` guard on the pulse ring (it animated
  unconditionally before).
- **Corrected in passing:** a code comment had claimed Glover's Reef was
  included. It was not. The comment now states exactly what is drawn and why.
- `tsc` clean, lint 0 errors, 375/375 tests pass, build succeeds.

### 2026-11-03 — footer text: two tiers instead of one flat white

- **Owner question after the previous change:** "is it too bright now?"
- **Diagnosis: not too bright — too flat.** All 24 footer text nodes were
  `rgb(247,247,242)`, and only font-weight varied. At 24 items, uniform maximum
  brightness competes with the page content above it. The green panel works at
  full brightness because it has one headline and one short line; a footer does
  not. 15.66:1 itself was never the problem.
- **Three variants rendered for comparison** (injected via a probe stylesheet on
  the live footer): A all paper (15.66:1), B two-tier (11.47:1 / 15.66:1),
  C all neutral (12.91:1). Owner chose **B**.
- **Applied B:** tagline and copyright → new token `--mk-paper-mute` `#CFD6DD`;
  column headings, all links and the LinkedIn icon stay `--mk-paper`.
- **Why a new token rather than hardcoding:** `--mk-paper-mute` is a neutral grey
  measured against *both* dark surfaces — 11.5:1 on `--mk-navy-deep` and 11.5:1
  on `--mk-brand-deep` — so it works on the green panels too, not just the
  footer. It is deliberately not a tint of either band colour, which is what made
  the old `#A8BCD8` look washed out.
- **Measured:** footer now has exactly two text colours —
  `rgb(207,214,221)` ×2 (tagline, copyright) and `rgb(247,247,242)` ×22.
  **0 contrast failures** page-wide. 0 px overflow at 375 px.
- `tsc` clean, lint 0 errors, 375/375 tests pass.

### 2026-11-03 — footer text unfaded: one near-white, no blue tint

- **Owner feedback:** "i like how the bright white looks on the green … on the
  footer we need to use same white font … we are fading our font on the footer
  and hard to see anyway."
- **Cause:** the footer's text was spread across three blue-tinted tokens —
  `--mk-navy-mute` (`#A8BCD8`) for body and links, `--mk-navy-line` (`#C6D7EE`)
  for column headings. Both were tinted toward navy rather than being neutral
  light, so the footer read faded next to the green panel's crisp `--mk-paper`.
- **Fix:** every footer text node — tagline, column headings, links, copyright,
  LinkedIn icon — is now `text-mk-paper` (`#F7F7F2`), identical to the text on
  the green CTA panel. Hierarchy is carried by weight and case (bold uppercase
  headings vs regular body), not by fading colour. Divider is now
  `border-mk-paper/15` instead of a navy tint.
- **Token removed:** `--mk-navy-mute` deleted from `:root` and `@theme inline` —
  nothing uses it any more. The About navy band switched to `text-mk-paper/70`
  for its small uppercase labels, which is neutral rather than blue-tinted.
- **Measured:** footer text on navy-deep went from **8.7:1** to **15.66:1**.
  A scripted scan reports exactly **one** unique text colour across the entire
  footer, and **0 contrast failures** page-wide.
- `tsc` clean, lint 0 errors, 375/375 tests pass, verified on both `/` and
  `/about`.

### 2026-11-03 — blue/green clash: diagnosed as equal weight, fixed by band stacking

- **Owner feedback:** the blue "is still clashing heavily with the green", then
  floated two ideas — use blue *more* so it isn't a surprise, or use a gradient.
- **Diagnosis (measured, HSL):** hue distance is **not** the problem — navy
  `#002D72` and brand green `#005148` are 43° apart, a normal pairing. The
  problem is **equal weight**:

  | Colour | Saturation | Lightness |
  | --- | --- | --- |
  | `#005148` brand green | 100% | 16% |
  | `#002D72` navy | 100% | 22% |
  | `#001B47` navy-deep | 100% | 14% |
  | `#06211D` green-deep | 69% | 8% |

  Four fully saturated, equally dark colours competing for the same role. Adding
  more blue at the same weight just means more competition.
- **Gradient rejected with evidence:** green→navy interpolates through **cyan**
  (~`#0B3A4A` at the 45% stop), which is neither colour. Rendered as Option D in
  a side-by-side comparison so the owner could see it rather than take it on
  trust. *(Superseded 2026-11-03: this applies only to a **linear** green→navy
  ramp. The footer now uses corner radials over a navy base, which puts navy in
  charge and measures 88% blue — see the newest log entry above.)*
- **Options offered:** A demote blue to slate `#2C4055` (saturation 100%→32%);
  B substitute warm charcoal `#2A211A` + sand `#C9A227`; C flip to navy-dominant;
  D keep colours and fix stacking only.
- **Owner chose D + fix stacking.** Palette unchanged.
- **The actual bug:** About stacked **navy band → green band → navy footer** —
  three dark blocks edge to edge. Any two dark colours clash in that arrangement.
  Homepage had no adjacent dark pairs (verified by scanning computed background
  luminance of every section).
- **Fix:** navy Purpose band moved *before* Values so a light section follows it,
  and the green CTA converted from a full-bleed band to an **inset panel** on a
  paper section, so paper separates it from the navy footer.
- **Verified:** scripted luminance scan of every section + footer reports
  **0 adjacent dark pairs** on `/about` (was 2). **0 contrast failures**
  (4.5:1 body / 3:1 large). Both locales render all sections. `tsc` clean,
  lint 0 errors, 375/375 tests pass.
- **Rule recorded:** never place two dark bands edge to edge, regardless of hue.
  A light section must always separate them.

### 2026-11-03 — About page rebuilt as an editorial page (not a homepage clone)

- **Owner feedback that drove this:** the first About attempt was rejected —
  *"it's the same as the home page … I thought you were going to make a
  refreshing new design."* That was accurate. The first version reused the
  homepage's hero skeleton, its chat artifact, its pill buttons and its
  rounded-card grids, so it read as a template fill rather than a design.
- **Decision: About gets its own visual vocabulary.** The two pages must not
  share components that carry visual identity.

| | Homepage | About |
| --- | --- | --- |
| Section labels | `Eyebrow` — dot + uppercase | `Label` — hairline rule + uppercase |
| Buttons | `CtaLink` — rounded pill | `AboutButton` — squared `rounded-lg` |
| Emphasis | icon chips in rounded tiles | zero-padded numerals (`01`, `02`) |
| Cards | rounded, bordered, shadowed | ruled rows / hairline-divided grid |
| Imagery | product artifacts (queue, inbox, calendar, chat) | the atlas plate |
| Closing CTA | rounded floating panel | full-bleed band |

- **Structure:** hero (statement + ruled fact strip) → **atlas plate** → Why
  Belize (label left, numbered rule list right) → How we work (4 ruled columns
  with top rules) → Values (hairline-divided 2×2, no icons) → Mission & Vision
  (navy band as large pull-quote statements) → full-bleed closing band.
- **Map placement:** the owner chose to move the map out of the hero side
  column and make it the page's opening image. It is now a full-width plate
  between the hero and "Why Belize", with a ruled caption
  (`Belize · Central America` / `UTC−6 · English and Spanish`).
- **Map re-skin** (`components/ui/world-map.tsx`): the Belize highlight default
  was hard-coded **red `#DC2626`**, a colour used nowhere else in the brand.
  Now `#005148` (brand green, 8.6:1) with continents `#002D72` (navy, the data
  layer) at `opacity 0.28` — up from `0.15`, which was too faint to read.
- **Crop experiment rejected:** `preserveAspectRatio="xMidYMid slice"` in a
  340px band cut Belize out of frame entirely. Reverted to the full plate,
  width-constrained (`max-w-5xl`).
- **Server Component now.** The page was `"use client"` with `useTranslation()`.
  It is now a Server Component taking `t` from `getDictionary()`, matching the
  homepage, and imports `WorldMap` directly — `next/dynamic` with `ssr: false`
  is not permitted in Server Components and only cost a client download.
- **Copy:** H1 changed from the label "About CreedaVA" to a statement
  (`One country. Two languages. / Your whole back office.`). The duplicated hero
  paragraphs were merged — both previously said Belize → bilingual → crossroads.
  Existing Mission/Vision/Values/Approach wording was kept as the owner
  instructed; Approach gained a 4-item standards list, Values kept all four.
- **Deliberately no timeline.** The owner offered no milestones, and inventing
  company history was not acceptable, so no dated events were fabricated.
- **Verified:** 0 contrast failures across the whole page (automated pass, 4.5:1
  body / 3:1 large), 0 px overflow at 375 and 1440, both locales render the new
  copy (`Un país. Dos idiomas.` / `One country. Two languages.`), `tsc` clean,
  lint 0 errors, 375/375 tests pass.
- The About page's dark band is now `--mk-navy-deep`, the same token as the
  footer, which resolves the two-different-navies mismatch.

### 2026-11-03 — footer migrated off the legacy palette onto the marketing tokens

- **Symptom the owner spotted:** the footer did not match the redesigned pages.
- **Cause:** `components/layout/footer.tsx` was never touched by the redesign. It
  still used `bg-footer-bg` (`--footer-bg: #1B2A4A`, a slate blue-grey) and the
  legacy `--gray-40`/`--gray-50` text ramp, so it sat outside the `--mk-*` system
  entirely.
- **Fix:** `bg-mk-navy-deep`, links `text-mk-navy-mute` → `hover:text-mk-accent`,
  column headings `text-mk-navy-line`, divider `border-mk-navy-line/20`, body
  `text-mk-paper`. New token `--mk-navy-mute` (`#A8BCD8`, 8.7:1 on navy-deep).
- This is the first **large** blue surface on the site, which is what "I don't see
  much blue" needed — navy on small chrome was too quiet to register.
- Verified: footer computed `rgb(0,27,71)`; **0 contrast failures** in an automated
  pass over every footer text node; 0 px overflow at 375 px. `tsc` clean, lint 0
  errors, 375/375 tests pass.
- ⚠️ **`--footer-bg` is NOT dead yet.** `app/(marketing)/about/about-content.tsx:73`
  still uses `bg-footer-bg` for its Vision band (renders `rgb(27,42,74)`). Left
  alone deliberately — About is outside the homepage scope. **These two dark bands
  now differ slightly** and should be unified when About gets redesigned.
- Note for future token work: the site audit (`FULL_SITE_AUDIT_2026-11.md` A3)
  records that `--gray-50` could not be darkened globally *because* the footer
  depended on it being light. The footer no longer uses `--gray-*` at all, so that
  constraint is now lifted.

### 2026-11-03 — brand blue brought back (navy ink + navy software layer)

- **Ask:** the redesign had dropped the blue entirely; the brand is teal **and**
  blue. Keep it present without letting the two clash.
- **Diagnosis:** blue was never missing from the palette — it had no *job*. Green
  held ink, fill and accent simultaneously, so a blue accent had nothing left to
  do and would have clashed. Blue is `#002D72`, already in the codebase as
  `--foreground` / `--gray-100`.
- **A — navy ink.** `--mk-ink` `#0A1F1C` → `#0B2135`, `--mk-ink-soft` `#37474A` →
  `#2C4460`, `--mk-ink-mute` `#5B6B6D` → `#566B85`. Contrast moved 15.9→15.2,
  9.0→9.3, 5.2→5.1 on paper — no accessibility loss. `--mk-line` /
  `--mk-line-strong` also de-greened (`#E1E2D9`→`#E2E2DE`, `#CFD2C6`→`#CFD0CA`)
  so the structure stops reading green too. Shadows re-cast from green-black to
  navy-black.
- **B — navy software layer.** Added `--mk-navy`, `--mk-navy-deep`,
  `--mk-navy-soft`, `--mk-navy-line` and mapped them into `@theme inline`. Applied
  to the window URL chip (`WindowFrame`), the inbox icon, the work-queue metric
  icon, and the calendar day + booked chip.
- **Rejected:** the status pill (`Disponible`) in navy. The chat panel says
  `En línea` in green; two colours for one presence state read as two different
  states. Presence stayed green in both places — green-online is a universal
  convention.
- **Rejected:** a navy dark band (`--mk-navy-deep` as a section background).
  Large navy and large green side by side is exactly the clash to avoid.
- `/admin` untouched — it reads `--primary` / `--gray-*`, not `--mk-*`.
- **Verified** on a fresh production build (port 3100), 1440 and 375 px:
  computed `--mk-ink` = `#0b2135`, `--mk-navy` = `#002d72`; 2 navy fills + 3
  navy-tint surfaces on the homepage; **0 contrast failures** from a full
  automated pass over every text node (4.5:1 body / 3:1 large); 0 px overflow.
  `tsc` clean, lint 0 errors, 375/375 tests pass.
- ⚠️ **Second verification trap hit here.** `pkill -f "next start -p 3100"` and
  `pgrep -af "next start -p 3100"` both match nothing — the real process is named
  **`next-server`**. An orphaned server kept serving the old CSS and the browser
  reported the stale green-black ink. Use
  `ss -ltnp | grep :3100` → `kill <pid>`, then confirm the port is free before
  trusting any rendered check.

### 2026-11-03 — naming hierarchy rolled out (Creeda / Creeda Virtual Assistants / CreedaVA)

- **Ask:** use "Creeda" independently, introduce "Creeda Virtual Assistants", keep
  "CreedaVA" as the brand mark.
- Body copy switched per the table above; 8 strings in `lib/i18n/en.ts` and 8 in
  `lib/i18n/es.ts` changed. Nothing else was touched.
- JSON-LD now matches the copy instead of contradicting it:
  - `lib/utils/structured-data.ts` — `ORG_NAME` is the full name and a new
    `ORG_ALTERNATE_NAMES = ["CreedaVA", "Creeda"]` is emitted as `alternateName`
    on every `Organization` node.
  - `app/(marketing)/layout.tsx` — same `name` / `alternateName` pair.
  - This fixed a real bug: after the copy change the homepage was emitting two
    `Organization` nodes with **different** names (`CreedaVA` from
    `websiteJsonLd().publisher`, the full name from the layout). Both now agree.
  - 3 assertions in `__tests__/lib/utils/structured-data.test.ts` updated to the new
    name.
- **Deliberately left on "CreedaVA":** `app/(marketing)/terms/page.tsx` and
  `privacy/page.tsx` (legal text needs owner/legal review, not a copy tweak),
  `app/layout.tsx` title/description/keywords, `lib/firebase/seo.ts` `SITE_NAME`,
  `today.creedava.com` and `creedava · messages` mockup chrome, and all
  `@creedava.com` addresses.
- Verified on a fresh production build (port 3100), both locales:
  `Creeda Virtual Assistants gives your business…` / `Creeda Virtual Assistants te da
  a tu negocio…` in the hero, `How is Creeda different…` / `¿Cómo es Creeda
  diferente…` in the FAQ, full-name footer copyright in both, `Founded in 2023,
  Creeda Virtual Assistants (CreedaVA)` on About. Both `Organization` nodes on `/`
  report `Creeda Virtual Assistants` + `alternateName`. 0 px overflow at 375 and
  1440. `tsc` clean, lint 0 errors, 375/375 tests pass.
- ⚠️ **Verification trap hit here:** `pkill -f "next start -p 3100"` did not free the
  port, the replacement server died with `EADDRINUSE`, and the first "verified"
  read came from a stale build still serving old JSON-LD. Always
  `grep -c EADDRINUSE` the server log before trusting a rendered check.

### 2026-11-03 — "12 service categories" stat replaced with "1 flat monthly fee"

- **Why:** "12" capped the offering. CreedaVA also builds custom scopes, so a fixed
  catalogue count contradicts the sales motion.
- Stat slot 1 changed `12 / Service Categories` → `1 / Flat Monthly Fee`, matching the
  comparison card's "One flat monthly fee — no payroll tax, W-2, 1099 or benefits admin".
- `home.stats.serviceCategories` renamed to `home.stats.flatFee` (both locales);
  `STAT_KEYS` in `components/marketing/home/proof.tsx` updated to match.
- CTA `See all 12 services` → `See all services` (same cap concern).
- `DEFAULT_STAT_VALUES` / `DEFAULT_STATS` changed to `["1", "3", "EN/ES", "5–7"]`.

> ✅ **RESOLVED 2026-11-03 — Firestore override removed.**
> The owner approved deleting it. `app/(marketing)/page.tsx` no longer imports
> `unstable_cache`, `adminDb` or `canUseAdminDb` for stats and no longer reads
> `settings/homepage-stats`. `DEFAULT_STAT_VALUES` is now exported from
> `app/(marketing)/home-content.tsx` and used directly by both the page and
> `HomeContent`, so there is one source of truth and no DB shadowing.
>
> Verified on a fresh production build (port 3100): the band renders
> `1 / Flat Monthly Fee`, `3 / Support Plans`, `EN/ES / Bilingual Support`,
> `5–7 / Days to Onboard` at both 1440px and 375px, 0 px overflow.
>
> **Leftover:** the `settings/homepage-stats` Firestore document still exists but is
> now inert. It can be deleted from the Firebase console at leisure — nothing reads
> it. Do not re-add a read for it without an admin UI and a schema guard that keeps
> label and value in sync.

### 2026-11-03 — featured services expanded to the specialist verticals

- Grid went **4 → 6 cards**, `sm:grid-cols-2` → `sm:grid-cols-2 lg:grid-cols-3`
  (3 × 2 on desktop). Featured set is now:
  `administrative`, `executive`, `legal`, `customer`, `insurance`, `real-estate`.
- **Why:** the original four were all "universal" services, which made CreedaVA read
  as a generic VA agency. The owner's differentiators are the specialist verticals
  — executive/C-suite, legal, insurance, real estate — where a bilingual
  Belize-based team is hardest to replace. Administrative and Customer Service stay
  as the universal on-ramps.
- Lede rewritten to carry the positioning: "Six of the twelve things we handle.
  Two that nearly every business needs, and four where our bilingual specialists
  go deepest."
- All six task lists are copied verbatim from the existing
  `services.categories[].features` — no new claims.
- **Measured:** desktop section `1273px → 1322px` (**+49px**) because it went
  wider, not taller; 6 equal cards at 365px in 3 × 2. Mobile stacks to 6 cards,
  section `1986px → 2813px`, now **22% of a 12,825px mobile page**.
- Re-verified: `tsc` clean, 375/375 tests, build compiles, 0 px overflow at
  375 / 1440.

### 2026-11-03 — comparison card + FAQ hours claim corrected

- **Comparison card, "Work with CreedaVA"**: removed "Hours adjust up or down
  inside your plan" — **the claim was untrue**. Replaced with
  "One flat monthly fee — no payroll tax, W-2, 1099 or benefits admin".
- **"Hire in-house" column** gained "Employer payroll tax, W-2 and 1099 filings,
  workers' comp" so the flat fee reads as a contrast rather than a boast.
- **"Do it yourself"** reworded from "Evenings and weekends disappear into admin"
  to "Your own hours are the ceiling on what the business can take on" — states the
  constraint without criticising the reader.
- **Result lines** are now positive throughout. CreedaVA reads
  "support and a team you can afford." (was "support you can afford before you
  need a team").
- **FAQ `minimum commitment` answer corrected in both locales** (`en.ts` ~557,
  `es.ts` ~559). Truth per owner: hours are fixed by the plan; clients **move
  between plans** (Starter 80h → Professional 160h → Enterprise), they do not
  scale hours inside one. New wording: "you can move up or down between plans —
  hours are set by the plan you are on, not adjusted within it." This answer is
  shared by `/` and `/faq`.
- Plan hours confirmed current: Starter 80 h/month, Professional 160 h/month.
- Re-verified: `tsc` clean, 375/375 tests, build compiles, cards equal-height at
  305px desktop / stacked 328px mobile, FAQ JSON-LD matches the visible answer.

### 2026-11-03 — hero badge removed, service grid curated

- **Removed** the hero badge pill (`home.heroBadge`, both locales). Owner feedback:
  decorative, reads as generic AI-generated. `<h1>` is now the first element.
- **Curated the service grid from 12 cards to 4** — one per family:
  `administrative`, `customer`, `bookkeeping`, `real-estate`. Each card gained a
  "What we handle" list of three sample tasks, taken verbatim from the existing
  `services.categories[].features` so no new claims were introduced.
  `home.serviceGroups` was deleted; `home.featuredServiceTasks` replaces it.
- Rationale: the homepage was answering "what do we do" three times — counter band
  ("12 Service Categories"), the 12-card grid, and the hand-off picker. `/services`
  is now the only complete catalogue; the homepage links out with
  "See all 12 services".
- **Measured effect (desktop 1440):** service section `1538px → 1273px`
  (**−265px**, not the ~900px first estimated — richer per-card content ate most
  of the saving). The real gain is removing the duplication, not page length.
- Re-verified: `tsc` clean, lint 0 errors, 375/375 tests, build success,
  0 px overflow at 375 / 1440, no contrast failures in the section.

### 2026-11-04 — footer changed from navy to green (`--mk-brand-deep`)

Supersedes the earlier navy-footer decision. Owner objection: *"most pages dont
have any blue. Which makes the footer a stray."* The complaint was measured before
acting, by counting painted blocks per route:

| Family | Routes carrying it |
|---|---|
| Green (`--mk-brand` / `-deep`) | `/`, `/pricing`, `/about`, `/services`, `/faq` — **5 of 11** |
| Navy (`--mk-navy*`) | `/about`, `/contact` — **2 of 11** |
| Neither (paper/white only) | `/news`, `/join`, `/privacy`, `/terms`, `/forum` — 5 of 11 |

So on 9 of 11 pages the navy footer was the **first and often only blue surface** —
a stray cap rather than a conclusion. Green already closed `/`, `/pricing`,
`/services` and `/faq` via the `bg-mk-brand-deep` CTA panel, so moving the footer to
the same surface makes every page end in one green family. Blue is now only where
the design deliberately introduces it: the `/about` Purpose band and the `/contact`
details rail.

- `components/layout/footer.tsx`: `bg-mk-navy-deep` → `bg-mk-brand-deep`; the two
  blooms `bg-mk-navy-bright/25` + `/15` → `bg-mk-accent/10` + `/6`, matching every
  other green band (a blue tint on a green ground would read as haze, not light).
- **Measured surface:** sampled 100% green hue, 0% blue; flat base `rgb(6,33,29)`.
- **Measured contrast** (blooms live, alpha-composited, canvas-resolved):

  | Text | Min ratio across 11 routes × 2 widths | Needs |
  |---|---|---|
  | `--mk-paper` | 15.72:1 | 4.5 |
  | `--mk-paper-mute` | 11.52:1 | 4.5 |
  | `--mk-accent` | 9.57:1 | 3.0 |

  All better than the navy equivalent it replaced (11.64 / 8.53 / 7.09).
- **Seam check:** the block directly above the footer is the white
  `border-t border-mk-line bg-mk-white py-8` strip on every route (paper on
  `/faq`), so the green CTA panel and green footer never touch — the
  "never place two dark bands edge to edge" rule still holds.
- **Verified:** `tsc` clean · lint 0 errors · **381/381** tests · build success ·
  0 px overflow and exactly one `h1` per route at 1440 and 375 · no heading-level
  skips · no JS errors · **275 footer text nodes, 0 contrast failures** (11 routes ×
  2 widths).

### 2026-11-04 — blue eyebrow rule: attempted, rejected by owner

Tried making the 1px x 32px rule in `Eyebrow` blue (`bg-mk-navy` on light bands,
`bg-mk-navy-bright` on dark) so brand blue would be present site-wide after the
footer went green. **Owner: "that looks stupid" - reverted to `bg-mk-line-strong`
/ `bg-white/25`.** Do not re-propose recolouring hairlines: a blue tick next to a
grey label reads as a rendering artefact, not as an accent.

Recorded because the reach was also wrong: the eyebrow exists on only **4 of 11**
routes (`/`, `/about`, `/services`, `/pricing`), not all of them.

Four comments invalidated by the green footer were corrected in the same session
and are kept: `services-content.tsx` ("Navy is deliberately absent"),
`about-content.tsx` ("matches the footer"), `contact-content.tsx` and
`faq-content.tsx` (both called the footer navy).

### 2026-11-04 — /pricing terms band switched to navy

Owner: *"what if we made this section blue like in the about section so it matches,
plus we get more blue."* The `Terms` band ("What you're not paying for.") was the
page's only `tone="deep"` section; it is now `tone="navy"` and reuses About's
Purpose-band recipe exactly.

- `components/marketing/primitives.tsx`: added a `navy` member to `MarketingTone`
  and `TONE_CLASSES` (`bg-mk-navy-deep text-mk-paper`). Adding a tone was the right
  lever — passing `bg-mk-navy-deep` through `className` would have left both
  `bg-mk-brand-deep` and `bg-mk-navy-deep` on the element, and the winner would have
  depended on Tailwind's stylesheet order, not on the class attribute.
- `pricing-content.tsx`: `Terms` now uses two blooms with About's values —
  `bg-mk-navy-bright/25` top-right (`420px`) and `/15` bottom-left (`380px`),
  replacing the single `bg-mk-accent/10` (`h-95 w-95`) green tint. A green bloom on
  a navy ground reads as haze, not light.
- **Verified identical to About:** both bands resolve to `rgb(0,27,71)` with
  byte-identical bloom class strings and computed `oklab(…/0.25)` + `(…/0.15)`.
  Padding differs by design (`112px` vs About's `128px`) because each follows its
  own page rhythm.
- **Contrast:** 15 text nodes in the band, **0 failures**; worst case is the
  11 px eyebrow label at **8.13:1** (needs 4.5). Body copy and `border-white/15`
  rules are unchanged and read the same as they did on green.
- **Adjacency:** `paper → paper → paper → navy → paper+green slab → green footer`,
  so the navy band is bracketed by paper and never sits edge to edge with the
  green closing slab.
- Page carries exactly one navy band at 1440 / 375 / 1920, 0 px overflow, one `h1`.
- **Blue now appears on three routes:** `/about` (Purpose), `/pricing` (Terms) and
  `/contact` (details rail inset). The rest still have none.
- Verified: `tsc` clean · lint 0 errors · **381/381** tests · build success ·
  11 routes 0 px overflow and one `h1` at 1440 and 375.

### 2026-11-04 — hours panel: the grey fourth slice is blue

The `/pricing` hours panel stacks four categories into one bar. The fourth
("Projects & reporting") was `bg-mk-line-strong` — a grey that read as *leftover
space* rather than as a category, which is the one thing a proportion bar must not
imply. It is now `bg-mk-navy-bright`, the bright blue rather than `--mk-navy`
because the legend dot is 8 px and a deep navy at that size reads as near-black;
the point is that the reader sees blue.

- One change reaches both surfaces: the bar segments and the legend dots both come
  from the `SEGMENT_TONE` array, so they cannot drift apart.
- Measured segments at 1440: `rgb(0,81,72)` 30% · `rgb(0,122,109)` 25% ·
  `rgb(63,217,192)` 25% · **`rgb(46,111,212)` 20%**; the four legend dots resolve to
  the same four values in the same order.
- `bg-mk-line-strong` no longer appears in the panel — verified 0 grey segments at
  1440 / 375 / 1920, 0 px overflow, one `h1` on the page.
- Verified: `tsc` clean · lint 0 errors · **381/381** tests · build success.

### 2026-11-04 — home service grid deleted, page re-sequenced

Owner: *"lets get rid of this section and reorganize our home page, this is a huge
section comming off."* The `section#services` grid (6 cards, **measured 1316 px** at
1440) was deleted outright, not shrunk.

- `components/marketing/home/services.tsx` deleted; `HomeServices` removed from
  `app/(marketing)/home-content.tsx`.
- `home.servicesEyebrow`, `servicesTitle`, `servicesLede`, `featuredServicesLabel`,
  `featuredServiceTasks`, `serviceLinkLabel`, `servicesCta` deleted from **both**
  locales — they had no other consumer (grep-verified before removal).
- Re-sequenced so the page still argues in order after the deletion:
  hero → counter band → **how it works** → **comparison** → day-in-life → human →
  hand-off picker → FAQ → closing CTA. Comparison moved below the process because
  "why not the alternatives" only lands after the visitor knows what the thing is.
  Tones still alternate paper/navy/white with no two adjacent repeats.
- Internal linking to `/services` was **not** lost: navbar keeps its 2 links and the
  footer still lists all 12 anchors (measured at 375: 14 `/services*` hrefs).
- **Measured after (1440):** page `7843 → 6527 px` (derived: the 1316 px section is
  gone and nothing else changed height); 0 px horizontal overflow.
- **Measured after (375):** 10089 px, 0 px overflow.
- Verified: `tsc` clean · eslint clean on the 3 changed files · 18/18 i18n +
  constants tests.

### 2026-11-04 — home re-sequenced again: process above the FAQ, "real people" up

Owner: *"move the how it works to before the questions, and move up the real people
not software to where it currently is."* Two moves, nothing else touched.

Final order and measured surface at 1440:

| # | Section | Tone | Height |
|---|---|---|---|
| 1 | Hero | paper | 746 |
| 2 | Counter band | navy | 439 |
| 3 | Human ("real people") | paper | 713 |
| 4 | Comparison | paper | 711 |
| 5 | Day in life | navy | 605 |
| 6 | Hand-off picker | white | 439 |
| 7 | How it works | white | 738 |
| 8 | FAQ | paper | 577 |
| 9 | Closing CTA | paper | 675 |

- `HomeHuman` moved from position 6 to 3; `HomeHowItWorks` moved from 3 to 7
  (immediately **above** the FAQ, not below it).
- **Tone side effect, accepted deliberately:** two pairs now share a surface —
  `Human`+`Comparison` (both paper) and `Handoff`+`HowItWorks` (both white). Neither
  can be flipped cheaply: the comparison cards are `bg-mk-white`, the human chat
  mockup is `bg-mk-white`, and the picker's pills are `bg-mk-paper` — each needs its
  current ground to be visible. Inspected both seams in-browser; they read as one
  longer band with 224 px of breathing room, not as a broken edge. Recorded in the
  `HomeContent` doc comment so the next reorder does not assume alternation.
- Process sitting above the FAQ also removes a CTA stack: its "Get Started Today"
  button is no longer directly above the green closing panel.
- Page height is unchanged at **6527 px** (1440) / **10089 px** (375) — this was a
  pure reorder, no section added or removed; 0 px horizontal overflow at both.
- One `h1`, 8 `h2`s, no heading-level skips. `tsc` clean · eslint clean · 381/381.

### 2026-11-04 — "How It Works" moved to `/contact`, "How We Work Together" deleted

Owner: *"move the how it works section to the contact page. and remove the how we
work together."* Straight de-duplication — the site had two 3-step onboarding
sections saying almost the same thing on two pages.

- New `components/marketing/how-it-works.tsx` → `HowItWorks`, lifted verbatim from
  `HomeHowItWorks` so the section is no longer filed under `home/`. `HomeHowItWorks`
  and its `STEP_ICONS` table are gone from `components/marketing/home/process.tsx`,
  which now exports only `HomeDayInLife`.
- The `Process` component in `app/(marketing)/contact/contact-content.tsx` is deleted;
  `ContactContent` renders `<HowItWorks />` in its slot (last section, after the form).
- **The CTA was dropped, not moved.** Its `Get Started Today` button linked to
  `/contact`; on `/contact` that is a self-link. Nothing else in the section changed.
- Copy stays in `t.home` (`processEyebrow`, `howItWorks`, `howItWorksDesc`, `steps`)
  because those keys are the section's own strings, not home-specific narrative.
- **Now-dead keys, left in place deliberately:** `t.contact.howWeWorkTitle/Desc/Steps`
  and `t.home.getStartedToday`. They are owner-written EN+ES copy; deleting
  translations is a content decision, not a refactor. Say the word and they go.
- **Measured (1440):** home `6527 → 5789 px` (−738, the section plus its CTA);
  `/contact` How It Works renders at `650 px` — exactly `738 − 88`, the removed CTA.
  `/contact` total `2742 px`. 0 px horizontal overflow on both at 1440 and 375.
- **Known seam:** `/contact` is now `Intake` (white) → `HowItWorks` (white). Two white
  sections in a row, separated only by padding. The section's cards are
  `bg-mk-paper/50`, so it cannot go to paper without repainting the cards; the form
  cannot go to paper either. Accepted for now — flag it if the join reads flat.
- Verified: `tsc` clean · eslint clean on all four touched files · 381/381 tests ·
  one `h1` per page, no heading-level skips.

### 2026-11-04 — cream-on-cream seam fixed: `HomeHuman` went white

Owner: *"shouldnt one of these be white background, following what we had before,
we didnt have cream then another cream."* Correct — after moving the process
section off the page, `HomeHuman` and `HomeComparison` ended up adjacent, both
`bg-mk-paper`. Before the moves they had never touched, so the seam was new.

- Fixed by flipping **`HomeHuman` → `tone="white"`**, not the comparison.
  `HomeComparison` cannot be white: its two alternative cards are `bg-mk-white`
  and would vanish into the background.
- **Known trade-off:** the human section's chat window (`WindowFrame`) is also
  `bg-mk-white`, so it is now white-on-white. Measured: frame `rgb(255,255,255)`,
  section `rgb(255,255,255)`. It stays legible on its hairline border
  (`rgb(226,226,222)`), the cream title bar and the `bg-mk-accent/15` glow behind
  it — verified in-browser at 1440. This is the normal "window on a page" idiom,
  but if the card ever needs its own fill, the change belongs in `WindowFrame`
  (a `surface` prop), not in a conflicting `bg-*` class on this component.
- **Measured after (1440):** tones now alternate
  paper / navy / white / paper / navy / white / paper / paper — the final pair is
  the closing card on its cream ground, which is intended. 0 px horizontal
  overflow. 375: same alternation, `8980 px` page, 0 px overflow.
- Verified: `tsc` clean · eslint clean · 381/381 tests.

### 2026-11-04 — AI content generation moved onto `--mk-*`, stored content normalised

Owner: *"yes make the edit also for existing landing pages and other pages that
exist. basically everywhere needs to build on the new ui."*

**Part 1 — what the AI is told.** The prompt modules described a design system the
site stopped using months ago. Measured: `--mk-*` appeared **zero** times in
`lib/utils/ai-system-prompt.ts`, which instead specified a teal `#005148` +
navy `#002D72` + **gold `#E8A838`** palette, `#FF6B35` accents, cool greys,
teal→navy gradients and `<style>` blocks full of `@keyframes`.

- New `lib/utils/ai-design-2026.ts`: `DESIGN_SYSTEM_2026`, `HTML_CONTENT_RULES_2026`,
  `LANDING_PAGE_RULES_2026`, `BLOG_BODY_RULES_2026`.
- `buildTrainedPrompt()` pushes those four instead of `DESIGN_SYSTEM`,
  `CREATIVE_HTML_FRAMEWORK`, `LANDING_PAGE_RULES`, `BLOG_CONTENT_RULES`. One switch,
  so every caller — admin blog AI, SEO agent, landing-page builder, `ai-engine`
  specialists — changed at once.
- The rule that matters most: generated HTML is injected into `.mk-article`, and
  **inline styles beat that stylesheet**. So the new rule is *semantic HTML only;
  inline styles for layout only* — never colour, font, border or radius.
- Removed the fabricated-proof instructions that still reached prompts: CRO's
  `"Trusted by 500+ businesses"`, `"30-day money-back guarantee"`, fake scarcity
  and review stars, plus GEO's `"based on 500+ client engagements"` and SEM's
  `"500+ Happy Clients"` headline. All of these are advertising-claims exposure —
  the CRM holds 0 active clients.
- **Known debt:** the four legacy constants are still on disk (~700 lines) marked
  `@deprecated SUPERSEDED` and are no longer pushed. Deleting them is the next
  cleanup; rewriting them in place meant reproducing ~700 lines as an edit string,
  which is exactly the kind of change that silently corrupts.

**Part 2 — content that already exists.** Posts and landing pages written under the
old system carry their styling *inside the markup*: inline colours, plus a literal
`<style>` block that applies globally once injected. CSS cannot fix that, so the
fix is applied to the HTML at render time.

- New `lib/utils/legacy-content.ts` → `normalizeLegacyHtml()`: strips
  `<style>`/`<script>`/`<link>` blocks and rewrites every `style="…"` to an
  **allowlist** of layout properties (display, position, width/height,
  margin/padding, gap, grid, flex, align/justify, text-align…). Colour, font,
  border, radius, shadow and animation are dropped so `.mk-article` wins.
- Wired into `news/[slug]/blog-post-content.tsx` and `lp/[slug]/lp-content.tsx`.
  No Firestore migration: every already-published document is repaired on read,
  and it stays correct if an older client writes one again.
- Allowlist rather than blocklist on purpose — a blocklist silently keeps the next
  legacy property someone invents, and the failure mode is an off-brand colour only
  the stylesheet could have fixed.
- Verified: **11** unit tests on the normaliser (24/28px-free markup, single-quoted
  styles, gradients, void `<link>`, text that merely mentions a hex).
  `tsc` clean · eslint clean · **392/392** tests.
- **Not verified:** no published post exists locally, so the normaliser has not
  been run against a real stored body — unit tests only. The AI-side change is
  likewise unexercised until someone generates a post.

### 2026-11-04 — hand-off picker: 6 pain-point pills added; legacy prompt blobs deleted

Owner: *"lets add a few more options to choose from here, hit some pain points that
people will click on. then continue to remove and clean up all legacy and old code."*

**Picker: 8 → 14 pills.** The first eight are the generic catalogue (a *category*
each); the six new ones are written as the *chore*, because that is what makes a
pill recognisable mid-scroll:

| New pill | Why it earns a slot |
|---|---|
| Chasing late payments | Every owner has done it at 11pm |
| Following up on leads | Directly tied to lost revenue |
| Answering the phone | The interruption people most want gone |
| Appointment reminders | No-shows are a concrete, countable loss |
| Meeting notes & follow-ups | The work that never gets done after the call |
| Onboarding new clients | The bottleneck that caps growth |

Deliberately **not** added: anything that duplicates an existing pill (e.g.
"Bookkeeping" — already covered by `Invoicing & expenses`) and anything implying a
service CreedaVA does not offer.

- **Measured — 1440:** 14 pills, **5 rows**, `217 px` list (`127 px` at 8 pills),
  section `439 → 528 px`, page `5878 px`, 0 px overflow.
- **Measured — 375:** 14 pills, **9 rows**, `397 px` list, section `825 px`, page
  `9205 px`, 0 px overflow. This is the one number worth flagging: the picker now
  costs ~400 px of a phone screen. Options if it reads as long — trim to 10 on
  mobile, or collapse behind a "more" toggle. Not done, because the ask was more
  options, not fewer.
- Both locales updated in the same commit; new `__tests__/lib/i18n/handoff-tasks.test.ts`
  asserts equal length, no duplicates, no empties and a 34-char pill cap.

**Legacy code removed** (the four superseded prompt blobs from the previous entry):

| Deleted constant | Lines | Why it had to go |
|---|---|---|
| `DESIGN_SYSTEM` | ~190 | Teal/navy/gold palette, CoolGray scale, approved-gradient table |
| `CREATIVE_HTML_FRAMEWORK` | ~420 | `@keyframes`, wave dividers, `cv-*` classes, `#FF6B35` icons |
| `LANDING_PAGE_RULES` | ~145 | Gradient banners, flip cards, guarantee block, Unsplash heroes |
| `BLOG_CONTENT_RULES` | ~115 | The old `prose` container, decorative HTML |

`lib/utils/ai-system-prompt.ts`: **2720 → 1829 lines (−891)**. No import remains —
grep-verified across `.ts`/`.tsx` outside `docs/`. The file's own header comment now
points at `ai-design-2026.ts`.

Also deleted, both proven unreferenced: `t.home.getStartedToday` (the process CTA
that was dropped when the section moved to `/contact`) and
`t.contact.howWeWorkTitle / howWeWorkDesc / howWeWorkSteps` (the deleted "How We
Work Together" section). Removing them from only one locale leaves a `Dictionary`
type error, so both went together — and the parse error that produced (a stray
closing brace) was caught by `tsc` immediately.

- Verified: `tsc` clean · eslint clean · **397/397** tests, 36 files.
- Test changes: the prompt suite no longer imports the deleted constants; it now
  asserts the 2026 modules carry the real tokens and that the old headings
  (`APPROVED GRADIENTS`, `COOLGRAY`, `use sparingly`) are gone. One assertion I
  first wrote was wrong — it banned `#002D72`, which is the *live* `--mk-navy`
  token, not a legacy value. Corrected rather than worked around.

### 2026-11-04 — brand assets, share cards and the missing `og:image` bug

Scope: "cover everything the whole scope with new design" — every surface a visitor
or a scraper can see, not just the marketing routes.

**Picker capped at 10.** `home.handoffTasks` went 14 → 10 (both locales, same order).
Measured: 1440 → 3 rows, list 127 px, section 439 px, doc 5789 px; 375 → 7 rows,
list 307 px, section 735 px, doc 9115 px; 0 px horizontal overflow at both.
At 14 it was 5 rows / 217 px and 9 rows / 397 px.

**The real bug: `og:image` was missing on every marketing route.** `getPageSEO()`
returned a page-level `openGraph` object, and Next *replaces* rather than merges a
parent's `openGraph` — so returning `{ title, description, url, type }` with no
`images` deleted the root layout's image. Every share preview (LinkedIn, X, Slack,
WhatsApp) was a bare link. Fixed with a `DEFAULT_OG_IMAGE` const in
`lib/firebase/seo.ts`, applied in **both** the Firestore branch and `fallback()`,
with a page-specific `seo.ogImage` still winning. Verified 1 `og:image` +
1 `twitter:image` on `/`, `/pricing`, `/about`, `/services`, `/news`, `/contact`,
`/faq`, `/join`.

**Share card rewritten** (`app/opengraph-image.tsx`): cream `#F7F7F2` ground, ink
`#0B2135` headline, hairline `#E2E2DE`, green `#005148` footer line. The C mark is
read from `public/creedava-mark.svg` at render time, its `url(#markGrad)` gradient
flattened to solid `#005148`, and inlined as a base64 data URI — no new dependency,
and it works at build time because the route prerenders. `app/twitter-image.tsx`
now just re-exports it so the two cannot drift.

**Icon set rebuilt:** `app/apple-icon.tsx` (180×180 `ImageResponse`), `app/icon.svg`
(copy of the mark), and `app/favicon.ico` regenerated by the new
`scripts/build-favicon.mjs` — sharp at `density: 600`, 8% padding, 16/32/48 into a
PNG-in-ICO container (2.5 kB). The old committed `favicon.ico` was the pre-redesign
pinwheel (blue/orange/pink) and browsers trust it in bookmarks, so it had to go.
`app/manifest.ts` icons now point at the mark; `background_color #F7F7F2`,
`theme_color #005148`. The hand-written `icons` block in `app/layout.tsx` was deleted
— file-based metadata owns it now.

Measured after: `/opengraph-image` 200 `image/png` 1200×630 (61,888 B);
`/twitter-image` 200, byte-identical; `/apple-icon` 200 180×180 PNG;
`/icon.svg` 200 `image/svg+xml` 7035 B; `/manifest.webmanifest` 200 469 B. Head
emits favicon.ico + icon.svg + apple-touch-icon + manifest + `theme-color #005148`.

⚠️ The OG mark *looks* pale mint/blue in a preview pane. Pixel sampling says
`(0,81,72)` on `(247,247,242)` — i.e. exact `#005148` on `#F7F7F2`. The paleness is
the viewer compositing, not the asset. Same for the favicon pixels.

**Stale raster logos retired from metadata:** JSON-LD `logo` and the marketing
layout's JSON-LD now point at `/creedava-logo.svg` instead of `.webp`.

**Transactional email palette swapped:** `#002D72 → #0B2135`,
`#F9FBFF → #F7F7F2` across `functions/src/{scheduled,scheduled-reports,report-delivery,triggers}.ts`,
`lib/firebase/trigger-email.ts`, `app/(admin)/admin/{customers,emails}/page.tsx`.
0 occurrences left. **`functions/` needs its own deploy** for those to take effect.

**AI prompt flushing:** the forum prompt in `app/(admin)/admin/forum/page.tsx` and
the forum HTML block in `lib/utils/ai-system-prompt.ts` both still instructed
`border-left:4px solid #005148`, `<strong style="color:#005148">` and a
`linear-gradient(135deg,#005148,#007A6D)` CTA — which `normalizeLegacyHtml` would
then strip. Both now demand semantic HTML with no inline styles or hex colours.

**Deliberately left alone:** `components/ui/world-map.tsx` (`#002D72` = the live
`--mk-navy`), `components/ui/hero-illustration.tsx` (`#007A6D` = `--mk-brand-bright`),
`components/survey/satisfaction-survey.tsx` (`#005148` = `--mk-brand`) — all three
are already on current tokens; they are literals, not legacy. `/admin` chart palettes
and `components/admin/ai-prompt.tsx` stay on their own token set by design.

**Still referenced, do not delete:** `public/logo.webp` is used by the admin survey
email templates (including a migration check in `emails/page.tsx` that greps for
`https://creedava.com/logo.webp`) and `public/creedava-logo-B-axbjNY.webp` by the
same. They are out of metadata but not out of code.

- Verified: `tsc` clean (app **and** `functions`) · eslint clean · **398/398** tests,
  36 files · `functions` 65/65 · `npm run build` success with `/opengraph-image`,
  `/twitter-image`, `/apple-icon`, `/icon.svg`, `/manifest.webmanifest` all
  prerendered as static — which is the proof the `fs` read of the mark works at build.
- Not verified: no published post exists locally, so `normalizeLegacyHtml` is proven
  by unit tests only, not against real generated output.

### 2026-11-05 — admin dark/light mode completed

The admin kept its own `--primary` / `--gray-*` token set (that stays — the dual
system is intentional), but the **dark half of it was only partly wired**. The
switch existed in `/admin/settings`, the token overrides existed in
`:root[data-theme="dark"]`, and the anti-flash script existed in `app/layout.tsx`.
What was missing was everything between: most of the dashboard never asked for a
theme-aware colour.

**The root cause: `dark:` did nothing.** Tailwind's built-in variant keys off
`prefers-color-scheme` / `.dark`. This app drives theming from `data-theme` on
`<html>`. So on a machine set to light, a user picking "Dark" got the token
overrides (which are attribute-scoped and did work) but every `dark:` utility
silently stayed light — and on a dark OS it would have gone the other way. Fixed
with one line in `globals.css`:

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

Marketing pages are unaffected because `ForceTheme` removes the attribute there,
so `dark:` is inert outside `/admin`. `/login` got an explicit
`<ForceTheme theme="light" />` because it is styled with the marketing tokens and
could otherwise inherit `data-theme="dark"` across the client-side redirect out of
the dashboard.

**Raw Tailwind greys swapped for the tokens that flip.** Only `gray-10`…`gray-100`
are overridden by this project; `gray-200`…`gray-900` still resolve to Tailwind's
own palette and never moved. One of them was already a live light-mode bug:

| Was | Resolved to | Now |
|---|---|---|
| `bg-gray-100` | `#002D72` navy (!) | `bg-gray-20` |
| `text-gray-500` | Tailwind `#6a7282` | `text-gray-60` |
| `text-gray-600` | Tailwind `#4a5565` | `text-gray-70` |
| `text-gray-700` | Tailwind `#404040` | `text-gray-80` |
| `bg-gray-50` | `#f9fafb` | `bg-gray-20` |
| `border-gray-200/300` | Tailwind | `border-border` |

Verified against the compiled CSS (`grep '.bg-gray-100{'` → `var(--gray-100)`),
not assumed.

**Status colours got their own flipping tokens.** The badges used raw
`text-green-700` on `bg-green-50` / `border-green-200`, and several pills paired
`bg-emerald-500/10` with `text-emerald-300` — which is **1.7:1 in light mode**,
i.e. already broken before dark mode was considered. `--success` / `--warning` /
`--error` are FILL colours (`--warning` is a #F1C21B yellow, 1.9:1 as text), so
six new tokens were added for text and soft surfaces:

| Token | Light | Dark | Light ratio | Dark ratio |
|---|---|---|---|---|
| `--success-text` | `#0E6027` | `#6FDC8C` | 7.72:1 | 8.73:1 |
| `--warning-text` | `#8A5A00` | `#F1C21B` | 5.93:1 | 8.86:1 |
| `--error-text` | `#A2191F` | `#FF8389` | 7.79:1 | 6.29:1 |
| `--info-text` | `#0038A8` | `#7AB7FF` | 9.85:1 | 7.14:1 |

(plus `--*-soft` surfaces and `--*-soft-line` borders, which flip to deep tinted
wells in dark). All measured against `--card` in the browser. `--info` itself was
never remapped and sat at 1.9:1 on the dark page; it is now `#7ab7ff`. `--ring`
went to `#5eead4` because `#007A6D` only reaches 3.0:1 on `#202124`.

**Charts and maps.** Every categorical palette was a hardcoded hex array
(`#005148`, `#0043CE`, `#6929C4`, `#9F1853`, `#198038`, `#F1C21B`, `#007A6D`,
`#4589FF`) — `#0043CE` and `#6929C4` are unreadable marks on a `#202124` card.
These became `--chart-1`…`--chart-8` with dark values in the same hue families.
Confirmed in the browser that an SVG `fill="var(--chart-1)"` re-resolves when
`data-theme` changes (measured `#005148` → `#2dd4bf`), which is why no JS
re-render hook was needed. The world-map heat ramp is now derived with
`color-mix` from `--primary` so the five steps keep their order in both themes.
The one non-token case is the "At Risk" bucket: `#FF832B` became
`color-mix(in srgb, var(--warning) 55%, var(--error))` so it stays an orange
escalation step distinct from the yellow above it.

**The Google SERP preview is pinned white on purpose.** It carries Google's own
`#1a0dab` / `#006621`, which fall to ~1.2:1 on a dark card. It now uses
`bg-mk-white` (a token that never flips) instead of `bg-card`, because a search
result preview should look like a search result in either theme.

**Code blocks stay dark in both themes.** `.ai-code-block` used
`--gray-100`/`--gray-20`, which invert — producing a full-white block on the dark
page. New `--code-bg` / `--code-fg` / `--code-line` have no dark override.

**Theme switcher added to the chrome**, so the mode no longer requires a trip to
Settings: `components/admin/theme-toggle.tsx` cycles Auto → Light → Dark, mounted
in the sidebar footer, the collapsed rail, and the mobile topbar. The Settings
segmented control is still the explicit chooser.

**`useAdminTheme` is now a shared store.** It used `useState` per caller, so
flipping the theme from the sidebar would not have updated the Settings page
(and vice versa) without a remount. Rewritten on `useSyncExternalStore` with a
module-level listener set; the exported `[theme, setTheme]` shape is unchanged.

- Verified: `tsc` clean · eslint clean · **407/407** tests, 37 files (9 new in
  `__tests__/hooks/useAdminTheme.test.ts`, including a guard that `globals.css`
  still defines `@custom-variant dark`) · `npm run build` success · the compiled
  CSS contains `.dark\:…:where([data-theme=dark],[data-theme=dark] *)`.
- **Not verified live:** every authenticated `/admin/*` route. Sign-in is Google
  popup only and there are no test credentials, so the shell, the toggle and each
  page were verified by token and class measurement, not by rendering a signed-in
  dashboard. Re-run an axe sweep after logging in.

### 2026-11-05 — design-system audit (`scripts/audit-design-system.mjs`)

"Updated everywhere" was an assumption. This makes it a measurement.

`npm run audit:design` runs 12 static rules over 232 files. `--live` adds 14 routes
over HTTP. `--visual` adds a real browser sweep at 1440 and 375 measuring
horizontal overflow and text contrast on leaf text nodes only. All three legs run
in `check:preflight`, so a regression fails the gate instead of waiting to be
noticed.

**Every rule carries a self-test.** The first run of the self-test failed and was
right to: it caught a sample I had written wrong. That matters because two earlier
bugs in this same session came from rules that silently never matched — a hex that
was matched inside a comment, and a per-file allowlist that exempted a whole file
from every rule when only one rule was meant. Allowances are now per-rule with a
stated reason.

**What the first run found — all six were real:**

| Finding | Reality |
|---|---|
| 4 × `prose` containers | `@tailwindcss/typography` is not a dependency, so `prose` emits **zero CSS**. The visitor-facing **forum thread body** was rendering as unstyled run-on text. Fixed with `.mk-article`; the three admin ones got a new `.rich-html` in `admin-styles.css` (see below). |
| 1 × legacy `#f9fbff` | In the booking-confirmation e-mail body, `app/api/booking/route.ts`. Shipped to the admin inbox. Now `#F7F7F2`. |
| ~30 × raw palette hues | `bg-emerald-500/10` pills, `bg-{green,red,amber,blue,teal,orange}-500` dots. None flip with the theme. Now `bg-*-soft` / `bg-{success,warning,error,info}`. |
| 1 × orphan component | `components/ui/hero-illustration.tsx` — nothing imported it. Deleted. |
| 2 × "stale logo" | False positives: both were comments documenting the old path. Rule is now comment-aware. |
| 0 × cross-surface leakage | The `--mk-*` / `--primary` split is genuinely clean in both directions. |

**`.rich-html` is the admin counterpart to `.mk-article`.** Three admin surfaces
render third-party HTML with `dangerouslySetInnerHTML` (e-mail inbox body, landing
page preview, RTE preview) and all three relied on `prose`. It reads `--gray-*`
and `--primary` so it follows the theme, and it covers headings, lists,
blockquotes, code, tables and rules. Inline styles in stored HTML still win — that
is expected; this only supplies the defaults the markup left unspecified.

**Escalation colours kept their step.** Two four-level ramps had a bucket that
would have collapsed into its neighbour: customer "At Risk" (`#FF832B` → now
`color-mix(in srgb, var(--warning) 55%, var(--error))`) and task priority
`high` (now `.priority-high`, the same recipe). Reusing `--warning` would have made
them indistinguishable from the level above.

**A bug in the audit itself, found by the audit.** The first visual run reported
1.34–1.88:1 on the navbar of *every* page. The site was fine — Chromium serialises
`color-mix()` as `oklab(...)`, and the parser's digit regex read `oklab(0.968 …)`
as `rgb(0.968, …)`, i.e. near-black. Colours now resolve through a canvas, and the
detector was re-validated against a deliberately bad element: real navbar text
measures **9.25:1**, the injected `#e8e8e8`-on-white probe measures **1.23:1** and
is flagged.

- Measured: 14 routes × 2 viewports, **0 contrast failures, 0 px overflow**.
  `.mk-article` verified on real markup (h2 25.6px/800 Jakarta, body 17px/29.75px,
  22.95px block rhythm). `prose` confirmed to emit no rule at all.
- Verified: `tsc` clean · eslint clean · **407/407** tests · build OK ·
  `audit:design` 0 errors 0 warnings.
- **Still not verified:** no forum thread is published locally (0 records), so
  `.mk-article` was proven by injecting real markup, not by loading a stored
  thread. And no `/admin/*` page below the login redirect is reachable without
  credentials, so `.rich-html` is proven by compiled CSS + rule presence, not by
  rendering a signed-in inbox.

### 2026-11-06 — blog article page rebuilt as a real editorial template

Two rounds of owner feedback, both about the same impression: the first version
fixed the frame, the second said the page still only used the middle.

> "the blogs are incorrect, they should use the whole page and be editorial like.
> Right now its like its in a frame, i hate it."
>
> "why are we only using the middle of the page wtf. it looks like shit.
> Just fucking remake the whole thing to look better."

**What was actually wrong.** Two causes, only one of them visible from the JSX:

1. The body sat in `rounded-(--mk-radius-lg) bg-mk-white px-6 py-10
   shadow-(--mk-shadow-card)` inside a `max-w-3xl` column — a white card with a
   shadow and ~460 px of empty cream either side at 1440.
2. **The stored HTML carried its own layout.** A real published body is a
   `<div style="max-width:1280px">` holding `display:grid` card rows,
   `text-align:center` headings and `padding:32px` blocks. `normalizeLegacyHtml`
   kept every layout property, so no amount of column width mattered: the body
   kept drawing a mini page of its own in the middle of ours.

**The template now** (`app/(marketing)/news/[slug]/blog-post-content.tsx`):

- **Masthead** — `containerSize="xl"`, a two-column spread: copy left, `4:3` cover
  right, `lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]`. Headline
  `clamp(2.3rem,4.9vw,4.4rem)` with `text-balance`; kicker row is
  `Category · date · N min read`; byline sits under a hairline with initials.
- **Body** — same `xl` container, a **sticky rail on the left** and the text beside
  it: `[13rem_minmax(0,1fr)]`, widening to `16rem` at `xl`, `sticky top-28`. The
  rail is hidden below **900 px**, not `lg` — a 13-inch laptop window is often
  ~900 wide, and hiding it there put the article back to a single centred column.
- **Contents rail** — built from the body's own `h2`/`h3` (see below). Left-aligned
  (`border-l pl-5`, the rule on the page's left edge). Past 10 headings it drops to
  top-level sections only, because a 16-row rail is a wall rather than a guide.
- **Sources** — a numbered list under the body, rendered only when the post has
  `references`. Inline markers in the body link to `#source-1`, `#source-2`. The
  list is visible rather than footnoted on purpose: a claim a reader cannot check
  is a claim we should not have published.
- **Share** — LinkedIn, X, Facebook, WhatsApp, Email, plus a **Copy link** button
  (`navigator.clipboard`, label flips to "Link copied"; a denied clipboard leaves
  the label alone rather than claiming a copy that did not happen).
- **After the body** — sources, tag pills, an author card, back/contact row, and a
  **Related reading** band of up to three cards.

**Content rules changed at the same time.** The owner's complaint that the posts
were short and unreferenced traced back to two places:

- `BLOG_BODY_RULES_2026` asked for **700–900 words** and said nothing about
  sources. It now asks for **1,200–1,600 words**, 6–9 `<h2>` sections, and a
  numbered `<a href="#source-1">[1]</a>` marker on every factual claim, with a
  matching `references` array. Unsourced claims are to be **removed**, not
  hedged, and invented or mismatched URLs are explicitly banned.
- The admin Blog generator prompt still described the **pre-redesign** HTML:
  "Start with a `<style>` tag", gradient stat banners, SVG checkmarks, wave
  dividers, "ALL styles must be inline". `normalizeLegacyHtml` strips every one of
  those, so the model was being paid to write markup the renderer then deleted.
  It now asks for semantic HTML and the `references` array, and no longer passes
  `includeCreativeFramework`.
- `BlogPost.references` (`{ label, url?, source?, year? }`) is emitted into
  JSON-LD as Schema.org `citation`, and omitted entirely when a post has none —
  an empty `citation` array is a claim of its own.

**New code:**

- `lib/utils/blog-content.ts` → `withHeadingAnchors(html)`. Injects `id`s into body
  `h2`/`h3` and returns `{ html, headings }` for the rail. Done on the string, not
  the DOM, because the body is injected with `dangerouslySetInnerHTML` and never
  mounted as React nodes. Respects an existing `id`, suffixes duplicates
  (`tools`, `tools-2`), folds accents, decodes the common entities, ignores empty
  headings. 11 unit tests.
- `lib/utils/legacy-content.ts` → `normalizeLegacyHtml(html)` (landing pages
  only since 2026-11-07 — see *Article body: rebuilt, not restyled* below).

- `app/(marketing)/news/[slug]/page.tsx` → `getRelatedPosts()`, ranked by shared
  tags then newest (there is no view or click data). Fails soft to `[]`, which
  hides the band. `toPost()` + `toIsoTimestamp()` replace the inline Firestore
  timestamp cast, which the build rejected as `Property 'toDate' does not exist
  on type '{}'`.
- i18n: `inThisArticle`, `share`, `copyLink`, `linkCopied`, `relatedPosts` in
  **both** locales. `post.tags` is now read as `post.tags?.[0]` — the type says
  array, published documents disagree.

**Measured** in a harness that renders a real production body through the real
normaliser against the built stylesheet (deleted after use — the local server has
no admin credentials, so `/news/<slug>` renders the not-found state locally):

| | 1440 | 375 |
|---|---|---|
| horizontal overflow | 0 | 0 |
| body column | 880 px | 328 px |
| paragraph measure | 800 px | 328 px |
| contents rail | 272 px, flush to container right edge | hidden |
| contents items | 6 (16 headings → top-level only) | — |
| body font | 19 px | 19 px |
| `text-align:center` blocks left in body | 0 | 0 |
| `display:grid` blocks left in body | 0 | 0 |
| padded blocks left in body | 0 | 0 |
| contrast failures | 0 of 148 text nodes | 0 of 148 |

A 16-heading article would render a 16-row rail, so past 10 headings the list
drops to top-level sections only.

`lint` 0 errors · **423/423** tests (37 files) · `audit:design` 0/0 · build OK ·
`/news/[slug]` still prerendered via `generateStaticParams`.

The harness is evidence about CSS, normalisation and geometry, **not** proof that
the Next route renders — that was confirmed on `https://creedava.com` after the
App Hosting rollout.

### 2026-11-07 — Article body: rebuilt, not restyled

The owner approved the layout and rejected the content:

> "The content and how it's delivered is shit, the layout is good."
> "you aren't doing nothing to the post and using bullshit elements from the old
> design that simply does not work here."

They were right, and the previous two attempts had missed it. Every change so far
— rail, measure, masthead — had been **layout**. The *body markup* was untouched,
and the body is where the old design system lived.

**What was actually in a published post.** Card grids (`cv-grid-2`), an animated
counter whose number came from a stripped `<script>` (so an empty box with a
floating `%` beside it), star SVGs standing in for list bullets together with
`style="list-style:none"`, and a wave divider `<svg>` filled with the old
off-white spanning the full column. `normalizeLegacyHtml` had removed the inline
*styling* of these, which is why they rendered as unstyled debris rather than as
anything recognisable: the styling was gone, the elements were not.

**The fix — `lib/utils/article-body.ts`.** `rebuildArticleBody(html)` is a
whitelist rebuild, not a clean-up pass. There is no HTML parser in the
dependencies and adding one was not an option, so it tokenises (`<tag attrs>` /
text), builds a tree with a stack, and then:

- **drops** `svg`, `style`, `script`, `iframe`, `form`, `input`, `video`,
  `canvas`, `object` and friends outright;
- **keeps** `p`, `h1`–`h6`, `ul`/`ol`/`li`, `table` + cells, `blockquote`, `pre`,
  `figure`/`figcaption`, `details`/`summary`, `hr`, `img`, and the inline set
  (`a`, `strong`, `em`, `code`, `sup`, `sub`, `mark`, `cite`, `time`);
- **unwraps** everything else (`div`, `section`, `span`, `font`, `center`) and
  recurses into its children, so a heading nested three wrappers deep is still a
  heading;
- **strips every attribute** except `href` (http/https/mailto/relative/`#`),
  `src` + `alt`, and `open`;
- **drops orphaned labels** — a paragraph with letters but fewer than five words
  and no terminal punctuation is a card caption whose number no longer exists
  (`Increase in Lead Conversion`, `~10%`). Short *sentences* ("That is the whole
  point.") keep their punctuation and survive.

`stripDuplicateTitle(html, title)` removes a leading heading that repeats the
article title — stored bodies were written as standalone documents, so they open
with their own `<h1>`, which the template already renders in the masthead.

`normalizeLegacyHtml` loses its `editorial` mode, which existed only for this
body and is now dead: it is back to a single behaviour for landing pages, which
are genuinely one designed surface.

**Presentation (`.mk-article--wide`).** The rebuilt body is plain semantic HTML,
so the stylesheet can finally own it: hairline above every `h2` except the first,
`h3` in brand green, a drop cap on the opening paragraph, `list-style: disc`
forced in CSS (never trusted from the markup), full-width images, striped table
rows, and `details` as a bordered Q&A block.

**Measured** in a harness that runs the *real* rebuilt bodies through the built
stylesheet (deleted after use):

| | post 1 | post 2 |
|---|---|---|
| `svg` inside the body | 0 | 0 |
| elements carrying a `cv-*` class | 0 | 0 |
| elements carrying `style=` | 0 | 0 |
| `list-style-type` on `li` | `disc` | `disc` |
| headings / paragraphs / list items kept | 14 / 21 / 6 | 16 / 41 / 9 |
| horizontal overflow @ 1440 / 375 | 0 / 0 | 0 / 0 |
| contrast failures | 0 of 88 text nodes | 0 of 88 |

`npm test` **443/443** (38 files, +16 for the rebuild) · `lint` 0 errors ·
`audit:design` 0/0 · build OK.

**Not fixed by this, and not claimed:** the two published posts are still 789
words with no `references`. The renderer can only show what is stored;
regenerating the bodies needs a signed-in admin.

**Also found, not touched:** `lib/firebase/ai-engine.ts` →
`generateSEOBlogPost()` still prompts for `<style>` blocks, wave dividers and
`cv-fade-up-*` classes. It is reachable only through
`lib/firebase/ai-lazy.ts`, and no UI imports that path, so it is currently dead
weight rather than a live source of bad markup. It should be deleted or ported to
`BLOG_BODY_RULES_2026` — a decision for the owner.


## Verification (measured, 2026-11-02)



| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | 0 errors (1 pre-existing `coverage/` warning) |
| `npm test` | 375/375 passed, 34 files |
| `npm run build` | success |
| Horizontal overflow @ 375 / 768 / 1440 | 0 px on all three |
| Sections rendered | 10 |
| H1 computed font | Plus Jakarta Sans |
| Contrast audit (oklab-aware) | only the 3 decorative, `aria-hidden` step numerals below 3:1 |
| FAQ accordion | 6 items, native `<details>` |
| Hand-off picker | toggles, singular/plural correct, `aria-live` announced |

**Not verified:** pixel-level visual review. Screenshots were captured but the
assistant could not render them in-session. Owner review in a browser is the next gate.

## Open items / next phase

1. **Visual sign-off** from the owner on the hero composition and section rhythm.
2. **Glover's Reef on the world map** — no reachable dataset carries its outline
   (checked: the Belize country polygon, `ne_10m_minor_islands`, `ne_10m_land`,
   `ne_10m_reefs`). Retry OpenStreetMap Overpass for `natural=reef` polygons in
   Belize waters and add the real shape. Do **not** substitute a hand-drawn ring.
   Even at 13× it would render roughly 7 × 11 px, so it will read as a mark, not
   an atoll.
4. ~~**FAQ** still uses the old visual language.~~ **DONE 2026-11-03** — `/faq`,
   `/privacy`, `/terms` and `/forum` were rebuilt/migrated, and the remaining
   marketing files were swept in the same session (see the two 2026-11-03 log
   entries). The marketing surface is fully on `--mk-*`; only `/admin` and the
   admin-only `components/ui/*` primitives still use `--primary`/`--gray-*`, by design.
5. **Stale e2e spec:** `e2e/contact-form.spec.ts` intercepts `**/handleFormWebhook`,
   but the form posts to `/api/contact`. The spec therefore does not isolate the
   network and is not part of the verified suite. Fix the route pattern before
   relying on it as a gate.
6. **Testimonials** are intentionally absent — no verified customer quotes exist in
   the repo. Build the section only when real data is available.
7. **Photography** decision can be revisited; the layout does not depend on it.
8. Spanish copy was written in-house — a native review is recommended before launch.
