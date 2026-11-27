# Admin Section Audit — 2026-11-26

**Status:** PARTIAL — Phase 0 (source/API/headers), Phase 1 (live route sweep) and the
remediation pass in **section C3** are done. Backlink analysis, accessibility, and
responsive/dark-mode testing remain **NOT YET DONE**.

Scope: `app/(admin)`, `app/api`, `proxy.ts`, `next.config.mjs`, `lib/firebase-admin.ts`,
`lib/constants/security`, `firestore.rules`, `app/api/ai/rate-limit.ts`.

Legend: **VERIFIED** = read in source this session · **OBSERVED** = seen in live browser
· **ASSUMED** = not confirmed.

---

## A. Findings (ordered by risk)

### A1 — `/admin/*` route gate accepts any cookie value. **HIGH (defense-in-depth) — FIXED, see C3**

**VERIFIED** — `proxy.ts`

```ts
const session = request.cookies.get("__session");
if (!session?.value) { /* redirect to /login */ }
```

Presence-only check. No signature, no `verifySessionCookie`, no expiry check. Any client
that sends `__session=x` gets past the gate and receives the admin HTML shell (200).

Real data is still protected: `firestore.rules` gates on `isAdmin` with
`email_verified`, and admin pages fetch through the client SDK under those rules.
So this is **not** a data breach — it is a broken outer fence.

Why it still matters for production/enterprise:
- Admin UI shell, navigation structure, and any server-rendered admin markup are exposed.
- Any future server component or route handler that reads `adminDb` and trusts "the
  proxy already let them in" becomes an instant full compromise. The current codebase
  happens to always re-check (`getAdminUidFromSession`) — but that is discipline, not
  structure.
- SOC 2 / pen-test finding: "authentication control does not validate the credential."

**Fix:** verify the session cookie in `proxy.ts` via Firebase Admin
(`adminAuth.verifySessionCookie(cookie, true)`) and redirect on failure. Cache the
verification result per-request to avoid a round trip on every asset. Requires moving
`proxy.ts` to the Node runtime (Admin SDK is not Edge-compatible) or verifying via a
lighter JWT check with the public keys from Firebase's JWKS endpoint.

---

### A2 — CSP is effectively disabled by `unsafe-inline` + `unsafe-eval`. **HIGH — PARTIALLY FIXED, see C3**

**VERIFIED** — `next.config.mjs`

```
default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';
script-src  'self' 'unsafe-inline' 'unsafe-eval' https:;
```

`script-src` with both `unsafe-inline` and `unsafe-eval`, plus a bare `https:` source,
permits script from any HTTPS origin. The policy is present in the response but provides
almost no XSS mitigation. `object-src` is unset (falls back to `default-src`, which
allows `https:` and `data:`).

This compounds A1: because the session cookie is `httpOnly`, XSS alone cannot read it —
but `/api/session` GET mints a **custom token** from that cookie (see A3), so XSS →
`GET /api/session` → full client-side auth as the admin.

**Fix:** move to a nonce-based `script-src` (Next.js supports `headers()` nonce
injection), drop `unsafe-eval` in production, remove the bare `https:` from
`script-src`, add `object-src 'none'` and `base-uri 'self'`.

---

### A3 — `GET /api/session` converts the httpOnly cookie into a JS-readable credential. **MEDIUM — MITIGATED, see C3**

**VERIFIED** — `app/api/session/route.ts`

```
1. verifySessionCookie(cookie)   → uid
2. createCustomToken(uid)        → returned in JSON body
```

Design intent is legitimate and well documented (storage-restricted browsers lose the
client SDK session on reload). But the security consequence is stated plainly:

- `httpOnly` exists to stop JS from reading the session. This endpoint hands JS a
  credential equivalent to the session.
- That makes the whole model XSS-sensitive, which A2 makes meaningful.
- Custom tokens are bearer credentials valid for one hour and exchangeable for an ID
  token with no further check.

**Mitigations already in place (VERIFIED):** `next.config.mjs` sets
`Cache-Control: no-store, must-revalidate` for `/api/(.*)`. `SameSite=Lax` means
cross-site top-level GET navigation does send the cookie, but the JSON body is not
readable cross-origin.

**Fix (pick one):**
1. Keep the endpoint but require a same-origin `Origin`/`Sec-Fetch-Site` check, and
   rate-limit it per uid.
2. Replace it with a server-set short-lived cookie refresh path so no custom token ever
   crosses to JS.
3. Accept the tradeoff explicitly, documented, and harden A2 to compensate.

---

### A4 — No `__Host-` prefix on the session cookie. **LOW — FIXED, see C3**

**VERIFIED** — `app/api/session/route.ts` → `SESSION_COOKIE_NAME`.

Cookie is `httpOnly; secure; sameSite=lax; path=/`. Without the `__Host-` prefix, a
subdomain (or a compromised subdomain takeover on a sibling host) can set a
domain-scoped `__session` cookie that shadows or overwrites the host-only one.
Renaming to `__Host-__session` forces host-only + Secure + Path=/ by the browser.

