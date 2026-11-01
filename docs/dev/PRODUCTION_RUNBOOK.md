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

There are two independent targets. A git push does not deploy either one on its own.

### 1. Next.js app (`creedava.com`)

Served by the Firebase App Hosting backend `creeda-va-host` (us-east4).

1. Merge/push to `main` and wait for CI to go green
2. Firebase console → App Hosting → `creeda-va-host` → **Rollouts** → *Roll out* on the new commit
   (or `firebase apphosting:rollouts:create creeda-va-host --git-commit <sha>`)
3. Confirm the rollout reaches `SUCCEEDED` before verifying the site

If no new rollout appears after a push, create one manually — production keeps
serving the previous build until a rollout succeeds. Pushes do create a *build*
automatically; only the rollout step is manual.

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
