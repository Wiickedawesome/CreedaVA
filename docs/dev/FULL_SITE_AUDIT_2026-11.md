# CreedaVA — Full Site Audit (15 phases)

**Date started:** 2026-11-02
**Last updated:** 2026-11-02
**Auditor:** Copilot coding agent, at the owner's request ("proceed with all phases until complete,
document well")
**Rule applied:** every statement below is tagged with how it was established. Nothing is asserted
from memory or inference.

## Evidence tags

| Tag | Meaning |
|---|---|
| `live-verified` | Observed against `https://creedava.com` over HTTP or a real browser. |
| `build-verified` | Observed against a local `npm run build` + `next start` of the current commit. |
| `code-only` | Established by reading source. Not executed. |
| `measured` | A number computed with the WCAG relative-luminance formula in `python3`, reproducible. |
| `not-verified` | Believed but *not* confirmed. Treat as a hypothesis. |
| `blocked` | Could not be checked; reason recorded. |

## Status legend

`DONE` / `PARTIAL` / `NOT STARTED` / `BLOCKED` — each tied to evidence, never to intent.

---

## Phase summary

| # | Phase | Status | Headline |
|---|---|---|---|
| 1 | Interactive UX | PARTIAL | 16 admin + 15 public routes: 0 console errors, 0 page errors. `/admin/seo` had 2 H1s — **fixed**. |
| 2 | Accessibility | **DONE (public)** / BLOCKED (admin) | axe WCAG 2.2 AA: 20/20 public routes now **CLEAN**. Admin blocked by lost auth session. |
| 3 | Security | NOT STARTED | — |
| 4 | Performance / CWV | NOT STARTED | — |
| 5 | SEO | PARTIAL | Prior work verified; `/news` metadata confirmed live. |
| 6 | Content / i18n parity | NOT STARTED | — |
| 7 | Data integrity | NOT STARTED | — |
| 8 | Reliability | NOT STARTED | — |
| 9 | Responsive | NOT STARTED | — |
| 10 | Conversion / analytics | NOT STARTED | — |
| 11 | Dependencies | PARTIAL | 0 vulnerabilities; ~15 outdated, 8 major behind. Upgrade notes not yet researched. |
| 12 | Code quality | DONE (survey) | TODO×2 (1 false positive), `any`×5, 14 catch→fallback sites. |
| 13 | Build / CI / lockfile | NOT STARTED | — |
| 14 | Test coverage | DONE | 375/375 pass, 65.29% statements. |
| 15 | Documentation accuracy | DONE | 12 of 14 prior audit findings were stale or wrong — see §15. |

---

## Phase 2 — Accessibility (the substantive result)

### Method

`axe-core` 4.10.2 injected into a real browser, `runOnly` = `wcag2a, wcag2aa, wcag21a, wcag21aa,
wcag22aa`. Run against a local production build so the fix could be proven *before* shipping.
Browser HTTP cache disabled via CDP `Network.setCacheDisabled` — without this, two earlier runs
reported violations from a stale stylesheet and were false. Runs where
`getComputedStyle(document.documentElement).getPropertyValue('--gray-60')` was empty were discarded
as "measured before CSS applied" (the giveaway: `rgb(0, 0, 238)`, the browser-default link blue).

### Result — `build-verified`, 20 routes, all clean

```
/  /about  /services  /contact  /faq  /forum  /forum/abc123  /join  /news
/news/does-not-exist  /privacy  /terms  /satisfaction  /satisfaction/demo  /lp
/login  /nonexistent-page-xyz  /es  /es/services  /es/contact     → 0 violations
```

Before the fix the same sweep produced 1–18 `color-contrast` nodes on 15 of those routes, plus
`link-in-text-block` on `/privacy` (×2) and `/terms` (×1).

### Defects found and fixed

**A1 — `--gray-60` failed WCAG AA across the whole site.** `measured`

`--gray-60` was `#878D96`. On white that is **3.34:1**; on `--gray-10` (`#F9FBFF`) **3.23:1**.
The required floor for normal text is 4.5:1. It was carrying real body copy at 14px (`text-sm`)
and 18px (`text-lg`), neither of which qualifies as "large text" (24px, or 18.66px bold).
119 call sites, and `axe` flagged it on 13 of the 15 public routes.

Now `#6D747D` — **4.72:1** on white, **4.56:1** on `--gray-10`. `app/globals.css`.

**A2 — `gray-50` / `gray-40` on light surfaces.** `measured` + `build-verified`

