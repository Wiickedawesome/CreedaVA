# Sign-in: the three gates, and how to diagnose "it won't let me in"

Last measured: **2026-11-12**. Everything below was queried from the project, not
inferred from the code alone.

## Sign-in is Google popup only

`lib/firebase/auth.ts` → `signInWithPopup` with the Google provider, against
`authDomain = creeda-va.firebaseapp.com`. The popup loads Firebase's own
`/__/auth/handler`, so the result comes back over `postMessage` and there is no
cross-origin cookie exchange.

`email/password` is *enabled* in Identity Platform and is used by
`lib/firebase/forum-auth.ts`, but not by `/login`.

## Then three gates, in order

| # | Gate | Where | Failure looks like |
|---|---|---|---|
| 1 | App Check token | Client, reCAPTCHA Enterprise | popup throws `auth/firebase-app-check-token-is-invalid` / `auth/internal-error` |
| 2 | Google account exists | Google | popup throws |
| 3 | Domain + verified email | `POST /api/session` | HTTP 403, no cookie, no admin access |

Gate 3 is the only one this app owns:

```
email must end with "@creedava.com"      -> else 403 "Unauthorized domain"
decoded.email_verified must be === true   -> else 403 "Email address is not verified"
```

Both refusals share status **403** but are different problems. Report them
separately — see "diagnosing a report" below.

## Gate 1 is enforced, and that is the location-sensitive one

Measured on 2026-11-12 via `firebaseappcheck.googleapis.com`:

```
identitytoolkit.googleapis.com : ENFORCED
firestore.googleapis.com       : ENFORCED
recaptcha key "creedava.com"   : allowAllDomains=false
  allowedDomains: creedava.com, creeda-va.firebaseapp.com,
                  creeda-va.web.app, localhost
  minValidScore : 0.5
```

Because App Check is **ENFORCED on `identitytoolkit`**, every sign-in must carry
a reCAPTCHA Enterprise token. Consequences worth remembering:

- A network that cannot load `google.com/recaptcha` — restrictive corporate or
  school proxy, an ad/tracker blocker that is aggressive about third-party
  scripts, some VPNs — gets **no App Check token and cannot sign in at all**,
  even with correct credentials.
- `minValidScore: 0.5` rejects any token scoring below 0.5. Legitimate people on
  VPNs, datacentre egress IPs, or privacy browsers routinely score 0.1–0.3.
  Their token is genuine and still refused.

This is a *location* difference, not an account difference. If somebody abroad
can't sign in but everyone in the office can, start here.

`creeda-va-host--creeda-va.us-east4.hosted.app` is **not** in the reCAPTCHA
allowlist, so sign-in from that origin would fail — but that host currently
returns **404** and serves nothing, so it is moot until someone routes it.

## Gate 3: the accounts that exist

Measured 2026-11-12 with `firebase auth:export`:

| Account | Google linked | Sign-in result |
|---|---|---|
| `john@creedava.com` | yes | works |
| `hello@creedava.com` | yes | works |
| `info@creedava.com` | **no provider** | **broken — see below** |
| `belizechain@gmail.com` | yes | **refused: not `@creedava.com`** |
| `johnlloydpakig@gmail.com` | yes | **refused: not `@creedava.com`** |
| `info@guianegocios.net` | yes | **refused: not `@creedava.com`** |

### `info@creedava.com` cannot sign in

It is marked unverified and has **no provider records at all** — not a Google
account, and no password. A Google sign-in attempt for that address will not
cleanly create the account, because the address already exists, so it surfaces a
Firebase identity/collision error rather than signing in. Being on the right
domain does not help.

Fix (needs the owner, because it destroys a record): delete the empty stub so
Google sign-in re-creates it cleanly.

```
# inspect first — confirm no providers and no data depends on this uid
firebase auth:export /tmp/users.json --format json --project creeda-va
# then, only with approval:
#   console -> Authentication -> delete info@creedava.com
```

### External accounts are blocked by design

The three non-`@creedava.com` accounts can authenticate with Google, then get
403 from `/api/session`. That is the intended gate, not a bug. Admitting them
is a **product decision** — either allowlist specific addresses, or move the
person onto a `@creedava.com` Workspace address. Do not widen the gate to a
public mail domain to fix one login.

## The bug that made a refusal look like a broken browser

Fixed in `5870c13`. `syncSessionCookie` in `lib/firebase/auth-context.tsx` used
to `await fetch(...)` and **discard the response**, so a 403 was
indistinguishable from success. The rejected user stayed persisted in the client
SDK, and:

1. each page load re-sent the same refused identity → 403
2. no cookie was ever written, so the proxy saw no session and redirected to
   `/login`
3. `/login` still had a signed-in client user, retried, got 403 again
4. there was no sign-out anywhere on that path, so the person could never pick a
   different Google account

Symptom: "it just takes me back to login and refreshes". A 403 now signs the
client out, which makes the refusal recoverable. 401/500 deliberately do not,
because signing out over a transient failure would lock out people who are
entitled to a session.

## Diagnosing a report

Ask for the exact on-screen text. It is decisive:

| What they see | Means | Action |
|---|---|---|
| `Access denied. Only @creedava.com accounts are authorized.` | gate 3, wrong domain | account decision |
| `Your email address is not verified.` | gate 3, unverified | verify or re-create the account |
| `Session creation failed.` | 401/500 from `/api/session` | check token clock, then logs |
| any other Firebase string | gate 1 or 2 — popup/App Check | test from a plain Chrome profile on a non-VPN network |

Work in this order: (1) is the address actually a `@creedava.com` Google account,
verified? (2) can they reach `google.com/recaptcha`? (3) only then suspect code.

## Known limitation

Sign-in does not work in the VS Code embedded browser. Measured there:
`auth/internal-error` from the Google iframe plus `requestStorageAccess:
Permission denied`. That is the embedded browser, not the app — Firefox and
Chrome work. Do not add workarounds for it.
