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