`--gray-50` `#A2A9B0` = **2.38:1**; `--gray-40` `#C1C7CD` = **1.69:1**. Both used as *text*.
In the forum, join, news, contact and satisfaction screens the call sites were moved to `gray-60`
rather than changing the token — see A3 for why.

**A3 — `--gray-50` is deliberately left light.** `measured`

Attempting to darken `--gray-50` globally was **my own regression** and it was caught before
shipping. `--gray-50` also styles the footer, whose background is hard-coded `#1B2A4A`
(`--footer-bg`) while it still uses the *light* theme's gray ramp. Darkening the token to
`#6E757E` took a passing footer (≈5.95:1 with `#A2A9B0`) down to ≈3.04:1 and **created 21 new
failures on every page**. Reverted. Light-surface text was fixed at each call site instead.

**A4 — Login "Sign in with Google" button.** `measured`

White text on `#849b9f` = **2.93:1**. Now `#5E7377` = **5.01:1** (hover `#4F6367`).
Also `text-gray-400` on the footer note → `text-gray-60`. `app/login/page.tsx`.

**A5 — Inline links in prose distinguished by colour alone (WCAG 1.4.1).** `build-verified`

`/privacy` (×2) and `/terms` (×1): `mailto:` links used `text-primary hover:underline`, so at rest
the only difference from surrounding text was hue. Now permanently `underline underline-offset-2`.

**A6 — Duplicate `<h1>` on the SEO hub.** `live-verified` + `code-only`

`/admin/seo` rendered 2 `h1`s (`SEO Hub`, `Creeda AI`) — the only admin route that did.
`components/admin/page-header.tsx` always emitted an `h1`, and the hub mounts `<PageHeader>` while
*every one of its 8 tab sections* mounts another. Only the default tab was visible during the
sweep, so the live measurement understated it: **all 8 tabs would have produced 2 `h1`s.**
Added an `as?: "h1" | "h2"` prop (defaults to `h1`, so no existing caller changes) and set
`as="h2"` on all 8 sections.

**A7 — Forum "Open" badge.** `live-verified` + `measured`

`text-green-600` (`#00a544`) renders the status badge at 12px bold. That is below the 18.66px bold
threshold for large text, so it needs 4.5:1; it measured **3.25:1** on white. `green-700`
(`#008138`) measures **5.00:1** and is close in hue. `forum-list.tsx`, `thread-content.tsx`.

This one was invisible to every earlier run: the local production build contains no forum posts,
so the badge never rendered. It only appeared when the same sweep was re-run against the live site
once the first fix had deployed.

### Open — admin dark theme

`BLOCKED` from live verification: the audit browser session lost its Firebase cookie partway
through and every `/admin/*` request now 307s to `/login`. I cannot re-authenticate (Google
sign-in). The figures below are therefore `measured` from the token values, **not**
`live-verified`.

Dark theme (`:root[data-theme="dark"]`), base `#202124`, card `#26272b`:

| Token | Value | on base | on card | AA (4.5:1) |
|---|---|---|---|---|
| `--gray-70` / `--gray-60` | `#a5b3ce` | 7.62 | 7.06 | pass |
| `--gray-50` | `#8b949e` | 5.23 | 4.85 | pass |
| `--gray-40` | `#555b66` | **2.36** | **2.18** | **fail** |
| `--gray-30` | `#303136` | 1.24 | 1.15 | n/a (border token) |

`--gray-40` is commented "Muted captions / subtle text" and is used as `text-gray-40` **169 times**
in `app/(admin)` + `components/admin`.

**Why this was not changed:** the lightest dark-theme value that keeps `gray-40` visually distinct
from `gray-50` (`#7d858f`) still only reaches 4.31 on base and 4.00 on card. Reaching 4.5:1
requires collapsing `gray-40` into `gray-50`. The correct remediation is therefore a mechanical
migration of the 169 call sites to `text-gray-50`, reviewed visually — a separate, deliberate
change, not a token edit.

**Severity:** Medium. Admin is auth-gated and used by a handful of internal staff; the public site
is unaffected.

---

## Phase 1 — Interactive UX

`live-verified`, Playwright.

- 16 admin routes: **0 console errors, 0 page errors**, exactly 1 `h1` each — **except**
  `/admin/seo` = 2 (see A6, fixed).
- Body text length per admin route ranged 325 (`/admin/tasks`) to 4121 (`/admin/emails`) — every
  route rendered real content, none blank.
- 13 public routes over plain HTTP: all 200 with correct titles and a single `h1`;
  `/nonexistent-page-xyz` → 404.