Cost: touches proxy, API, and client guard. Do it once, not mid-incident.

---

### A5 — `X-XSS-Protection: 1; mode=block` is a deprecated anti-pattern. **LOW — FIXED, see C3**

**VERIFIED** — `next.config.mjs`. The header was removed from all major browsers; on
the ones that still honour it, `mode=block` can itself introduce a XSS vector. The
modern equivalent is a real CSP (A2). Remove the header.

`X-Frame-Options` is commented out and deliberately replaced by
`frame-ancestors 'self' https://creedava.com http://localhost:* https://creeda-va.firebaseapp.com`.
`frame-ancestors` **is** supported and is the correct control, so clickjacking is covered
— but `http://localhost:*` in a production policy is an unnecessary allowance and should
be stripped from the production build.

---

### A6 — `proxy.ts` matcher does not cover `app/(admin)` siblings. **INFO**

**VERIFIED** — `matcher: ["/admin/:path*"]`.

Confirmed: the `(admin)` route group's only URL space is `/admin/*`, so the matcher is
correct today. Noting it because adding any admin page outside `/admin` silently skips
the gate entirely. A comment on the matcher would prevent that.

---

## B. Verified as correct

Do not "fix" these — they are right.

- `firestore.rules` gates on `isAdmin` **and** `email_verified`. Forged-cookie access
  (A1) does not yield data. *(VERIFIED)*
- `POST /api/session` verifies the ID token with `checkRevoked: true`, enforces
  `@creedava.com`, **and** requires `email_verified === true` — the comment explains why
  domain alone is insufficient (self-service signup). This is the correct control and it
  is correctly ordered. *(VERIFIED)*
- Cookie is set on the **response**, not via `cookies()`, with a comment recording the
  bug that motivated it (POST 200 with no `Set-Cookie` → redirect loop). *(VERIFIED)*
- Session duration comes from `SESSION_MAX_AGE_SECONDS` (`lib/constants/security`), not a
  literal. *(VERIFIED)*
- `/api/ai` and `/api/brand/creative` both call `getAdminUidFromSession()` before any
  work, return 401 with no uid, then rate-limit, then validate. Correct order.
  *(VERIFIED)*
- Rate limiting is **Firestore-backed transactional fixed windows**, not in-memory — so
  it holds across App Hosting instances instead of being bypassable by scale-out. Three
  separate budgets for three cost tiers (60/hr text, 20/day grounded, 10/hr image).
  This is better than most production code. *(VERIFIED)*
