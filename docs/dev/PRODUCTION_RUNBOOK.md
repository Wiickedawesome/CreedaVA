# Production Runbook

## Scope

This runbook covers production deploy, validation, and rollback for `creedava.com`.

## Preconditions

- Branch is up to date with `main`
- CI is green (`Workflow lint`, app quality gates, functions build)
- App Hosting variables are configured in `apphosting.yaml`
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` (when App Check is enabled)
  - `NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL`

## Domain and Routing Policy

- Public production origin is `https://creedava.com`
- Client form traffic uses same-origin routes:
  - `/handleFormWebhook`
  - `/getAvailableSlots`
- Next.js rewrites forward those routes to Cloud Functions origin from `NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL`

## Pre-Deploy Checks (Local)

```bash
npm run lint
npm test
npm run build
cd functions && npm run build && cd ..
SITE_URL=https://creedava.com npm run smoke:prod
```

## Deploy

There are two independent targets. A push to `main` does not deploy Cloud
Functions, Firestore rules or Storage rules on its own.

### 1. Next.js app (`creedava.com`)

Served by the Firebase App Hosting backend `creeda-va-host` (us-east4).

1. Merge/push to `main` and wait for CI to go green
2. Firebase console → App Hosting → `creeda-va-host` → **Rollouts** → *Roll out* on the new commit
   (or `firebase apphosting:rollouts:create creeda-va-host --git-commit <sha>`)
3. Confirm the rollout reaches `SUCCEEDED` before verifying the site

A push to `main` *may* create a build and roll it out on its own — but this is
**not reliable**. Measured on 2026-11-06: `fe91306` and `d8b2d72` rolled out
automatically within ~3 minutes, then `b514c4a` did nothing for 20+ minutes with
CI green and no error anywhere. Always confirm the backend's `Updated Date`
(`firebase apphosting:backends:list --project creeda-va`); if it has not moved,
create the rollout yourself with the command in step 2.

Prerendered routes make this harder to see: `/news/<slug>` answers
`x-nextjs-cache: HIT`, so a page that looks stale may simply be a cached prerender.
Poll for a string that only the new build emits rather than for any HTTP 200.

Creating a rollout through the API needs the **numeric** project number inside
the build path, otherwise the call fails with "must conform to
projects/{project}/locations/{location}/backends/{backend}/builds/{build}":

```bash
POST .../v1beta/projects/creeda-va/locations/us-east4/backends/creeda-va-host/rollouts?rolloutId=<id>
{ "build": "projects/53722795216/locations/us-east4/backends/creeda-va-host/builds/<build-id>" }
```

### 2. Cloud Functions, Firestore rules and indexes, Storage rules

```bash
firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```

Changes under `functions/` and `firestore.rules` only reach production through
this deploy, never through an App Hosting rollout.

## Post-Deploy Manual Verification

- Home page loads: `https://creedava.com/`
- Robots + sitemap:
  - `https://creedava.com/robots.txt`
  - `https://creedava.com/sitemap.xml`
- Contact flow submits successfully from `https://creedava.com/contact`
- Booking flow loads slots and submits from `https://creedava.com/join`
- Admin auth flow works end-to-end (`/login` → `/admin`)

### One-off: repair `page-seo`