- 24 internal links checked: only `/admin` returns 307, which is the correct redirect for an
  unauthenticated visitor.

Open (not fixed, decisions needed):

- **Homepage stats are unsubstantiated.** `app/(marketing)/page.tsx` `DEFAULT_STATS` renders
  `500+ Tasks Completed`, `98% Client Satisfaction`, `EN/ES Bilingual Support`, `50+ Happy Clients`.
  The CRM holds 0 active clients and 6 leads. This is an advertising-substantiation exposure, not a
  code bug — **owner decision required**, so it was not changed.
- "Sign In" in the nav points at `/admin` rather than `/login`, costing one redirect hop.
- `/faq` document title is `CreedaVA — Faq` (capitalisation).
- `/login`, `/satisfaction/demo` and the 404 page fall back to the default title.
- Two unused preloaded CSS chunks warn in the console.

---

## Phase 12 — Code quality

`code-only` survey.

- `TODO` markers: 2. One is a false positive (`ai-system-prompt.ts:1808`, the string "GROWTH
  HACKING" in a prompt); one is real (`types/schema.ts:153`).
- `any`: 5 occurrences.
- Catch→fallback sites: 14 places swallow an error and return a default with no logging. These are
  candidates for a shared `logAndFallback` helper, but each needs review — some are deliberate
  offline fallbacks for i18n.

---

## Phase 11 — Dependencies

`code-only` + registry data, gathered but **not finalised**.

- `npm audit`: 0 vulnerabilities.
- ~15 packages outdated; 8 major versions behind (eslint 9→10, firebase 12→13, firebase-admin
  13→14, `@vitejs/plugin-react` 5→6, typescript 5.9→7, googleapis 171→189, vitest 4→5, …).
- **Not yet done:** each major upgrade must be checked against the live registry and its migration
  notes before any recommendation. No upgrade guidance in this document should be trusted until
  that is done.

---

## Phase 14 — Test coverage

`build-verified`.

`npx vitest run` → **34 files, 375/375 tests passing**.
`npx vitest run --coverage` → **65.29% statements, 58.31% branches**.
Weakest: `lib/i18n/translate.ts` 12.5%, `ai-prompt.tsx` 29%, `ai-tool-executor` 40%, `ai-core` 49%.

---

## Phase 15 — Documentation accuracy

`code-only`.

`docs/dev/` holds 14 documents. Four carry a `2026-03-26` last-modified date — roughly seven months
stale as of this audit: `SITE_AUDIT_REPORT.md`, `AI_AUDIT_FINDINGS.md`,
`AUDIT_SECTIONS_20_24.md`, `AUDIT_SECTIONS_32_34_35.md`.

**12 of the 14 previously-recorded findings that were re-checked turned out to be already fixed or
simply wrong.** Notably: pagination exists, the focus trap exists, `faqJsonLd` is rendered, the
contacts tabs exist. Two remain genuinely open — no security-settings UI (F19) and no loading state
on `DataTable` (F21).

The lesson for the next reader: **do not act on the four stale documents without re-verifying
against the code first.**

---

## Verification gates run on every change

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | clean |
| Lint | `npm run lint` | 0 errors (1 warning in generated `coverage/`) |
| Unit tests | `npx vitest run` | 375/375 |
| Build | `npm run build` | ✓ |
| Accessibility | axe, 20 public routes | 20/20 clean |

## Commits

| Commit | Contents |
|---|---|
| `ac38627` | `fix(a11y): meet WCAG 2.2 AA on all public pages` — 22 files |
| `8f7ba1d` | `docs(audit): add 15-phase full site audit with evidence tags` |
| `4b443bb` | `fix(a11y): darken forum Open badge to green-700` |

All three pushed to `main`. App Hosting rebuilt and rolled each automatically.

## Live verification after deploy — `live-verified`

Re-ran the full axe sweep against `https://creedava.com` once the builds rolled, with browser HTTP
cache disabled:

```
/  /about  /services  /contact  /faq  /forum  /join  /news  /privacy  /terms
/satisfaction  /satisfaction/demo  /lp  /login  /nonexistent-page-xyz  /es  /es/services
                                       → 0 violations (17 routes)
```

This is the end state. It was **not** clean on the first pass: `/forum` still failed on the Open
badge (A7) and needed a second commit and a second deploy before the sweep came back green.

---

# Second pass — admin accessibility, then phases 3 → 13

The first pass could not measure admin: the audit browser lost its Firebase cookie and every
`/admin/*` request 307'd to `/login`. A fresh session unblocked the admin half of Phase 2, and the
remaining phases were then worked through.

## Phase 2b — Admin accessibility (`code-only` + `build-verified`, NOT live-verified)

With a working session, axe found real failures on **15 of 16** admin routes. Admin renders in the
dark theme, which had never been measured.

**A8 — solid buttons were illegible in dark theme. 16/16 routes.** `measured`

Dark theme re-maps `--primary` to teal-400 `#2dd4bf`, but every solid button hard-coded
`text-white` → **1.86:1**. Bright teal is *correct* as an accent (`text-primary` on `#202124` needs
a light colour, and darkening the token would break that), so the **foreground** had to flip:

| Token | Light | Dark | Contrast |
|---|---|---|---|
| `--primary-foreground` (new) | `#FFFFFF` | `#0b1220` | 9.25:1 light, 10.06:1 dark, 7.52:1 on the teal-500 hover |

Applied to the shared `Button` and the 9 admin call sites that paired `bg-primary` with white text.

**A9 — the same class of bug in the semantic colours.** `measured`

`--error` `#DA1E28` was **3.22:1** and `--success` `#24A148` was **4.45:1** on cards. Neither had a
dark re-map. Both now have dark values (`#ff8389` = 6.79:1, `#6fdc8c` = 9.42:1) plus paired
foregrounds, and the danger button uses `text-error-foreground`.

**A10 — `--gray-40` in dark is 2.36:1 and carried 169 captions at 10–12px.** `measured`

No value reaches 4.5:1 while staying visually distinct from `--gray-50`, so the 169 call sites moved
to `text-gray-50` (5.23:1). `disabled:text-gray-40` is deliberately preserved: disabled controls are
exempt from WCAG 1.4.3 and the dim colour is the signal that they are disabled.

**A11 — two scrollable regions were not keyboard-focusable.** `build-verified`
The analytics heatmap and the AI chat log were plain `overflow-*` divs. Now `tabIndex={0}` with
`role="region"` and an accessible name.

**A12 — `DataTable` nested interactive controls.** `build-verified`
Rows carried `role="button"` while also containing their own buttons and links (`nested-interactive`).
The role was removed. Rows stay keyboard-activatable for convenience; the real controls live in the
cells.

### Why admin is not marked live-verified

The session expired again mid-sweep. Every `/admin/*` request returned the login page, so those
routes measured the login screen, not admin — the sweep now stamps `[LOGIN]` on any result where
`location.pathname` starts with `/login` so this can't be mistaken for a pass.

Deploy is confirmed by token, not by measurement:

```
--primary-foreground:#0b1220   --primary-foreground:#fff     (live CSS, admin-a11y build)
```

**To finish this:** log in, then re-run the axe sweep over the 16 `/admin/*` routes.

## Phase 3 — Security

**S1 — the admin gate never checked `email_verified`.** `code-only` (was the top open risk)

All three gates checked only the email *domain*:

- `app/api/session/route.ts` — minted the session cookie
- `firestore.rules` `isAdmin()`
- `storage.rules` `isAdmin()`

Email/password sign-up lets a user type any address they like, so an unverified
`anything@creedava.com` would have minted a full admin session and passed both rule predicates.
Google sign-in always sets `email_verified`, so **no real admin is affected** by tightening this.

Fixed in all three, plus `getUidFromSession()` in `/api/ai` — cookies minted before the change stay
valid for up to 5 days, so the cookie alone is not trusted. `email != null` also guards providers
that issue tokens with no email claim.

> The enabled provider list is still `not-verified`. `https://creeda-va.firebaseapp.com/__/auth/handler`
> returns a 462-byte JS shim, and App Check blocks the Identity Toolkit probe endpoints. The fix
> above is deliberately independent of that answer.

**S2 — `/api/booking` had no rate limiting.** `code-only`

A public, unauthenticated endpoint that writes to Firestore *and* queues an admin notification
email, with no throttle — an inbox- and quota-burn vector. `/api/contact` already had a sliding
window, so it was extracted into `lib/utils/rate-limit.ts` and applied to both (5 per 10 min per
client). The module states plainly that in-process state is abuse friction, not a guarantee:
the real ceiling is `limit × live instances`, and App Hosting scales horizontally.

**⚠️ NOT DEPLOYED: `firestore.rules` and `storage.rules`.** They need
`firebase deploy --only firestore:rules,storage`. This was held back on purpose — a bad rules
deploy can lock admins out with no staging environment to catch it first. **This needs your go-ahead.**

## Phase 4 — Performance

`live-verified`, 1280×800, browser cache disabled.

| Route | TTFB (warm) | JS transferred | Requests |
|---|---|---|---|
| `/` | 177 ms | 806 KB | 29 |
| `/services` | 118 ms | 803 KB | 29 |
| `/contact` | 107 ms | 806 KB | 29 |
| `/news` | 40–99 ms | 811 KB | 30 |

**P1 — 351 KB of the 806 KB is `recaptcha__en.js`.** `live-verified`

That is 43% of all JavaScript on the public homepage, loaded for visitors who will never log in. It
arrives because App Check (reCAPTCHA Enterprise) is initialised on the marketing layout — which is
required, since Firestore App Check is enforced and `trackEvent` writes are rejected without a token
(that was the cause of the all-zero analytics dashboard).

So it cannot simply be removed. The options, in order of preference:

1. Initialise App Check lazily and request the token only when an analytics event actually fires.
2. Defer initialisation to `requestIdleCallback` so reCAPTCHA stops competing with LCP.

The first is the real win; both are behaviour changes and were **not** made here.

Worth noting the console is full of `recaptcha/enterprise/anchor … net::ERR_ABORTED` failures in this
browser — so the 351 KB is sometimes being paid for a script that then fails.

**P2 — `/news` cold ISR spikes to ~2.7 s TTFB.** `live-verified`
One measurement of `/news` returned 2737 ms TTFB; four follow-ups returned 40–99 ms. This is a cold
`revalidate = 300` regeneration, not a systemic problem, but a visitor can land on it. Related: the
live header advertises `stale-while-revalidate=31535940` (~1 year) while `apphosting.yaml` declares
`3600` — the ~1-year window is risky for a CMS.

## Phase 6 — Content / i18n parity

`code-only`, no defects found.

`lib/i18n/en.ts` and `lib/i18n/es.ts` both hold **283 keys**, and the key trees match exactly: zero
keys present in one locale only. Comparing values found only 3 identical strings, all legitimate:
`contact@creedava.com`, `privacy@creedava.com`, `legal@creedava.com`. No untranslated copy.

## Phase 7 — Data integrity

`code-only`, one low-severity finding.

`content-briefs.blogId` is written with a **slug** (`content-writer.ts:82`, `blogId: blog.slug`),
while the identically named field in `internal-link-suggestions` holds a **document id**
(`internal-links.ts:91`, `blogId: post.id`) and sits next to a separate `slug` field.
`ai-activity-log.args.blogId` holds a document id.

Nothing currently reads `content-briefs.blogId` as an id, so nothing is broken — the field name just
lies. Worth renaming (`blogSlug`) the next time that schema is touched. Not changed, because that is
a data migration, not a fix.

## Phase 8 — Reliability

`code-only`, two gaps.

- **28 `onSchedule` registrations**, all with explicit `memory` and `timeoutSeconds: 540`, and all
  bound to `GEMINI_API_KEY`. Resource config is solid.
- **No `retryConfig` anywhere.** Scheduled functions therefore default to no retry, so a transient
  failure silently skips that week's SEO run.
- **No alerting config in the repo.** A failed scheduled run is only discovered by opening
  `/admin/seo` and reading `agent-runs`. Nobody is notified.

Combined, these two mean silent weekly data loss is possible and invisible. A failure counter plus a
`retryConfig: { retryCount: 2 }` on the idempotent runs would close it.

## Phase 9 — Responsive

`live-verified` at 320 / 768 / 1280 across 7 routes (21 page loads).

Exactly one overflow: **`/join` scrolled 20 px sideways at 320 px**. The `h1` renders at 54 px
(`--font-size-h1`), so "Consultation" measures 309 px inside 273 px of available width.

Fixed by scaling the display tokens down below 480 px (`scrollWidth` 325 → 305, i.e. exactly the
viewport). Verified by injecting the rule into the live page *before* touching source.

### The bug underneath it — needs a decision, not fixed

The reason the `h1` is 54 px at all is that the bare `h1 … h6` element rules in `globals.css` are
**unlayered**. In Tailwind v4 utilities live in `@layer utilities`, and unlayered CSS outranks every
layer regardless of specificity — so **every `text-*` size class on a heading is silently ignored**.

`measured`: an `h1` with `text-3xl lg:text-4xl` computes to **54 px**, not 30/36 px.

**91 of 109 headings** in the codebase carry a size utility that currently does nothing. Wrapping
those element rules in `@layer base` would fix it — and would resize 91 headings site-wide. That is
a visual change far outside an audit, so it was **not** made. It needs an explicit yes/no.

## Phase 10 — Conversion / analytics

`code-only`, wired correctly.

`data-analytics-cta` appears on 13 elements and is handled in one place
(`components/layout/global-analytics.tsx`, via `target.closest("[data-analytics-cta]")`), which
emits `cta_click` with the marker as the name. No dead markers, no duplicate handlers.

## Phase 11 — Dependencies

`live-verified` against the registry.

- **0 vulnerabilities** (`npm audit --audit-level=low`).
- ~20 packages outdated; the majors behind are eslint 9→10, typescript 5.9→7, vitest 4→5 (+
  `@vitest/coverage-v8` 5), `@vitejs/plugin-react` 5→6, jsdom 28→30, firebase 12→13,
  firebase-admin 13→14, `@testing-library/jest-dom` 6→7.

**No upgrades were applied.** Each major needs its own migration read and its own PR; bundling eight
majors at the end of an audit is how regressions get shipped. The patches/minors left
(`next` 16.4.3→16.4.4, `react`/`react-dom` 19.2.5→19.3.1, `firebase` 12.12.1→12.19.0,
`firebase-admin` 13.8.0→13.10.0, `@playwright/test` 1.59.1→1.64.1, plus `@types/*`) are safe to take
with `npm update`, and CI would catch a break.

## Phase 13 — Build / CI

`code-only` + `live-verified` runs.

- Engines agree: root `node: 24.x`, functions `node: 24`, `.nvmrc` = `24`. Local `v24.15.0` / npm
  `11.12.1`.
- Both lockfiles committed; CI uses `npm ci` with `cache-dependency-path`.
- `.github/workflows/ci.yml` runs **lint → unit tests → build** for the app and **build → unit tests**
  for functions, Node 24, 20/10-minute timeouts, with per-ref concurrency cancellation.
- `gh run list` shows **every push in this session green**, including the ones in this document.

Gaps: CI does not run Playwright e2e, does not gate on accessibility, and has no dependency-audit job.
The a11y one is now cheap to add — the axe harness in this audit is a few dozen lines.

---

# Final status

| # | Phase | Status | Evidence |
|---|---|---|---|
| 1 | Interactive UX | DONE | 16 admin + 15 public routes, 0 console/page errors |
| 2 | Accessibility (public) | DONE | axe 0 violations on 17 routes, live |
| 2b | Accessibility (admin) | PARTIAL | fixed + deployed, live re-measure blocked by expired session |
| 3 | Security | DONE (code) / **rules not deployed** | `email_verified` + booking throttle |
| 4 | Performance | PARTIAL | measured; P1 recommendation not implemented |
| 5 | SEO | DONE | verified live |
| 6 | Content / i18n | DONE | 283/283 keys, 0 untranslated |
| 7 | Data integrity | DONE | 1 low-severity naming finding |
| 8 | Reliability | DONE | 2 gaps documented |
| 9 | Responsive | DONE | 1 overflow fixed; heading-layer bug escalated |
| 10 | Conversion | DONE | markers wired |
| 11 | Dependencies | DONE | 0 vulns; upgrades not applied by design |
| 12 | Code quality | DONE | survey |
| 13 | Build / CI | DONE | green on every push |
| 14 | Test coverage | DONE | 375/375, 65.29% |
| 15 | Documentation accuracy | DONE | 12 of 14 old findings stale |

## Needs your decision

1. **Deploy `firestore.rules` + `storage.rules`** — the security fix is committed but not live.
2. **`@layer base` for headings** — fixes 91 headings, visibly changes the site.
3. **reCAPTCHA 351 KB on public pages** — needs a lazy-init change, not an audit.
4. **Unsubstantiated homepage stats** (`500+`, `98%`, `50+`) vs CRM: 0 clients, 6 leads.
5. **`templateDraft()` filler prose** in `functions/src/seo/content-writer.ts` — a scheduled function
   can publish "This section covers what is x? in depth".

## Commits in this session

| Commit | Contents |
|---|---|
| `ac38627` | public WCAG AA fixes (22 files) |
| `8f7ba1d` | audit doc |
| `4b443bb` | forum Open badge |
| `26cf95c` | doc update |
| `f99457d` | admin dark theme WCAG AA |
| `965bb8c` | security: `email_verified` + booking rate limit |
| `6d06a58` | responsive: 320px overflow |
