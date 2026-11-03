# LinkedIn Integration

Status: **code deployed, connection not yet authorised.** Nothing has ever been posted to
LinkedIn from this app. Verified locally on 2026-11-02; not yet verified against the live
deployment.

## What exists

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/linkedin/authorize` | GET | Redirects to LinkedIn consent with a CSRF state cookie |
| `/api/linkedin/callback` | GET | Exchanges the code, stores credentials, renders a result page |
| `/api/linkedin/publish` | GET | Reports whether LinkedIn is connected (no token in response) |
| `/api/linkedin/publish` | POST | Posts text to the connected member's feed |

Admin nav label and page title changed from "Social Media" to "LinkedIn". The route path
is still `/admin/marketing/social` — only user-visible strings changed, so no redirect is
needed.

## Setup

Environment (production goes through `apphosting.yaml`):

| Variable | Kind | Value source |
| --- | --- | --- |
| `LINKEDIN_CLIENT_ID` | plain | `786qiv3nrmvcb2`, public |
| `LINKEDIN_REDIRECT_URI` | plain | `https://creedava.com/api/linkedin/callback` |
| `LINKEDIN_CLIENT_SECRET` | Secret Manager | `firebase apphosting:secrets:set LINKEDIN_CLIENT_SECRET` |

The secret is a real Secret Manager value, created with the backend IAM binding via
`firebase apphosting:secrets:grantaccess LINKEDIN_CLIENT_SECRET --backend creeda-va-host`.
It is never written as a literal in any committed file.

The redirect URI must match the LinkedIn app's Auth tab **character for character**, or the
token exchange fails with `invalid_redirect_uri`. Two URLs are registered on the app; this
integration uses `/api/linkedin/callback`, not `/api/linkedin/auth/linkedin/callback`.

## Scopes

`openid profile email w_member_social`

The first three are OpenID basics. `w_member_social` is what allows posting, and it is
**self-serve and granted instantly** — no partner review. If the callback page shows a
warning about `w_member_social`, the LinkedIn app is missing the "Share on LinkedIn"
product and posting will 403.

`w_organization_social` is **not** requested. It is required to post as a company page and
needs LinkedIn partner approval (days to weeks).

## Connecting

1. Open `https://creedava.com/api/linkedin/authorize` while signed in as an admin.
2. Approve on LinkedIn.
3. The callback page reports the authorised name, email, member URN, granted scopes, and
   token expiry. Check that `w_member_social` appears in the scope list.

Credentials are written to `integrations/linkedin`:

```
provider      "linkedin"
status        "connected"
accessToken   <never returned to any client>
scope         granted scope string from LinkedIn
expiresAt     Timestamp
memberUrn     "urn:li:person:..."
memberName    <display name>
memberEmail   <email>
connectedAt   Timestamp
updatedAt     Timestamp
```

## Posting

`POST /api/linkedin/publish` with `{ "text": "..." }`, admin session required.

- Rejects empty text and anything over 3000 characters (LinkedIn's limit).
- Rejects an expired token with a "reconnect" message.
- Maps LinkedIn 401/403 to an actionable message rather than echoing the raw payload.
- Logs successful posts to `linkedin-posts` with the returned `postId`.

Under the hood this calls `POST https://api.linkedin.com/v2/ugcPosts` with
`X-Restli-Protocol-Version: 2.0.0` and `LinkedIn-Version: 20241101`. The new post's id comes
back in the `x-restli-id` response header, not the body.

## Known limits

These are hard API limits, not missing work:

- **No token refresh.** Programmatic refresh is partner-only. Tokens last 60 days; after
  that the user must re-run the authorize flow. A scheduled job that emails a reminder
  before `expiresAt` is the practical mitigation.
- **No read endpoints.** Feed reading, post analytics, follower counts, and page insights
  all require partner approval. Nothing here can report how a post performed.
- **Personal feed only.** Posts appear as the authorising member, not as CreedaVA the
  company page.
- **150 posts per day** per member; 100,000 per day per app.

## Verified locally

| Check | Result |
| --- | --- |
| `GET /api/linkedin/authorize` | 307 to LinkedIn with correct `client_id`, encoded `redirect_uri`, `state`, and all four scopes; `li_oauth_state` cookie set `Path=/api/linkedin`, 600s, HttpOnly, SameSite=lax |
| `GET /api/linkedin/publish` unauthenticated | 401 |
| `GET /api/linkedin/callback` with no params | 400 |
| `GET /api/linkedin/callback?code=abc&state=wrong` | 400, CSRF branch |
| `GET /api/linkedin/callback?error=user_cancelled_login` | renders the denial page with LinkedIn's reason |

Not verified: the live deployment, and any real API call — there is no token yet.