The on-page audit used to capture inline JSON-LD as body text, which wrote JSON
blobs into `page-seo.description` / `ogDescription`. The site now ignores those
values at read time, but the stored data should be cleaned once:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/repair-page-seo.mjs
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/repair-page-seo.mjs --apply
```

It also deletes the retired `/pricing` entry and strips duplicated `CreedaVA`
branding from titles, dropping titles that say nothing beyond the page name so
the curated defaults in code apply. Re-running it is a no-op once clean.

**Status: applied** (1 deleted, 9 repaired).

## Rollback

If production issues occur:

1. Revert the faulty commit on `main`
2. Roll out the revert commit from App Hosting (see *Deploy* above)
3. Confirm smoke checks pass
4. Re-run manual verification checklist

## Incident Notes Template

Record in PR/incident doc:

- Time detected
- Impacted route(s)
- Root cause
- Rollback commit
- Recovery confirmation time
- Follow-up action items

## Deploy Log

### 2026-11-06 — 2026 design system (`fe91306`)

| | |
|---|---|
| Commits | `df30f61` email palette, `fe91306` marketing + admin design system |
| Merge | fast-forward of `main` (at the time the repo was private and GitHub had PRs disabled) |
| CI on `main` | runs `42246540852` and `42247745653` — `App (lint + test + build)` and `Functions (build / tsc)` both success |
| App Hosting | rolled out automatically; `/pricing` 404 → 200 three minutes after the push |
| Functions | deployed `--only functions`; 52 functions updated in us-east4, all `Successful update operation` |

Verified against production after the rollout:

- Routes `/`, `/about`, `/services`, `/pricing`, `/contact`, `/faq`, `/forum`,
  `/news`, `/join`, `/privacy`, `/terms`, `/login`, `/robots.txt`,
  `/sitemap.xml`, `/manifest.webmanifest`, `/icon.svg`, `/apple-icon`,
  `/opengraph-image` → 200 (`/admin` 307 to `/login`, `/satisfaction` 404 by design).
- `SITE_URL=https://creedava.com npm run smoke:prod` → passed.
- `AUDIT_BASE_URL=https://creedava.com npm run audit:design:live` → 0 errors, 0 warnings.
- `AUDIT_BASE_URL=https://creedava.com npm run audit:design:visual` → 0 errors,
  0 warnings across 14 routes × 1440/375.
- New-build markers present in live HTML: `aria-label="Back to top"`,
  `bg-mk-brand-deep`; `/pricing` metadata carries
  `og:image = https://creedava.com/opengraph-image`.

Post-deploy function health: `/getAvailableSlots` → 200; `/handleFormWebhook`
→ 401 `Missing or invalid App Check token`, which is the expected rejection of
an unsigned request (`functions/src/webhooks.ts:263`), not a failure.

The functions deploy was initially blocked — the Firebase CLI was signed in as
`info@guianegocios.net`, which only reaches `guianegocios-prod`. Re-authenticating
as `john@creedava.com` unblocked it. The deployed email HTML was **not** visually
verified; there is no way to render a scheduled digest without triggering a send,
so the palette change is proven by the committed source plus a successful deploy.

### Repo visibility change (2026-11-06)

`Wiickedawesome/CreedaVA` was made public during this release. That removed the
free-plan restriction that had blanked the pull-request and issue surfaces.
`has_issues` also had to be re-enabled explicitly (`PATCH /repos/... -F has_issues=true`);
it was still `false` after the flip to public.

⚠️ `GET /repos/.../pulls` still returned **404** after both changes, while the
GraphQL `repository.pullRequests` connection resolved normally with
`totalCount: 0`. Treat the REST 404 as a stale edge response and use GraphQL
(`gh pr list`, `gh pr create`) to confirm before concluding PRs are disabled.

### 2026-11-06 (later) — article template: left rail, sourced content

| | |
|---|---|
| Commits | `7b27cfa` rebuilt article page · `d8b2d72` rail from 900px · `b514c4a` left rail + sources + content rules |
| Rollout | **manual** — `b514c4a` did not roll out on push; `apphosting:rollouts:create --git-commit b514c4a` did it |
| CI | `42261852091` success |
| Functions | not redeployed; no function code changed |

Verified live at 1260×1000: contents rail on the left (`navLeft 32`, body starts
at 280, `border-left` 0.66px, `text-align: start`, `padding-left: 20px`), 6
contents items, 0 px horizontal overflow, `/news` and both posts 200,
`smoke:prod` pass.

**Not fixed by this deploy: the two published posts are still short and
unreferenced.** Measured body: **789 words, 6 `<h2>`s, 0 references**. The
`references` block renders only when a post has them, so it is absent — correct
behaviour, not a bug. The content rules now demand 1,200–1,600 words with a
citation on every claim, but that only affects **newly generated** posts.
Lengthening the existing two needs a regeneration from Admin → Blog → AI, which
requires a signed-in admin session (Google popup; no credentials are available
to the assistant, and writing to `blog` from a script is a production data
mutation that needs the owner's approval first).