- `Cache-Control: no-store` on all `/api/*`. *(VERIFIED)*
- Admin route group sets `robots: { index: false, follow: false }`. *(VERIFIED)*
- HSTS `max-age=63072000; includeSubDomains; preload`. *(VERIFIED)*
- `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
  with camera/mic denied. *(VERIFIED)*
- `serverExternalPackages: ["firebase-admin"]` so native modules are not bundled.
  *(VERIFIED)*
- `canUseAdminDb` guards prerender-time reads against build phase without credentials.
  *(VERIFIED)*

---

## C. NOT YET AUDITED — explicitly not claimed

These were requested and are **not done**. Do not read this report as covering them.

> Updated 2026-11-27: items 1, 2 (SEO suite) and 10 are **done** — see section C2.

1. ~~**Live route sweep.**~~ Done 2026-11-27, see C2.
2. ~~**Per-page functional testing.**~~ Done for the SEO suite (C2). Studio, blog editor,
   calendar, data table and findings list still untested beyond rendering.
3. **Backlink audit.** Zero external backlink data collected. No Search Console, Ahrefs,
   or equivalent access used.
4. **Broken-link / redirect map.** Not crawled.
5. **Firestore rules completeness.** `isAdmin` helper and the shape of the rules file were
   reviewed earlier this session; a rule-by-rule coverage table was not produced.
6. **SEO of the admin section** beyond `noindex` — not relevant, not tested.
7. **Accessibility, responsive behaviour, dark mode** across admin pages — not tested.
8. **`e2e/` and emulator smoke scripts** — not run this session. (`npm run test:e2e` needs a
   server on :3000 and the Playwright `webServer` block is commented out, so it must be
   started manually.)
9. ~~**Dependency/CVE scan**~~ Done 2026-11-27: `npm audit --omit=dev` → **0 vulnerabilities**
   for the app and **0** for `functions`.
10. ~~**Console/network capture** on the live admin.~~ Done 2026-11-27 — that capture is what
    exposed the missing App Check header (C2).
11. **Live interaction testing (sort, search, tabs, modals, pagination).** Attempted and
    **blocked**: in the embedded audit browser the Firestore reads fail intermittently
    (App Check token never mints), so the tables render empty and there is nothing to
    interact with. Source review found no defect in that path, but it is **not verified
    live**. Needs a real Chrome session.
12. **Accessibility, responsive layout, dark mode.** Not tested as a pass. One measurement
    only: `/admin/leads` at 375 px wide had **0 px** horizontal overflow.

---

## C2. Phase 1 — live route sweep (2026-11-27, added)

### Method and its one real limitation

Pages were loaded one at a time with `domcontentloaded` + ~6.5 s settle, then inspected for
HTTP status, `h1`, table rows, error UI, and Firestore permission warnings.

**`networkidle` must never be used on this site.** Firestore holds a long-poll `Listen/channel`
open for the life of the page, so `networkidle` never fires and every navigation times out.
The first pass of this audit used it and produced 24 bogus timeouts.

**Limitation:** the embedded browser the audit ran in cannot mint an App Check token —
measured by request interception: the Firestore `Listen/channel` request carries **no
`X-Firebase-AppCheck` header**, and `recaptcha/enterprise/anchor` requests fail with
`net::ERR_ABORTED`. Firestore has App Check enforced, so reads inside that browser return
`PERMISSION_DENIED: Missing or insufficient permissions` **intermittently**. Real Chrome is
unaffected. Findings that depend on read success are therefore marked with their evidence
rather than asserted.

### Routes verified to return 200 and render

`/admin`, `/admin/leads` (10 live rows), `/admin/seo` (30 rows), `/admin/blog`, `/admin/forum`,
`/admin/studio`, `/admin/contacts`, `/admin/customers`, `/admin/bookings`, `/admin/analytics`,
`/admin/settings`, `/admin/emails`, `/admin/metadata` (8 rows), `/admin/keywords`.

The seven `app/(admin)/admin/seo/{audits,briefs,content,keywords,outreach,rankings,tasks}`
routes are 6-line redirect stubs onto `ADMIN_ROUTE_ALIASES`; their differing headings are
correct behaviour, not mis-routing.

### P1 — SEO agent concurrency lock and cursor restore never worked. **HIGH — FIXED**

`functions/src/seo-agent.ts` issued two 3-field queries:

```js
.where("skill","==",x).where("status","==","in-progress").orderBy("startedAt","desc")
.where("skill","==",x).where("status","==","partial").orderBy("startedAt","desc")
```

`firestore.indexes.json` only defines 2-field `agent-runs` indexes — `(skill, startedAt)` and
`(status, startedAt)`. Neither serves a 3-field query, so both threw `FAILED_PRECONDITION`,
and both were wrapped in `.catch(() => null)`, so the failure was invisible.

Consequences:
- the lock never engaged, so nothing deduplicated runs — measured 8 `onpage-audit` runs on
  2026-11-25 between 09:05 and 10:30 EST, none on the Monday schedule slot;
- the cursor was always `null`, so `functions/src/seo/backlinks.ts` resumed at `offset 0`
  on every run, re-scanning the same queries, ending `partial`, and never advancing —
  which is exactly the observed 2026-11-26 `backlinks-resources = partial` with its full
  80-query budget spent.

**Fix applied:** removed `orderBy` from both queries (two equalities use single-field
indexes, so no composite index is required) and select the newest row in memory. Both
`catch` blocks now log instead of swallowing. Verified: `npm --prefix functions run build`
clean, **107/107 functions tests pass**.

### P2 — "Findings" was reporting a page count. **MEDIUM — FIXED**

`functions/src/seo/onpage.ts` returned `findings: processed`, where `processed` is the number
of URLs audited. The sitemap contains exactly **15** URLs (measured live:
`curl -s https://creedava.com/sitemap.xml | grep -c '<loc>'` → `15`), which is why every
onpage run reported precisely 15. `agent-dashboard.tsx` summed that value into a "Findings"
stat card, so the figure was a mix of URL counts and document counts.

**Fix applied:** `findings: collected.length` — the number of findings actually detected.

### P3 — Admin lists show "no data" when the read failed. **MEDIUM — OPEN**

Measured: `/admin/blog` rendered *"No posts yet — create one or let AI generate a draft"*
while its Firestore read was denied. `/admin/contacts`, `/admin/customers`, `/admin/settings`,
`/admin/emails`, `/admin/keywords` and `/admin/forum` likewise rendered empty with no error
state. Only `/admin/analytics` surfaces a failure (`"Failed to load analytics data."`).

Any admin whose browser blocks reCAPTCHA (ad-blocker, privacy mode, corporate firewall)
will see an empty list and conclude their content is gone.

**Fix (not applied):** every list must distinguish "empty" from "failed to load".

### P4 — Test records in production data. **LOW — OPEN**

`/admin/leads` contains repeated `Test User / test@example.com` rows from `contact-page`
with an empty company field. Either seed a demo record deliberately or reject/test-filter them.

### P5 — Revenue panel is all zeros. **INFO — not a bug**

`app/(admin)/admin/page.tsx` derives MRR from `customers` where `status === "active"` and
sums `monthlyValue`. The customers collection is readable and genuinely has **0 active**
customers, so $0 is arithmetically correct. The gap is presentation: the panel does not say
"no active customers" rather than implying missing data or a broken calculation.

