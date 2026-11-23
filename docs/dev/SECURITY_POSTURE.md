# Security posture — scans, alerts and why each is resolved the way it is

Last reviewed: **2026-11-12**. Every statement here was measured against this
repository or the Google Cloud project `creeda-va`, not assumed.

## State at time of writing

Fixed in `6b51e0c`. All three scanners verified at `0` open alerts after the
push — not asserted, queried:

```
dependabot open: 0     codescan open: 0     secret-scanning open: 0
```

The dependency fix was confirmed independently of the alert counter, because
the counter lags: `GET /dependency-graph/sbom` at `6b51e0c` resolves
`node-forge@1.4.3` and `fast-xml-parser@5.12.0`, and the graph diff against the
previous commit lists `node-forge 1.4.2` and `fast-xml-parser 5.7.2` as
removed. GitHub took roughly 25 minutes to re-evaluate the alerts and mark them
`fixed`; there is no API to force that sweep.

## The three scanners

| Scanner | Where it runs | What it looks at |
|---|---|---|
| Dependabot | GitHub, on push to `main` + scheduled | `package-lock.json`, `functions/package-lock.json` |
| CodeQL code scanning | GitHub Actions | `.github/workflows/*.yml` (Actions only — no SAST language pack is enabled) |
| Secret scanning | GitHub | every committed file, plus push-protection on new commits |

## Dependency advisories — fixed by pinning, not by a major bump

Five advisories arrived at once through `firebase-admin`: four in `node-forge`
and one in `fast-xml-parser`. Both sit deep in the tree, so touching
`firebase-admin` itself was unnecessary — an override targets the actual
package.

| Package | Was | Now | Reason |
|---|---|---|---|
| `node-forge` | `1.4.2` | `1.4.3` | GHSA-6889-vf6x-f3g5, GHSA-j8rw-jp99-435v, GHSA-w4xr-hqv8-ch44, GHSA-6cv4-p8m7-4r25 all fix at 1.4.3 |
| `fast-xml-parser` | `5.7.2` (transitive) | `5.12.0` | GHSA-474x-hrwr-fgx4 fixes at 5.12.0 |

Both are **patch/minor** bumps pinned through the existing `overrides` block in
`package.json` **and** `functions/package.json` — the two manifests are scanned
separately, so a pin in only one leaves half the alerts open. That is why the
alert count was 10 for 5 distinct advisories.

`functions/package.json` had no `node-forge` override at all; it resolved
`1.4.2` straight from `firebase-admin`. Added.

Verified after: `npm audit` reports **0 vulnerabilities** in both packages, `tsc`
clean in both, 496/496 tests, production build OK.

**Do not "fix" these by upgrading `firebase-admin` to 14.x.** The overrides also
pin `@google-cloud/firestore@8.5.0` and several `google-gax` internals; a major
`firebase-admin` bump would fight those pins. The patch-level override is both
smaller and sufficient.

## Code scanning — least privilege on the workflow

`actions/missing-workflow-permissions` fired twice because `ci.yml` declared no
`permissions:`. Both jobs only check out the repo and run npm, so the whole
workflow is read-only:

```yaml
permissions:
  contents: read
```

Declared once at workflow level, so a step that is later compromised cannot
inherit a write scope. `ci.yml` is the only workflow in this repository.

## Secret scanning — the Firebase web API key is not a secret

Four alerts pointed at `apphosting.yaml`:

```yaml
- variable: NEXT_PUBLIC_FIREBASE_API_KEY
  value: AIza...
```

Resolved as **false positive**, and that classification is deliberate rather than
convenient:

1. The name is `NEXT_PUBLIC_*`, so Next.js **inlines this value into the browser
   bundle at build time**. It is served to every visitor by design. A value that
   ships to the client cannot also be confidential.
2. A Firebase Web API key identifies the project; it is not a credential. Google
   documents it as safe to include in client code. This is the same class of
   value as a Supabase `anon` key.
3. Real access control lives elsewhere, and was verified present:
   - `firestore.rules` and `storage.rules` both end in
     `match /{document=**} { allow read, write: if false; }` — deny by default,
     so possession of the key grants no data access.
   - App Check is on (`NEXT_PUBLIC_ENABLE_APP_CHECK: "true"`).
   - `authorizedDomains` limits where Auth will issue tokens.
   - The key is restricted to 30 specific API targets.
4. Storing it in Secret Manager would be *worse*: it would imply a
   confidentiality guarantee that does not exist, and App Hosting must still
   resolve it to a plain build-time value.

The four alerts were one key across four historical commits, not four keys.

### Open hardening item — no HTTP referrer restriction on that key

Measured on 2026-11-11 via the API Keys API:

```
displayName: Browser key (auto created by Firebase)
browserKeyRestrictions: NONE      <- no origin allowlist
apiTargets: 30
```

The key has **API restrictions but no referrer restrictions**, so it can be used
from any origin. Because the security rules are deny-by-default this does not
expose data, but it does leave the project's quota available to anyone who copies
the key out of the page source.

