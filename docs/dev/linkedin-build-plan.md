# LinkedIn — Competitive Research and Build Plan

Status: **plan, not built.** Only the OAuth plumbing and text posting exist (see
`linkedin-integration.md`). Everything below Phase 1 is proposed.
Researched and written 2026-11-02.

---

## 1. What the reference sites actually do

### sbl.so (Second Brain Labs) — AI SDR

Positioning: "Autonomous AI SDR for LinkedIn". $99/mo, 18 features, 4.7 on G2.

The flow they sell:

1. **ICP** — describe who you sell to in plain English, or import a Sales Navigator search
2. **Intent signals** — watches LinkedIn for buying signals (job changes, funding events,
   competitor mentions, post comments and reactions) and rebuilds a lead list daily
3. **AI outreach** — opens conversations in the buyer's voice, chats, flags hot leads
4. **Booking** — qualified buyers book straight into a calendar over Google Meet
5. Unified inbox, built-in CRM, HubSpot/Salesforce/Pipedrive sync
6. Public REST API with webhooks and OAuth, plus a Claude MCP server

**How they do it matters more than what they do.** They do not use the LinkedIn API:

- They sell "Sender As A Service — hire LinkedIn accounts", described as pre-warmed,
  rotated, and "never yours". Accounts with real activity history are a purchased asset.
- Their headline trust signal is "0 account bans across 50M+ messages". Account bans are
  not a risk under the official API — the concern only exists if you are automating
  accounts outside it.
- Their footer links out to "LinkedIn Automation APIs" at `unapi.so`, a separate
  automation/scraping vendor.
- Every feature requires reading the feed, reading search results, sending DMs, and
  sending connection requests. The LinkedIn API forbids or gates all of these.

So their product is browser automation running on accounts they own, and the business
model is **absorbing ban risk** so the customer's own profile stays clean. That is a
defensible business, but it is not something we can build on top of an OAuth token, and
it is not something I would recommend building at all — see §5.

*Caveat on evidence: this is inferred from their public marketing and footer links. I have
not inspected their client or network traffic.*

### Taplio — LinkedIn content growth

The closest legitimate analogue, and the most useful model for us.

| Pillar | What it does | Uses official API? |
| --- | --- | --- |
| **Create** | AI drafts in your voice, trained on a 3M+ post database; daily feed of top posts ranked for your niche; live reach prediction before publishing | n/a (own data) |
| **Schedule** | Visual queue, batch a week at once, best-time-to-post tuned to your followers | Yes |
| **Engage** | Curated feed of prospects and peers to comment on; AI comment starters | No — Chrome extension |
| **Connect** | Auto connection requests, then DM on accept, human-paced | No — Chrome extension |

Two things to steal: the **queue as the primary object** (not "a publish button"), and
**repurposing your own material** (their "turn my newsletter into a post"). Two things to
avoid: connection automation and auto-DM, which need the extension because the API will
not do it.

They also ship an MCP server with 27 tools. Worth noting as a pattern, not a Phase 1 item.

### Publer — multi-platform scheduler

Breadth play: calendar planner, bulk scheduling, content recycling, approval workflow for
clients, agency workspaces, in-depth analytics, browser extension, link-in-bio, public API.

The transferable ideas are **bulk scheduling**, **recycling** (auto-repost top content),
and **approval workflow** — a draft cannot publish until someone approves it. That last one
is directly relevant to a VA company publishing on behalf of clients.

### Metricool — plan, measure, report

Planner + analytics + reporting + unified inbox + smartlinks + competitor analysis. Sells
itself on time saved (12 hours/week). Its differentiator is **reporting** and competitor
benchmarking — both of which need read access we will not have.

Honest lesson: two of the four competitors are essentially *analytics products*. We cannot
compete there. We should not try.

---

## 2. The split that decides everything

The market has two archetypes, and they need different things from LinkedIn:

| | **Demand-side automation** (sbl.so, Expandi, HeyReach, Dripify, Waalaxy) | **Content-side publishing** (Taplio, Publer, Metricool) |
| --- | --- | --- |
| Core loop | find strangers → connect → DM → book | idea → draft → schedule → publish |
| Needs from LinkedIn | read feed, read search, write DMs, write invites | write posts |
| Available via API? | **No** | **Yes** |
| ToS position | violates LinkedIn's User Agreement | fine |
| Blast radius | revenue is the customer's LinkedIn account | none |