### P6 — A1, A2 and A5 now confirmed against production, not just source

| Test | Result |
|---|---|
| `GET /admin` with `Cookie: __session=not-a-real-session` | **200, 21,605 bytes of admin HTML** |
| `GET /admin` with no cookie | `307` → `/login?from=%2Fadmin` |
| Response CSP | `default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'` … |
| `X-XSS-Protection` | `1; mode=block` |

### WITHDRAWN — do not re-raise either of these

1. **"Session restore mints a custom token with no claims, so `isAdmin()` is always false."**
   Wrong. `email` and `email_verified` are standard ID-token claims taken from the user
   record; they are not custom claims. Evidence: the admin sidebar renders `user?.email` as
   `john@creedava.com` from the restored session, and `/admin/leads` returned 10 live rows.
2. **"The deployed Firestore ruleset differs from the repo."** Wrong. It was inferred from
   collection-specific denials, but `blog` is `allow read: if true` and was still denied —
   impossible under any ruleset. The real cause is the missing App Check token described
   above. No rules deploy was performed or is indicated.

### P7 — Dead code found

`functions/src/scheduled.ts` duplicates `dailyDigest`, `weeklyReport`, `monthlyReport` and
`dailyGoogleSync`; `functions/src/index.ts` exports the `scheduled-reports.ts` and
`scheduled-sync.ts` versions. `scheduled.ts` is not imported by anything.

---

## C3. Remediation applied 2026-11-27

Every claim below was verified against a **production build** served locally
(`npm run build && next start`), not just this source tree.

### Fixed

| ID | Change | Verification |
|---|---|---|
| **A1** | `app/(admin)/layout.tsx` is now `async` and calls `getAdminUidFromSession()`. A forged cookie reaches no admin content. The proxy keeps its cheap presence check as a fast path. | `GET /admin` with `Cookie: __session=not-a-real-session` → **307 → /login** (was **200, 21,605 bytes**) |
| **A2** | `script-src` no longer accepts a bare `https:`; every third-party script host is named. Added `object-src 'none'`, `base-uri 'self'`, `worker-src`. `frame-ancestors` allows `localhost` only in development. `'unsafe-eval'` is development-only. | Emitted header inspected from the running build. **Live browser test: 0 CSP violations across `/`, `/pricing`, `/services`, `/about`, `/contact`, `/login`, `/admin`.** |
| **A4** | `SESSION_COOKIE_NAME` is `__Host-__session` in production, `__session` in development (`__Host-` requires Secure, which dev does not set). `proxy.ts` now reads the shared constant instead of a hard-coded string. | Both `__session` and `__Host-__session` forged values → **307 → /login** |
| **A3** | `GET /api/session` now refuses requests whose `sec-fetch-site` is `cross-site` or `same-site`, so a page on another origin cannot redeem the httpOnly cookie for a custom token. Only an explicit cross-origin value is rejected, so older clients and server-side calls are unaffected. | `tsc` + **618/618 tests** |
| **A5** | `X-XSS-Protection` header removed. | Absent from the response headers |
| **P8** | The sign-in screen mapped `auth/internal-error` to "the security check (reCAPTCHA) could not complete", which sends the reader off to disable an ad-blocker. Measured 2026-11-27: that code also fires when App Check is **disabled** for the build while the project enforces it — a localhost build, for instance — so the advice was simply wrong. The catch-all now states only what is knowable and includes the code for a reportable failure. | `tsc` + **618/618 tests** |
| **C2/P1** | SEO agent lock + cursor queries no longer require a missing composite index; failures log instead of being swallowed. | `functions` build clean, **107/107 tests** |
| **C2/P2** | `onpage-audit` reports real findings instead of the sitemap size. | Code review + build |
| **C2/P3** | `DataTable` gained `error`/`onRetry`, and a shared `LoadError` covers the non-table surfaces. Wired into blog, bookings, contacts, customers, emails, forum, keywords, keyword-gaps, leads, campaigns, landing-pages, metadata, SEO agent dashboard and settings. **Settings now disables Save while its read is failing**, because blank defaults could otherwise be written over real configuration. | `tsc` + **618/618 tests** |
| **C2/P4** | Obvious smoke-test leads are detected (RFC 2606 `example.com`/`example.org` addresses and `Test …` names), excluded from every KPI, and **hidden by default behind a toggle that reports the count**. Nothing is deleted. | `tsc` + tests |
| **C2/P7** | `functions/src/scheduled.ts` deleted — it duplicated `scheduled-reports.ts`, `scheduled-sync.ts`, `scheduled-seo.ts` and `scheduled-cleanup.ts`, and nothing imported it. `ARCHITECTURE.md` and `FIREBASE.md` updated. | `tsc` + build |

Emitted production CSP (measured):

