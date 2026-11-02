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

## Commit

`ac38627` — `fix(a11y): meet WCAG 2.2 AA on all public pages` (22 files).
Pushed to `main`; App Hosting rebuilds automatically in roughly 12 minutes.
`live-verified` status of the deploy: **pending at time of writing** — see the note below.

## Remaining phases

3 (security), 4 (performance/CWV), 6 (content/i18n parity), 7 (data integrity), 8 (reliability),
9 (responsive), 10 (conversion), 13 (build/CI), plus the admin accessibility migration in §Phase 2
and the finalisation of Phase 11.

Highest-risk items already identified and still open:

1. **`email_verified` is never checked** — not in `/api/session`, not in `firestore.rules`
   `isAdmin()`, not in `/api/ai`. `code-only`; provider list unconfirmed.
2. **Unsubstantiated homepage statistics** (Phase 1) — owner decision.
3. **`templateDraft()` in `functions/src/seo/content-writer.ts`** still emits filler prose
   ("This section covers what is x? in depth"). A scheduled function can publish it.