We have an OAuth token and a verified admin. That puts us in column two, permanently.
Everything below is column two.

---

## 3. What the API actually permits — verified

Checked against Microsoft Learn on 2026-11-02.

### Content types for an organic post

| Type | Supported | Notes |
| --- | --- | --- |
| Text | Yes | 3,000 character limit |
| Single image | Yes | Upload first, get `urn:li:image:{id}` |
| Multiple images | Yes | MultiImage endpoint |
| Video | Yes | Upload, poll for processing, then reference |
| Document (PDF carousel) | Yes | The native LinkedIn "carousel" people actually post |
| Article / link preview | Yes | Must supply title, description and thumbnail — **no URL scraping**, unlike the old API |
| Poll | Yes | Organic only |
| Celebration | Yes | Organic only |
| Sponsored carousel | No | Ads only |

### Permissions — the hard wall

| Scope | Self-serve? | Grants |
| --- | --- | --- |
| `openid`, `profile`, `email` | Yes, instant | Identity |
| `w_member_social` | **Yes, instant** | Post, comment and like **as the member** |
| `r_member_social` | **No — private, approved users only** | Read the member's own posts, comments, likes |
| `w_organization_social` | **No — partner product + page ADMINISTRATOR role** | Post as the company page |
| `r_organization_social` | No | Read company posts |

Two consequences that shape the whole plan:

1. **We cannot read back even our own posts.** `r_member_social` is a private permission.
   Our own Firestore record of what we published is not a convenience — it is the only
   history we will ever have.
2. **Everything is personal-feed.** Posts go out as the person who authorised, not as
   CreedaVA. Company-page posting needs the partner product plus ADMINISTRATOR on the page.

### Operational gotchas found in the error tables

- **`422 Content is a duplicate`** — exact repeats within 10 minutes are rejected. A
  scheduler that retries a failed publish can trip this.
- **`429 UGC action was blocked because a share limit has been reached`** — daily cap.
- **`409 Write conflict ... Please retry`** — transient, retryable.
- Approved-app restriction on video via the legacy endpoint: `400 ... doesn't have
  permission to create ugc posts`.

---

## 4. Two corrections to what I already shipped

Found while verifying. Both are real, neither is an emergency.

**A. `POST /v2/ugcPosts` is deprecated.** Microsoft's own page is titled "UGC Post API
(Legacy)" and states: *"The Posts API replaces the `ugcPosts` API for creating posts"*.
Our `app/api/linkedin/publish/route.ts` uses it. It still functions, but the current
endpoint is `POST https://api.linkedin.com/rest/posts` with a `Linkedin-Version` header.
Migrating is a contained change and should happen before we build content types on top.

**B. My earlier claim "no read endpoints" was imprecise.** Reading is not impossible in
principle — it is gated behind `r_member_social`, a private permission granted case by
case. In practice that is the same as unavailable to us, but "private permission" and
"doesn't exist" lead to different decisions later.

Also confirmed correct from what I built: the 3,000-char limit, `x-restli-id` holding the
new post ID, and `w_member_social` being self-serve.

---

## 5. What we should build — and what we should refuse

### Refuse: the sbl.so model

Not on capability grounds — on risk grounds. It requires buying or renting LinkedIn
accounts, driving them with browser automation, and rotating them when they die. LinkedIn's
User Agreement prohibits scraping and automated activity, and the punishment lands on the
accounts. Our name would be on the tool that gets a client's profile restricted.

There is also a plain business reason: that market is saturated (sbl.so, Expandi, HeyReach,
Dripify, Waalaxy, Gojiberry, Artisan, 11x, AiSDR all selling the same loop), it is a
race to the bottom on price, and every entrant's moat is "we haven't been banned yet".

### Build: a content studio for CreedaVA's own voice

The differentiated asset we already have and they do not: **a real website full of content
worth posting.** News, services, case studies, FAQ, forum threads. Every competitor's
"create" pillar is an AI writing into a void. Ours can start from material that already
exists and is already true.

That makes the core loop: **source → draft → approve → queue → publish → record.**

#### Phase 0 — Unblock the connection (do first, ~15 min)

The authorize link fails before it reaches us. Almost certainly the Products tab: LinkedIn
rejects the authorisation request if any requested scope is not enabled for the app. Two
products must both be added:

- **Sign In with LinkedIn using OpenID Connect** → covers `openid`, `profile`, `email`
- **Share on LinkedIn** → covers `w_member_social`