```
default-src 'self' https: data:;
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google.com
            https://www.recaptcha.net https://www.gstatic.com https://apis.google.com
            https://*.firebaseapp.com;
style-src 'self' 'unsafe-inline'; connect-src 'self' https:; frame-src 'self' https:;
img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com;
worker-src 'self' https://www.gstatic.com; object-src 'none'; base-uri 'self';
frame-ancestors 'self' https://creedava.com https://creeda-va.firebaseapp.com
```

### Deliberately not changed, with the reason

- **`script-src 'unsafe-inline'`** — Next.js inlines its bootstrap and the app relies on
  runtime injection. Removing it needs a nonce generated per request and threaded through
  the proxy; that is a separate change, not a header edit, and doing it half-way breaks the
  app. **This is the remaining half of A2** and the reason it is marked PARTIAL.
- **Tightening `connect-src`/`frame-src`/`img-src`** — these still allow bare `https:`.
  They are the correct next step once the nonce work is done; tightening them now would be
  unverifiable without a deploy.

### RESOLVED 2026-11-27 — the uncommitted brand/creative work was discarded

`git status` at the start of this audit showed **568 insertions / 369 deletions** across the
brand creative pipeline that this audit did not author:

| Path | Was |
|---|---|
| `lib/brand/creative.ts` | 372 lines changed |
| `lib/brand/creative-render.tsx` | 86 lines changed |
| `lib/brand/creative-pipeline.ts` | 63 lines changed |
| `lib/brand/creative-photo.ts` | **deleted (73 lines)** |
| `__tests__/lib/brand/creative-photo.test.ts` | **deleted (72 lines)** |
| `app/(admin)/admin/studio/page.tsx` | 45 lines changed |
| `app/api/brand/creative/route.ts` | 18 lines changed |
| `app/api/ai/rate-limit.ts` | 1 comment line |

`libraryPhotoUrl` and `fetchPhotoDataUrl` existed nowhere in that tree, so the photo library
and its tests had been **removed rather than relocated**.

**Owner ruling:** this was abandoned work on the old image studio — repeatedly rewritten and
never correct. Discarded.

**How:** `git stash push -m "old image studio WIP - discarded 2026-11-27 (owner: junk)"` on
exactly those paths. Nothing was destroyed; `git stash list` still holds it as `stash@{0}` if
any of it is ever wanted. The committed studio is restored, including `creative-photo.ts` and
its test file.

**Verified after restoring:** `tsc` clean · ESLint clean · app **618 passed / 54 files** ·
functions **107 passed** · production build compiles. The counts differ from the 622/53 seen
while the WIP was present because the WIP had deleted the photo test file and added cases to
`creative.test.ts` — 618/54 is the committed baseline.

**Note:** the discarded batch also contained a one-line comment correction in
`app/api/ai/rate-limit.ts` (`~$0.03 per image` → `~$0.05 per 2K image`). It was reverted with
the rest. If that wording is preferred it is a one-line change to re-apply on its own.

### A2 regression caught by testing — read this before editing the allowlist

The first version of the allowlist named only the hosts referenced in this repo and **broke
Google Ads conversion tracking.** Loaded in a real browser, `/` and `/pricing` produced:

```
Loading the script 'https://googleads.g.doubleclick.net/pagead/viewthroughconversion/…'
```

Nothing in this repository references that host. It is injected by gtag because the **GA4
property has a Google Ads link**, so the allowlist cannot be derived from the code — it has to
be verified against a running site.

Four hosts were added: `googleads.g.doubleclick.net`, `www.googleadservices.com`,
`pagead2.googlesyndication.com`, `www.google-analytics.com`. Re-tested: **0 violations across
seven pages.**

**Standing rule:** after any analytics/ads change, load the site and filter the console for
`Content Security Policy`. A blocked conversion script fails silently — the page looks fine
and the numbers just stop.

**Limitation of that test:** the local build runs with `NEXT_PUBLIC_ENABLE_APP_CHECK=false`, so
reCAPTCHA never loaded and the reCAPTCHA entries in the allowlist were not exercised. They come
from `app-check.ts` and `messaging-sw-source.ts` (`www.google.com`, `www.recaptcha.net`,
`www.gstatic.com`), not from a measurement. The post-deploy check below covers them.

### Dependency scan (previously untested)

`npm audit --omit=dev`: **0 vulnerabilities** for the app, **0** for `functions`.

### Requires a deploy to take effect
This audit session could not deploy. A1, A2, A4 and A5 only reach users after the next
production deploy. **A4 invalidates every existing admin session** (the cookie is renamed),
so admins will be asked to sign in once — expected, not a fault.

**Post-deploy check (2 minutes):** load `/admin`, confirm sign-in works, confirm Firestore
lists populate, open the browser console and look for `Content Security Policy` violations.
If reCAPTCHA/App Check reports a CSP violation, add the named host to `SCRIPT_SRC_HOSTS` in
`next.config.mjs` — that list is the only thing to touch.

---

## C4. Round two — rules, query cost and remaining surfaces (2026-11-27)

