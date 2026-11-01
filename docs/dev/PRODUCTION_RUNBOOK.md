# Production Runbook

## Scope

This runbook covers production deploy, validation, and rollback for `creedava.com`.

## Preconditions

- Branch is up to date with `main`
- CI is green (`Workflow lint`, app quality gates, functions build)
- Required GitHub secrets are set:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_TOKEN`
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

## Deploy (GitHub Actions)

Use workflow: `Deploy Firebase`

- Environment: `production`
- Optional input: `site_url` (default `https://creedava.com`)

The workflow runs:
1. Lint, tests, app build
2. Functions build
3. Firebase deploy (`firestore:rules,storage,functions`)
4. Post-deploy smoke checks

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

It also deletes the retired `/pricing` entry and strips duplicated `| CreedaVA`
title suffixes.

## Rollback

If production issues occur:

1. Revert the faulty commit on `main`
2. Re-run `Deploy Firebase` workflow
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