Not verified — it needs one look at the app's Products tab. If both are present, the next
candidates are a redirect-URI mismatch and the app still being in development mode with
the authorising member not added as a test user.

#### Phase 1 — Migrate to `/rest/posts`, add images (~1 session)

- Swap the publish route to `POST /rest/posts`, add `Linkedin-Version: YYYYMM`.
- Add image upload: register upload → PUT bytes → reference `urn:li:image:{id}`.
- Handle `422 duplicate` (don't blind-retry) and `429` (surface the daily cap).
- Keep the token server-side; it already never leaves the server.

#### Phase 2 — The queue (the actual product, ~2 sessions)

This is the feature that creates value and needs **zero additional permissions**. LinkedIn
has no scheduling API — scheduling is entirely ours, which means it is also entirely
defensible.

Firestore `linkedin-queue/{id}`:

```
text          string
mediaUrns     string[]
status        draft | pending_approval | scheduled | publishing | published | failed
scheduledFor  Timestamp
createdBy     uid
approvedBy    uid | null
postId        string | null      // from x-restli-id
error         string | null
attempts      number
sourceType    manual | news | service | case_study | forum
sourceId      string | null      // links back to the CMS doc
```

A scheduled Cloud Function (we already have a working Functions setup and a running SEO
scheduler to copy) publishes anything due, one post per run, with a hard daily cap well
under 150 and backoff on 429. Every attempt is logged to `linkedin-posts`, which is our
only history because `r_member_social` is private.

UI: a calendar view. `components/admin/calendar-view.tsx` already exists.

#### Phase 3 — Content sourcing (~1 session)

The part no competitor can copy. Pull from our own data:

- A published news article → a post, with the article thumbnail as the image
- A service page → a post
- A forum thread worth surfacing → a post
- Gemini rewrites it in CreedaVA's voice — we already have `lib/firebase/ai.ts`

Every draft links back to its source doc, so "why did we post this?" always has an answer.

#### Phase 4 — Measurement, honestly

We cannot get impressions, clicks, or engagement. Not partially — not at all, without
`r_member_social` or the company-page products. Options, in order of honesty:

1. **No numbers.** Ship the queue, skip the dashboard. Do not fake a chart.
2. **Manual entry.** After a post goes out, someone types in what LinkedIn's own UI shows.
   Clunky, accurate, and tells you nothing you couldn't see yourself.
3. **Apply for partner access.** Real but slow, with no guarantee.

Recommendation: option 1, and revisit only if the posting habit actually sticks. A
dashboard of invented metrics is worse than no dashboard.

#### Phase 5 — Company page (separate track, weeks)

Posting as CreedaVA rather than as a person needs `w_organization_social`: the partner
product, plus the authorising member being ADMINISTRATOR on the page. Apply, then wait.
Until that lands, every post is personal.

---

## 6. Effort and sequencing

| Phase | Effort | Depends on | Value |
| --- | --- | --- | --- |
| 0 — Unblock OAuth | 15 min + one portal visit | LinkedIn Products tab | Blocking everything |
| 1 — `/rest/posts` + images | 1 session | Phase 0 | Removes deprecated code, unlocks image posts |
| 2 — Queue + scheduler | 2 sessions | Phase 1 | The actual product |
| 3 — Content sourcing | 1 session | Phase 2 | The differentiator |
| 4 — Measurement | — | — | Skip for now |
| 5 — Company page | Weeks of waiting | LinkedIn | Nice to have |

Phases 0–2 are a coherent, shippable slice. Phase 3 is what makes it worth using.

---

## 7. Open questions for the owner

These change the plan and I should not guess at them:

1. **Whose voice?** CreedaVA as a company, or the founder personally? This is Phase 5
   versus everything else — if it must be the company page, the whole plan waits on partner
   approval.
2. **Is LinkedIn actually a lead channel for us**, or is this a feature for clients? Those
   are different products.
3. **Who approves a post before it goes out?** A VA company publishing on client accounts
   needs approval gates that a solo founder does not.

---

## Appendix — sources

Verified directly on 2026-11-02:

- `https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api`
- `https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/ugc-post-api` (marked Legacy)
- `https://sbl.so/`, `https://taplio.com/`, `https://publer.com/`, `https://metricool.com/`

Not verified: that sbl.so's internals are browser automation (inferred from their own
marketing), and the cause of the failed authorize redirect (needs the Products tab).