### R1 — Forum rules never matched the documents they guard. **HIGH — FIXED + TESTED**

`firestore.rules` compared `resource.data.uid`, but a forum thread/reply stores its author in
`authorId` (`lib/types/content.ts:204`). Two consequences, both live until now:

1. **Authors could not edit or delete their own posts.** The comparison silently denied, so only
   admins could. `likes`/`likedBy` updates by readers were denied for the same reason — the
   like feature was broken for every non-admin.
2. **`create` did not bind authorship at all** (`allow create: if isAuth()`), so any signed-in
   user could create a thread or reply carrying **another user's id**.

**Fix:** rules now bind `authorId == request.auth.uid` on create, keep it immutable on author
edits, and grant two narrow reader paths — `likes`/`likedBy` only, and `lang`/`translations`
only (needed by `ensureThreadTranslated`, which runs from the public list page).

**Verification — this is behavioural, not just syntactic.** `scripts/forum-rules-check.mjs`
signs two users into the Auth emulator and makes real REST calls through the rules engine:

```
10/10 assertions passed
  author creates own thread                              PASS
  reader CANNOT create a thread owned by the author      PASS
  reader CAN like (writes only likes/likedBy)            PASS
  reader CAN add translations (only lang/translations)   PASS
  reader CANNOT edit the title                           PASS
  author CANNOT hand the thread to someone else          PASS
  author CAN edit own thread                             PASS
  user creates own profile                               PASS
  user CANNOT create a profile owned by someone else     PASS
  owner CANNOT reassign their profile's uid              PASS
```

Now runnable as `npm run smoke:emulator:forum-rules` and included in `check:preflight`.

### R2 — `forumProfiles` allowed ownership reassignment. **MEDIUM — FIXED**

`uid` is the ownership field there. Create did not bind it to the caller and update checked only
the *old* value, so a profile could be handed to another account. Both directions are now
pinned; covered by the two profile assertions above.

### R3 — `satisfaction-tokens` allowed enumeration. **MEDIUM — FIXED**

`allow read: if true` grants both `get` and `list`, so anyone could list every outstanding survey
token and submit surveys never issued to them. The public page only ever calls `fetchOne`
(`app/(marketing)/satisfaction/[token]/page.tsx:31`), so `get` stays public and `list` is now
admin-only.

### R4 — Analytics read was unbounded. **HIGH (cost + scalability) — FIXED**

`lib/firebase/firestore.ts:32` (`fetchAll`) applies no `limit()`, and `fetchAnalyticsEvents` added
only a 30-day `where` on top of it. `analytics` holds one document per tracked event — the
highest-volume collection in the project — and Firestore bills per document read. So:

- every visit to `/admin` and `/admin/analytics` billed for a full 30-day window;
- cost and memory grew with traffic, without bound;
- the read got slower the more successful the site became.

**Fix:** `MAX_EVENTS_PER_READ = 5_000`, newest first, with a `truncated` flag the page renders as
"Showing the 5,000 most recent events…". Exact totals over larger volumes need a rollup document
written by a scheduled function — noted rather than guessed at.

### R5 — Analytics create rule validated a field that is never written. **LOW — FIXED**

`hasAny(['event','page','type'])` then read `event`, but `trackEvent` writes `eventType`. The rule
therefore only really proved `page` existed. It now requires `eventType` (string, ≤64) and `page`
(string, ≤512), which is exact — every write path goes through `trackEvent`.

### R6 — `useCollection.error` conflated failed reads with failed saves. **MEDIUM (regression I introduced) — FIXED**

Making `DataTable` render an error panel for `error` meant a rejected save would replace the
table with "could not load this list". `error` now means *the read failed*, only; mutation
failures are thrown to the caller, which already shows a toast. No page lost behaviour — before
this audit no page consumed `error` at all.

### R7 — Markdown link targets were not scheme-checked. **MEDIUM — FIXED**

`markdownToHtml` escapes HTML first (so `<script>` cannot pass), but `[x](javascript:…)` was
written straight into `href` and the result is rendered with `dangerouslySetInnerHTML`. Since the
input is AI output, that was a real path to script execution in the app origin. Only `http(s)://`
and site-relative targets are now accepted.

### Firestore rules coverage — every collection the client touches

| Collection | Read | Write | Notes |
|---|---|---|---|
| `blog`, `landing-pages`, `page-seo` | public | admin | public content |
| `forum`, `forumReplies` | public | author-bound create; author/admin edit; reaction/translation-only by readers | R1 |
| `forumProfiles` | public | owner-only, uid immutable | R2 |
| `satisfaction-tokens` | `get` public / `list` admin | admin | R3 |
| `analytics` | admin | validated public create | R5 |
| `bookings` | admin | validated public create | `service` bracket notation |
| `leads`, `contacts`, `customers`, `tasks`, `projects`, `notes` | admin | admin | CRM |
| `keywords`, `seo`, `settings`, `integrations`, `emails`, `inbox` | admin | admin | |
| `campaigns`, `email-campaigns`, `reports`, `ai-*`, `agent-runs`, `findings`, `seo-tasks`, `rank-history`, `onpage-audits`, `keyword-gaps`, `citation-audits`, `backlink-prospects`, `outreach-emails`, `internal-link-suggestions`, `content-briefs`, `sync-log`, `business-reviews`, `ai-conversations` | admin | admin | |
| `contact-submissions` | admin | create denied | deprecated |
| `ai-rate-limit`, `report-deliveries` | — | — | Admin SDK only; default-deny is correct |
| anything else | **denied** | **denied** | `match /{document=**} { if false }` |