Deliberately **not** changed in this pass: getting the origin list wrong breaks
sign-in for every visitor, and the signed-in flows cannot be verified from a
development machine without credentials. The fix is one call once someone can
confirm it end to end:

```
# allowedReferrers must include every origin that loads the SDK:
#   https://creedava.com/*
#   https://creeda-va.firebaseapp.com/*
#   https://creeda-va.web.app/*
#   https://creeda-va-host--creeda-va.us-east4.hosted.app/*
#   http://localhost:*/*   (only if .env.local uses this key)
```

## What this document does not cover

- **No SAST is running.** CodeQL is enabled only for `actions`, so application
  code (TypeScript, 500+ files) receives no static analysis. Enabling
  `javascript-typescript` is a separate decision with a real first-run cost.
- **Cloud Functions are not in CI.** `functions/` is type-checked, not tested or
  deployed, by `ci.yml`.
- Dismissed alerts re-open when a *new* value matches, so a genuinely leaked key
  added to `apphosting.yaml` tomorrow will still alert.

---

# 2026-11-23 — Next.js advisories cleared, dependency majors reviewed

## Next.js: 7 advisories, all fixed by one version bump

Measured with `gh api repos/Wiickedawesome/CreedaVA/dependabot/alerts?state=open`
on 2026-11-23: **7 open alerts, all `next`, all medium, all patched in
`16.4.5`**. The installed version was `16.4.3`.

`next` 16.4.3 also ships a **build-time guard**: the first `next build` aborts
with

```
Error [SecurityFatalError]: Your version of Next.js is affected by a known
security vulnerability.
```

and the *retry* succeeds, so CI and local runs only fail intermittently. Do not
treat that error as spurious — it is the SDK telling you to upgrade.

Landed: `next@16.4.6` + `eslint-config-next@16.4.6` (`package.json` already
allowed it via `^16.4.3`; only the lockfile was stale). Verification:

| Gate | Result |
|---|---|
| `npm run lint` | clean (0 errors, 0 warnings) |
| `npm test` | 560/560 |
| `npm run build` | exit 0, no `SecurityFatalError` |
| `npm audit --omit=dev` | 0 vulnerabilities |

The GitHub alert counter updates only after the commit is pushed **and** GitHub
re-sweeps the dependency graph (~25 min, no API to force it). Until then the 7
alerts stay open even though the lockfile resolves `next@16.4.6`.

## Transitive conflict: `@firebase/app`

`firebase@13` needs `@firebase/app-check@0.13.2`, which imports
`_setTrustedScriptSrc` from `@firebase/app`. `firebase-admin@13` pins
`@firebase/app@0.16.2` (via `@firebase/database-compat`), and npm hoisted that
copy, so the Turbopack build failed with:

```
Error: Export _setTrustedScriptSrc doesn't exist in target module
```

Fixed with an explicit override in `package.json`:

```json
"@firebase/app": "0.16.7"
```

This is the same override pattern already used for `node-forge` and
`fast-xml-parser`. Both packages are in the same `0.16` line, and the app does
not use Realtime Database, which is the only admin feature that touches it.

## Current pins and the two majors deliberately not taken

`npm outdated` now reports only these, each blocked by a verified upstream
constraint — not by preference:

| Package | Installed | Latest | Blocker (measured) |
|---|---|---|---|
| `firebase-admin` | 13.10.0 | 14.5.1 | v14 removes the namespace API: `admin.apps`, `admin.firestore()`, `admin.auth()`, `admin.appCheck()`. `functions/` uses it in ~10 files and `lib/firebase-admin.ts` uses `admin.apps`/`admin.credential`. Migrating means editing every call site and exercising triggers, which cannot be verified without a Functions deploy. |
| `typescript` | 6.0.3 | 7.0.2 | `typescript-eslint` (via `eslint-config-next`) refuses TS 7.0 by design: *"typescript-eslint does not support TS 7.0."* Upstream tracking: typescript-eslint#10940, targeted at TS ≥ 7.1. TS **6.0.3** is the newest version that keeps `npm run lint` working, and everything else is green on it. |

Everything else moved: `firebase` 12 → **13.4.0**, `eslint` 9 → **10.15.0**,
`vitest` 4 → **5.1.1** (both manifests), `@vitejs/plugin-react` 5 → **6.3.0**,
`jsdom` 28 → **31.0.1**, `@testing-library/jest-dom` 6 → **8.0.0**,
`@types/node` 25 → **26.6.6**, `@playwright/test` → **1.65.1**,
`googleapis` 171 → **190** (functions).

`firebase@13`'s only breaking changes are in Firebase AI Logic
(`firebase/ai`): the `VertexAIBackend`/template API removal. This app uses
`@google/genai` and `@google/generative-ai` directly and never imports
`firebase/ai` (verified by grep), so the upgrade was a no-op at the API level.
`initializeAppCheck` always passes a provider, which v13 requires.