No collection used by client code is missing a rule.

### Gates run this round (deterministic, local)

| Gate | Result |
|---|---|
| `npm run audit:design` (260 files) | **0 errors, 0 warnings** |
| `npm run sync:thumbnails:check` | **in sync** (12 photos) |
| `npm run smoke:emulator:functions-load` | **passed** |
| `npm run smoke:emulator:security` | **passed** |
| `npm run smoke:emulator:forum-rules` | **10/10** |
| `npx playwright test` | **4 passed, 1 failed** — see below |
| `tsc`, `eslint`, app tests, functions tests, app build | clean · clean · **618/618** · **107/107** · compiles |

**The one e2e failure is environmental, not a regression.** `contact-form.spec.ts` needs the
contact API to persist, and the local Admin SDK has no usable credentials — measured directly:
`POST /api/contact` → `500`, server log `invalid_grant … reauth related error (invalid_rapt)`.
Running `gcloud auth application-default login` would make it pass; nothing in the code needs
changing. The other four tests pass.

### Still not verified — stated plainly

- **Live interaction** (sort/search/tabs/modals/pagination) against real data. Attempted three
  times; the embedded audit browser cannot mint an App Check token, so Firestore reads return
  `PERMISSION_DENIED` and the tables render empty. Proven by request interception, not assumed.
  This now cuts the other way: **a signed-in admin saw "No leads found" with the denial behind
  it**, which is exactly the P3 defect — fixed in code, awaiting deploy.
- **Accessibility and dark mode** as a pass. One measurement only: 0 px horizontal overflow on
  `/admin/leads` at 375 px.
- **Studio, blog editor, calendar** beyond rendering. Reviewed for the patterns above; not
  exercised end to end.
- **`DataTable` sorting is unreachable** — the component implements it, but no column sets
  `sortable: true`, so headers never sort. Reported as an observation, not changed: enabling it
  is a product decision.

---

## C5. Round three — responsive, dark mode, and deployment (2026-11-27)

### Responsive — PASS, measured at three widths

Measured `documentElement.scrollWidth - clientWidth` on `/admin`, `/admin/leads`,
`/admin/customers`, `/admin/settings` at 375 × 812, 768 × 1024 and 1440 × 900:

| Viewport | Pages with horizontal page overflow |
|---|---|
| 375 × 812 (phone) | **0 of 4** |
| 768 × 1024 (tablet) | **0 of 4** |
| 1440 × 900 (desktop) | **0 of 4** |

Three tab buttons on phone-width `/admin/leads` extend past the viewport edge, but their
parent has `overflow-x: auto` — that is the intended horizontally scrollable tab strip, not
a layout break. The admin shell collapses to a single "Open menu" button at phone width.

### Dark mode — PASS

Toggling the theme produced `data-theme="dark"`, `body` background `rgb(32, 33, 36)` and
text `rgb(229, 231, 235)`. A contrast sweep over leaf text nodes found **one** candidate,
the "+ Add Lead" button; measured directly it is `rgb(11, 18, 32)` on `rgb(45, 212, 191)`
— **6.20:1**, which passes WCAG AA. The sweep flagged it only because it compared the text
against the nearest `div` rather than the button's own background. No real dark-mode defect.

Theme cycling verified `auto → light → dark → auto`, with `localStorage` and `data-theme`
staying in agreement. **Note for future testing:** at desktop width there are **two**
theme buttons in the DOM (one sidebar, one top bar) and only one is visible. Selecting
`'button[aria-label*="Admin theme"]'` without filtering by visibility clicks the hidden
one and silently does nothing — this looks exactly like a broken toggle. Filter by
visibility first.

### Deployment — all three channels live

| Channel | Command | Result |
|---|---|---|
| Firestore rules | `firebase deploy --only firestore:rules` | compiled + released to `cloud.firestore` |
| Cloud Functions | `firebase deploy --only functions --force` | 30 functions, all `Successful update operation` |
| App (App Hosting) | `git push origin main` | `155a02e`, then `d850423` |

**The project id is `creeda-va`, not `creedava-va`.** Passing the latter returns
`Project 'projects/creedava-va' not found or deleted`, which reads like a destroyed project
but is only a lookup miss. `.firebaserc` and `apphosting.yaml` both say `creeda-va`.

Deploying functions with `--force` after deleting `functions/src/scheduled.ts` removed no
functions and reported no orphans — the deleted file exported the same six names
(`dailyDigest`, `weeklyReport`, `monthlyReport`, `dailyGoogleSync`, `weeklyAISEOReview`,
`cleanupAnalytics`) as the files that replaced it. That also confirms the eight duplicate
onpage runs could not have come from duplicate function registrations.

### Post-deploy verification, live

- `/admin/leads` now renders **"Could not load this list · The records are not gone — the
  request to read them failed."** with a Retry button. Before deploy the same page rendered
  **"No leads found · Total Leads 0"**.
- Public `/forum`, `/news` and `/` all return **200** with no permission errors after the
  rules release — the new forum rules did not break public reads.

### Residual defect found by that verification

The error panel appeared correctly, but the KPI cards beside it **still printed `0`** and
the panels printed "No leads yet" / "No source data". The page was contradicting itself:
"the records are not gone" sat directly above "Total Leads 0". Fixed in `d850423`:

| Surface | Figures now suppressed when the read fails |
|---|---|
| `/admin/leads` | 4 KPI cards, conversion panel, sources panel |
| `/admin/customers` | 8 KPI cards |
| `/admin/seo` agent dashboard | 4 run-stat cards |

They read `—` with an `unavailable` badge. A figure derived from a failed read is unknown,
not zero — that distinction is the whole point of this fix.

### Still not verified, and why

- **Live click-through** of the four page groups. Proven impossible in the automated browser
  by two independent measurements, both in that browser only: `/admin/blog` is guarded by
  `allow read: if true` and is still denied (a rule cannot deny a public read, so the refusal
  is App Check), and `accounts:lookup` returns **401** so the Auth session cannot refresh.
  Real Chrome is unaffected. This is a tool limit, not a product defect.
- **Full accessibility audit.** Contrast and overflow were measured; keyboard traps, focus
  order, and screen-reader labelling were not.

---

## D. Recommended order

1. ~~**A1**~~ — done (C3): the layout verifies the session; the proxy keeps the fast path.
2. ~~**A2**~~ — partially done (C3). Remaining: nonce-based `script-src` to drop
   `'unsafe-inline'`, then tighten `connect-src`/`frame-src`/`img-src`.
3. **A3** — mitigated in C3 (cross-site refused). The remaining decision is whether to keep
   handing JS a custom token at all, or move to a server-refreshed short-lived cookie.
4. ~~**A5**~~ — done (C3). ~~**A4**~~ — done (C3).
5. **Deploy, then run the post-deploy CSP check in C3.**

Then the remaining untested surfaces in section C.

---

## E. Evidence index

| Claim | File | What was read |
|---|---|---|
| Cookie-presence-only gate | `proxy.ts` | full file (16 lines) |
| CSP verbatim policy | `next.config.mjs` | lines 1–90 |
| Session mint + custom token | `app/api/session/route.ts` | lines 1–150 |
| Domain + verified-email gate | `app/api/session/route.ts` | lines 55–95 |
| Admin group layout / noindex | `app/(admin)/layout.tsx` | full file |
| Admin SDK init + build guard | `lib/firebase-admin.ts` | full file |
| Firestore-backed rate limits | `app/api/ai/rate-limit.ts` | lines 1–60 |
| AI route auth order | `app/api/ai/route.ts` | lines 1–120 |
| Creative route auth order | `app/api/brand/creative/route.ts` | lines 1–80 |
| Admin page inventory (24) | `app/(admin)/admin/**/page.tsx` | file list |
| API route inventory (5) | `app/api/**/route.ts` | file list |
| No client guard in `components/` | `components/**/*.tsx` grep | `onAuthStateChanged`/`AdminGuard`/`router.replace("/login")` → 0 matches |

### C2 evidence (2026-11-27)

| Claim | Evidence |
|---|---|
| Lock + cursor queries need an index that does not exist | `functions/src/seo-agent.ts` vs `firestore.indexes.json:149-164` |
| Sitemap is exactly 15 URLs | `curl -s https://creedava.com/sitemap.xml \| grep -c '<loc>'` → `15` |
| `findings` was reporting a page count | `functions/src/seo/onpage.ts:445` (pre-fix) |
| Forged cookie receives the admin shell | `curl -H 'Cookie: __session=not-a-real-session' /admin` → `200`, 21,605 bytes |
| App Check token absent in the audit browser | Playwright request interception: `Listen/channel` → `appCheck MISSING`; `recaptcha/enterprise/anchor` → `ERR_ABORTED` |
| Silent empty list on denied read | `/admin/blog` console: `[Firestore] blog fetch error` + UI: "No posts yet" |
| Functions build + tests after the fix | `npm --prefix functions run build` clean · `107 passed (107)` |
| SEO alias routes are redirect stubs | `app/(admin)/admin/seo/*/page.tsx` → `redirect(ADMIN_ROUTE_ALIASES.*)`; map in `lib/utils/admin-route-aliases.ts` |
