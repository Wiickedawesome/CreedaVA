# Removed Admin Surfaces

**Status:** current as of 2026-11-12.
This records what was removed from the admin, why, and what was deliberately **kept**.
Anything here that is later reverted should be removed from this file at the same time.

---

## 1. Tasks and Projects (removed entirely)

The owner does not use task or project tracking. The admin was carrying two full CRUD
sections, a dashboard metric, several AI integrations, and a third of the CRM type layer
for something nobody looked at. Removed at the owner's explicit request.

### Routes deleted

| Route | What it was |
|---|---|
| `/admin/tasks` | Task board (list, create, edit, status changes) |
| `/admin/projects` | Project list |
| `/admin/projects/[id]` | Project detail, goals, phases, history |

Both sidebar entries were removed. `Image studio` (`/admin/studio`) now sits where they
would have been, as a flat Content item directly after Blog.

### Dashboard (`app/(admin)/admin/page.tsx`)

- Removed the `tasks` collection read, so the dashboard no longer pays for that query.
- Removed `taskCompletionRate`, `openTasks`, `completedTasks`.
- Added `pendingBookings`, and the "Task Completion" stat card became **"Pending Bookings"**.
- Recent Activity now shows leads only ("View all" → `/admin/leads`).
- The "Create Task" quick action was removed.
- The AI summary line no longer mentions task counts.

### AI layer

- `lib/utils/ai-specialists.ts` — the **ATLAS** specialist existed only to report on tasks
  and projects. Deleted, along with its `tasks` / `projects` route mappings.
  `ALL_SPECIALISTS` is now six: ARIA, ORACLE, NOVA, MAVERICK, SCOUT, GUIDE.
- `lib/utils/ai-page-context.ts` — removed both page configs, both collection fetchers, and
  `projects` from the customers page's collection list. (`DEFAULT_CONFIG.collections` was
  cut to `["leads"]` at the time; superseded by §5 below.)
- `lib/utils/ai-data-context.ts` — removed `tasks` / `projects` from `AllCollections`,
  removed `summarizeTasks`, `summarizeProjects`, and `buildOperationsContext` (which was
  tasks + projects + bookings and nothing else, and had no production caller).
  `buildCustomerLTVContext` no longer includes project summaries.
- `lib/utils/ai-system-prompt.ts` — removed the `projects:` and `tasks:` page contexts and
  the `Task completion rate` / `Project delivery on-time rate` KPI targets. The AI can no
  longer claim to measure something that is not tracked.
- `lib/firebase/ai-tools.ts` / `ai-tool-executor.ts` — removed the `create_task` tool
  declaration, its registration, and its handler.
- `lib/types/schema.ts` — removed `"tasks": "Task"` and `"projects": "Project"`.

### Types (`lib/types/crm.ts`)

Deleted: `TaskReminder`, `Task`, `TaskFormData`, `TaskStatus`, `ProjectHistoryEntry`,
`Project`, `ProjectFormData`, `ProjectStatus`, `GoalStatus`, `ProjectGoal`,
`TASK_STATUSES`, `PROJECT_STATUSES`, `GOAL_STATUSES`.

---

## 2. Lifetime Value no longer counts project goals

`computeLTV(customer, projects)` became `computeLTV(customer)`.

LTV is now **recurring revenue only** — `monthlyValue × months active`.

**Measured before removing it:** the live `projects` collection held exactly **one**
document, titled `Test Project` for John Chuc, with one completed goal valued at 10,000
whose title was `gd`. So this removal subtracts a fake **$10,000** from that customer's LTV
figure. It is a correction, not a loss, and no real customer's number changed.

If real project-goal revenue ever comes back, this is the place to start: reintroduce the
goal term and say so in the changelog.

---

## 3. "SEO Tasks" renamed to "Action items"

`/admin/seo?section=tasks` is now `/admin/seo?section=action-items`, labelled
**Action items**.

**This is a rename, not a removal, and that was deliberate.** The `seo-tasks` collection
is written by the SEO agent (`functions/src/seo/synthesizer.ts`, `onpage.ts`) and by
"create action item from brief" in `briefs-section.tsx`. The board is the only UI that
surfaces those items — deleting it would have left the agent generating actions nobody
could see. Screening the word "Tasks" out of the admin satisfies the actual objection
without destroying working functionality.

Wiring kept in sync:

- `app/(admin)/admin/seo/page.tsx` — `SectionId`, the `SECTIONS` label, and the dynamic
  import (now `ActionItemsBoard`).
- `SECTION_ALIASES` maps the legacy `section=tasks` to `action-items`, so old links and
  bookmarks still land correctly.
- `lib/utils/admin-route-aliases.ts` — `seoTasks` now points at `section=action-items`.
  The alias name is unchanged so existing callers keep working.
- `app/(admin)/admin/seo/tasks/page.tsx` remains as a redirect stub for the old path.
- The briefs toast reads "Action item created in pipeline".

`app/(admin)/admin/seo/_components/tasks-board.tsx` keeps its filename and its exported
`SeoTasksBoard` symbol — renaming both would have churned four files for a cosmetic gain.

---

## 5. Creeda AI consolidated onto the dashboard

**Decided 2026-11-12.** Creeda AI had two entry points that were verified to be the *same*
assistant — same `ai-core` orchestrator, same per-user conversation in `ai-conversations`,
shared memory, same ARIA specialist. The SEO Hub tab was titled "Creeda AI", the dashboard
button "ARIA — Chief of Staff", and both exposed the same history. Keeping two doors to one
room was the single largest source of confusion in the admin.

### Removed

| Removed | Detail |
|---|---|
| SEO Hub → **Creeda AI** tab | `app/(admin)/admin/seo/_components/sections/ai-section.tsx` deleted |
| `SectionId` value `"ai"` | SEO Hub now opens on **Pages & Audits** |
| `AiSection` lazy import | plus its `SectionSkeleton` loading label |
| `ADMIN_ROUTE_ALIASES.seoCreedaAI` | replaced by `creedAI: "/admin"` |

`/admin/analytics/ai` still exists as a redirect, now pointing at `/admin`.
`ai-redirect.test.tsx` asserts the new target.

### Moved, not deleted — this mattered

`ai-section.tsx` was not only a chat box. It was the sole client-side trigger for the
**weekly scheduled report** (`useScheduledReports().autoGenerate`), and it rendered
`BusinessPulse`. Deleting it outright would have silently stopped weekly report
generation with no error anywhere.

The `autoGenerate` trigger moved to `weekly-digest-section.tsx` — the tab that *displays*
those reports, so generation now sits beside its consumer. Its empty state no longer claims
the trigger "fires from the analytics dashboard", which was already untrue.

`BusinessPulse` was **deleted on 2026-11-12**, along with the whole of
`components/admin/report-categories.tsx`. Once `ai-section.tsx` went away, nothing
imported that file: `ReportCategoryCard`, `ScheduledReportCard`, `InsightCard`, and
`BusinessPulse` were all unreferenced and absent from the `components/admin` barrel.

`BusinessPulse` was removed rather than relocated because its headline number was not
a measurement. `score` came from a Gemini response to a text summary —
`useScheduledReports.generateReport` writes whatever `score` the model returns, and
**no cloud function writes `score` at all** (verified across `scheduled-reports.ts`,
`scheduled.ts`, `synthesizer.ts`, `report-delivery.ts`). The seven area bars were
computed separately from raw collections (`won ÷ leads`, `published ÷ blog`,
`tracked ÷ keywords`, …), so the circle and the bars were two unrelated scales
presented as one score, with the "Grade" derived from the AI-invented half.

### Made broader

Creeda AI previously answered dashboard questions from **leads only**: `loadPageAwareContext`
normalised `/admin` to `""`, matched no config, and fell through to a `DEFAULT_CONFIG`
carrying `collections: ["leads"]`. Meanwhile the deleted SEO tab fetched all eleven
collections — so the *retired* surface had better data access than the surviving one.

Both `""`/`dashboard` and the fallback now load every collection with `buildFullContext`
(11 collections, 80k-token budget, sampling at >70 rows). The dashboard button also stopped
passing its own 4-line `dataContext`, which had been short-circuiting the page-aware loader
(`if (!dataContext)` in `ai-core.sendMessage`).

---

## 6. SEO Hub split — "Pages & Audits" was three different things

The tab labelled **Pages & Audits** did two unrelated jobs and was named after
neither. It is now:

| Was | Now | Route |
|---|---|---|
| Tab "Page SEO" (`page-seo` collection) | **Page Metadata** — top-level page | `/admin/metadata` |
| Tab "Audits" (`seo` + `onpage-audits`) | **Findings** sub-tab inside the agent that produces them | `/admin/seo?section=agent&tab=audits` |
| Tab "Opportunities" (`keyword-gaps`) | **Gaps** sub-tab of Keywords | `/admin/seo?section=keywords&tab=gaps` |

Why: **Page Metadata is not an SEO-reporting surface.** `getPageSEO()` overrides
`generateMetadata` on 11 marketing pages, cached 60s — editing a row changes the
live `<title>`, `<meta>`, OG and Twitter tags with no deploy. Filing that under a
report tab hid how dangerous it is.

`keyword-gaps` are written by the agent's `keyword-gaps` skill and consumed by the
Keywords surface, so they render there now (the `OpportunitiesSection` component is
reused, not duplicated).

Retired route aliases still resolve:

- `/admin/seo/content` → `/admin/metadata`
- `/admin/seo/audits` → `/admin/seo?section=agent&tab=audits`
- `/admin/seo/briefs` → `/admin/seo?section=agent&tab=briefs`
- `/admin/seo/tasks` → `/admin/seo?section=agent&tab=action-items`
- `?section=opportunities` / `?section=citations` → `/admin/keywords?tab=gaps`
- `?section=keywords` → `/admin/keywords`
- `?section=briefs` / `?section=tasks` / `?section=action-items` → `?section=agent`
- `?section=pages` → `/admin/metadata`

The hub itself is now **Agent** only — one "Runs" tab. Everything the agent
*produces* sits inside the agent, next to the runs that produce it.

**Outreach moved to Emails.** Backlink drafts are emails, and they already lived in
an email shape (`outreach-emails`); keeping them in an SEO hub meant the operator
reviewed outbound mail in a different place from every other outbound mail. They
are now the **Outreach** tab of `/admin/emails`, and `?section=outreach` redirects
there instantly rather than falling through to the default tab.

### Keywords is the agent's input, not its output

Every other SEO surface is written *by* the agent. `keywords` is the one it reads:
no cloud function writes it — both `keyword-gaps.ts` and `serp-analysis.ts` only
`get()` it. Every write comes from the admin UI (New Keyword, Keyword AI → Add,
Search Console sync), which is why it now has its own top-level page rather than
being a hub tab next to outputs.

Two consequences that were invisible before:

- **An empty `keywords` collection silently disables `serp-analysis`.** It returns
  `status: "skipped", reason: "no-tracked-keywords"` — no error, no alert — so
  competitor-gap detection is off until at least one keyword exists. The empty
  state on `/admin/keywords` now says so explicitly.
- **Keyword AI was answering without data.** `buildPrompt` ignored the page-aware
  `dataContext` it was handed (hard-coded `""`), so suggestions came from the model
  alone — hence the off-topic results. It now receives the real context, plus
  `keyword-gaps` was added to `AllCollections` so the prompt sees measured demand.
  The prompt also forbids unrelated industries and terms already tracked.

Keyword AI presets are now derived from the agent's highest-priority gaps (falling
back to a static list when no gaps exist), so the quick-start chips point at real
opportunities. Suggesting is still human-approved — nothing is auto-written to
`keywords`, because that list drives what the agent measures.

The suggestions modal gained **Add all N**. Accepting a set of ten previously took
ten clicks, so it was usually abandoned halfway, which left the gap and SERP skills
with a thinner keyword list than the operator intended.

### One measurement store: `rank-history`

`rank-history` was already the agent's time series — one doc per
(keyword, page, day), id `dayKey__slug(keyword)__slug(page)`. The admin's Search
Console button independently fetched the same API and flattened
`clicks/impressions/ctr/position` onto the `keywords` docs. Two stores, one
measurement, and whichever ran last silently defined the meaning of the numbers.

Now there is one store:

- The button writes `rank-history` rows in the agent's exact shape, with the
  agent's exact id format (`lib/utils/rank-history.ts`), so both upsert the same
  documents for a given day.
- The Keywords table's Clicks / Impr. / CTR / Pos. columns derive from the latest
  `rank-history` row per keyword (`latestMetricsByKeyword`). Same-day duplicates
  resolve to the better position, which is what "where do I rank for this" means.
- `keywords.lastSynced` is no longer written. The field stays on `SEOKeyword` so
  older docs keep type-checking; nothing reads it.

Two traps this walked into, both worth remembering:

1. **`useCollection.add()` is `addDoc`.** It discards any `id` you pass and mints a
   random one, so a "stable id" write via `add()` appends a duplicate row on every
   sync. The upsert path is `createWithId` from `lib/firebase/firestore`.
2. **The agent's slug is not the app's `slugify`.** Agent: lowercase, `[^a-z0-9]+`
   → `_`. App: hyphens. Using `slugify` would fork the id space. The contract is
   pinned by `__tests__/lib/utils/rank-history.test.ts`.

Search Console's `queries` dimension is an aggregate across pages, so rows written
from it record `page: ""` — the honest value — rather than a fabricated page. The
function now also returns a `queryPages` dimension (query × page), and the sync
prefers it so each measurement is keyed to its real landing page. The aggregated
fallback stays for a deployment that predates the field.

### Inbox: the "which alias received this" bug

`inbox.receivedBy` was written as `parsed.to.split(", ")[0]` — the *raw* first
`To` entry. For `CreedaVA Marketing <x@creedava.com>` that stored the display name
as if it were the mailbox, so no filter could ever match it, and the To column
rendered `CreedaVA Marketing <marketing` after splitting on `@`.

Three changes:

1. **`parseRecipients()`** extracts the address from the angle brackets and keeps
   the display name separately as `receivedByLabel`.
2. **Re-sync repairs history.** Already-synced messages were skipped entirely, so
   a dirty `receivedBy` was permanent. The sync now rewrites the two address
   fields when the freshly parsed value differs — nothing else is touched.
3. **The admin filter is a fixed list** (`lib/constants/business-emails.ts`), not
   `integrations/email`. That config's `user` is the mailbox Gmail *signs in as*
   (`john@creedava.com`), so the filter offered a personal inbox and made it look
   like customer mail arrived there.

`CreedaVA Marketing` and `Join` are one mailbox (`join@creedava.com`), modelled as
a single entry with an alternate label, so the address is not listed twice while
both spellings still match a received message.

### Send-as: every group, and never a silent substitution

`sendEmail` only honoured a chosen `from` when it appeared in
`integrations/email.aliases` — a list without `admins`, `billing`, `join` or
`feedback`. Naming one of those sent as `john@` anyway, with no warning. Worse,
`sendBulkEmail` had no `from` field at all, so the "Send From" picker in the bulk
modal was decorative: every bulk send went out as the sign-in account.

`functions/src/business-emails.ts` now holds the server allow-list (same eight
groups) and `resolveSenderAddress()` rejects anything the account does not own
instead of substituting quietly. `sendBulkEmail` accepts `from`, and both paths log
the actual sender to `email-log` and use the business label as the display name
(`CreedaVA Marketing <join@…>`) rather than a hard-coded `CreedaVA`.

The app and function copies of the list cannot be shared — functions deploy from
`functions/` alone — so `__tests__/lib/constants/business-emails.test.ts` asserts
the two address sets are identical. Drift fails a test instead of silently
rejecting a sender at runtime.

Each mailbox gets a health card: count, unread, and **last received date**. "No
mail yet" is not an error — it means nothing has been sent to that group so far.
Once mail does arrive, the date is the proof that the alias is live.

**The inbox shows business mail only.** The synced account is `john@creedava.com`,
so its Google alerts, receipts and internal reports dominated the view while
proving nothing about whether customers can reach CreedaVA. Mail not addressed to
one of the eight groups is hidden, with a count of what was hidden rather than a
silent filter. All 56 stored messages were addressed to `john@`, so the business
inbox is correctly empty until something is sent to a group.

**The inbox was never polled.** `syncInboxToFirestore` only ran when someone
pressed Sync, so the stored data could be months stale with nothing to indicate it.
`dailyGoogleSync` now calls the shared `runInboxSync()` (extracted from the
callable) at 06:00 and logs the result to `sync-log` like every other service.

### Charts: one component, with actual axes

`/admin` and `/admin/analytics` each carried a near-identical hand-rolled SVG area
chart. Neither drew a y-axis, so the height of the line communicated nothing; the
x-labels on `/admin` used a `traffic-label-text` class that **was never defined in
any stylesheet**, so they rendered with the default black fill on a dark card and
were effectively invisible.

`components/admin/traffic-chart.tsx` replaces both: a rounded ("nice") y-axis with
labelled gridlines, at most six non-clipping x-labels that always include the first
and last day, a marked peak, native `<title>` tooltips per point, and a summary row
(total / daily average / peak day) that answers the question the chart exists for.

### What the agent actually writes

One crawler and one synthesizer feed four surfaces. This was not visible anywhere
in the UI, which is why "Briefs" and "Action items" looked like independent
features:

| Collection | Written by | Cadence |
|---|---|---|
| `onpage-audits` | `onpage.ts` crawl | Mon 03:00 + manual Run now |
| `seo-tasks` (`autoApplied: true`, status `done`) | `onpage.ts:425` — receipt of a meta fix it already applied | same crawl |
| `seo-tasks` (status `todo`) | `synthesizer.ts:508` — high-severity issues it did **not** fix | Sun 02:00 |
| `content-briefs` | `synthesizer.ts` (thin-content, striking-distance, competitor gap) | Sun 02:00 |
| `blog` (status `draft`) | `content-writer.ts` from `content-briefs` | Sun 02:00 |

`content-writer` never auto-publishes: `autonomy.content: "execute"` still only
produces `status: "draft"`.

Two bugs this exposed, both fixed:

1. **`content-writer` silently expired briefs.** It selected
   `updatedAt >= now - 7d`, so any brief it could not reach within a week stayed
   `draft` with no `blogId` and was never queried again — the work was lost with
   no error. It now selects on `status == "draft"`, which is the real pending
   signal, and orders by priority in memory (no new composite index needed).
   `draftAttempts` caps retries at 3 so a brief the model can never compose stops
   consuming one of the 5 per-run slots; it lands in `needs-review` instead.
2. **`ContentBrief.status` omitted values the writers set.** The union was
   `draft | in-progress | published | archived`, but `content-writer` writes
   `draft-generated`. Those briefs rendered with an unstyled badge and matched no
   filter. The union now covers every value, including `needs-review`.

### The `seo` collection has no writer

The Findings tab used to hold a second table, "One-off AI reviews", reading `seo`.
Nothing produces that collection: no cloud function, no app code. The two
documents left in it were a stale `/join` review and one whose `url` field was a
prompt string (`"Review and optimize meta titles and descriptions for the top 5
pages."`) — the AI prompt was echoed back into the field meant to hold a URL.

A table of data no process writes is not a finding, so it is gone. The weekly
digest still passes `seo` as model context, which is harmless.

### The crawl already feeds Page Metadata

Worth stating because it explains why Findings and Page Metadata look similar:
`onpage.ts` is what writes `page-seo`. Its `tryAutoApplyMeta()` only overwrites a
page's description when the crawl found something usable by
`isUsableMetaValue()`. So the Findings list is the evidence behind the Default /
Ignored / Live badges on `/admin/metadata`.

### Action items: receipts vs. work
Half the rows in `seo-tasks` are `autoApplied: true, status: "done"` — a record
that the agent already changed the live page. The other half are genuine todos
from the synthesizer. They were rendered in one kanban, so an already-completed
receipt sat in the Done column looking like finished work.

The board now splits them: the three columns carry only actionable tasks, and
auto-applied changes get a separate read-only **Auto-applied changes** list with
path and timestamp.


### The nav-glue meta description bug

`functions/src/seo/onpage.ts` collapsed whole-`<body>` text with
`.replace(/\s+/g, " ")`. Nav labels have no whitespace between the elements, so
they fused into `Skip to main contentCreedaVAHomeServicesPricingAboutNewsContact…`;
`extractFirstSentence()` then found no `.!?` sentence, concatenated fragments to
157 chars, appended `"..."`, and `tryAutoApplyMeta()` wrote it into
`page-seo.description` — served live because `isUsableMetaValue()` only rejected
JSON-LD.

Three fixes, defence in depth:

1. **Crawl scoped to `<main>`** with `nav/footer/header/form/aside` stripped, and
   block elements joined with `". "` so a sentence boundary survives.
2. **`extractFirstSentence()` only accepts prose** — ≥25 chars, ends in `.!?`, not
   a known chrome label. Fragments can no longer be stitched into a description.
3. **`isUsableMetaValue()` rejects the corruption** — `skip to main content`, two
   adjacent nav labels, or a trailing `"..."`. A poisoned row now loses to the
   page's hand-written `metadata()` constant instead of shipping.

Existing bad rows in `page-seo` are **not** deleted (data is irreversible). Fix 3
means they no longer reach the live page; the row still shows the bad text in the
Page Metadata table so it can be edited deliberately.

---

## 7. Action items replaced by findings (2026-11)

The agent had two parallel output surfaces: a task board it wrote to, and the
audit lists. The board won the "looks like work" contest and lost the truth
contest — `upsertTask()` used `status: "todo"` with `merge: true` on a
deterministic id, so every Sunday run reset any triage a human had done, and 169
`seo-tasks` docs were 80 auto-applied receipts, 55 mirrored outreach drafts and
only 21 pieces of real work.

### What exists now: one `findings` collection

| Field | Purpose |
|---|---|
| `skill` | Which detector produced it (`onpage-audit`, `citation-audit`, `keyword-gaps`, `rank-drop`) |
| `scope` | `page` / `keyword` / `domain` — decides which screen owns it |
| `target` | The path, query, or host it is about |
| `code` | Stable issue code; the document id is derived from scope+target+code |
| `severity`, `message`, `evidence` | What is wrong, and which run found it |
| `suggested` | The `page-seo` field write the Fix button would make, when we know how to make one |
| `status` | `open` / `ignored` / `resolved` |

`syncFindings()` (server, `functions/src/seo/findings.ts`) upserts what a run
detected and **resolves** any doc for a target it inspected that is no longer
detected. So status is evidence-driven: a finding disappears because the page
passes, not because someone ticked a box. An `ignored` finding survives every
later run — re-detection must not resurrect a human decision.

Assessment is scoped to inspected targets only, because the on-page crawl is
paginated. A page that was not crawled keeps its findings.

### Where findings are shown

Findings annotate the surface that already owns their subject. They are never a
second, parallel list of the same rows.

| Scope | Screen | Shape |
|---|---|---|
| `page` (on-page audit, citation audit) | `/admin/metadata` | **Pages** | **Findings** tabs. Pages = what the site serves; Findings = what the crawler says is wrong, with **Run audit**, a Fix/Ignore decision, and the audit doc it came from. |
| `keyword` (gaps, low CTR, competitor-only) | `/admin/keywords` → **Gaps** | Each existing gap card carries the agent's verdict inline: state badge + **Ignore**/**Reopen**. "Track this keyword" closes the finding as `resolved` with `resolvedBy: "tracked"` — tracking *is* the fix. |
| `keyword` (rank drops) | `/admin/keywords` → **Rankings** | An **Agent** column on the existing snapshot table. Rank drops had no surface at all before this. |

There is deliberately **no** cross-cutting findings page and no separate Findings
tab on Keywords. An on-page issue is a fact about a path and a keyword issue is a
fact about a query; both already have a home, and a third list of them made the
origin of a finding the hardest thing to answer.

The inline annotation deliberately does **not** repeat the finding's message — the
card already says what the problem is. It shows only the state and the one
decision left.

`syncFindings()` takes `{ resolve: false }` for partial runs. `keyword-gaps`
probes tracked keywords with a cursor and a query cap, so a partial run has not
looked at the whole list; resolving then would close findings for keywords it
never visited, and they would look fixed because they were skipped.

### Removed

- `app/(admin)/admin/seo/_components/tasks-board.tsx` — the kanban board
- `app/(admin)/admin/seo/_components/sections/findings-section.tsx` and
  `onpage-audits.tsx` — superseded by the Findings section on Page Metadata
- The **Findings** and **Action items** sub-tabs of `/admin/seo`
- All 7 `upsertTask()` calls in the Sunday synthesizer, and `upsertTask()` itself

Legacy links still work: `?section=agent&tab=audits`, `tab=findings`,
`tab=tasks` and `tab=action-items` all redirect to
`/admin/metadata?section=findings`, and `ADMIN_ROUTE_ALIASES.seoAudits` /
`.seoTasks` point there too.

### Auto-apply removed from the crawl

`tryAutoApplyMeta()` used to write `page-seo` directly during the Monday crawl
whenever `autonomy.metaFixes === "execute"` — capturing before/after but shipping
the change before anyone saw it. That is what produced the corrupted descriptions
in §6.

The crawl is now **suggestion-only**. It writes an `onpage-audits` doc and
findings; it never touches `page-seo`. A metadata change happens only when
someone presses **Fix** on a finding, which writes the suggested value and closes
the finding as `resolved` — a later crawl then either confirms it or reopens it.

`autonomy.metaFixes` is no longer read by any crawler path.

### Data

Existing `seo-tasks` documents are **not deleted** (data is irreversible). Nothing
reads or writes them any more; they are abandoned, not migrated.

---

## 8. Creeda AI is one assistant, not a roster (2026-11)

Six named personas — ARIA (Chief of Staff), ORACLE (Growth Strategist), NOVA
(Content Creator), MAVERICK (Marketing Director), SCOUT (Sales Analyst), GUIDE
(Configuration AI) — each carried a codename, tagline, colour, avatar, a
persona system-prompt block, and a UI that offered to switch between them
(including `[HANDOFF:CODENAME]` markers in model output).

The distinction was never real: the same assistant answered every page, from the
same data, with a different module set. What actually differed is a routing
decision.

### Now

- One identity: `CREEDA_AI_NAME` in `lib/constants/ai-brand.ts`.
- One resolver: `getAssistantContext(pagePath)` in
  `lib/utils/ai-assistant-context.ts` returns the area's skill modules
  (`search`, `content`, `marketing`, `sales`, `configuration`, `overview`).
- No switcher, no codename chip, no persona block, no handoff markers.
- `SPECIALIST_INTRO` is gone from `buildTrainedPrompt()`'s options.

### Removed

- `lib/utils/ai-specialists.ts` and its test
- The **Switch specialist** dropdown (both instances in `ai-prompt.tsx`)
- `.specialist-*` CSS renamed to `.assistant-*`; the switcher-only rules
  (`.specialist-tag-btn*`, `.specialist-border-l`) deleted

### Kept

The six original skill sets are preserved as the five areas above, so no page
lost a module (pinned by `__tests__/lib/utils/ai-assistant-context.test.ts`).

---

## 9. Crawler title extraction (2026-11)

Every SVG logo renders `<title>CreedaVA</title>` for its accessible name — that
is correct markup, not a bug. But a document-wide `$("title")` read returns two
candidates per page, and on `/faq` the logo's title came **first**, so the audit
scored the 8-character brand fallback as the page title.

The crawl now reads `$("head title")` and, if `<head>` declares more than one,
takes the longest non-empty candidate. The SVG title is untouched: removing it
would strip the logo's accessible name. `meta[name='description']` gets the same
treatment for empty declarations.

Pinned by `functions/__tests__/onpage.test.ts` (title in either order, only the
fallback present, no `<head>` at all, empty description before a real one).

---

## 10. Deliberately kept — do not "clean these up"

| Kept | Why |
|---|---|
| The `projects` and `tasks` **Firestore documents** | Not requested. Nothing reads them now. Deleting data is irreversible; deleting code is not. |
| `statusVariant` keys `todo`, `done`, `blocked`, `planning`, `active`, `on-hold`, `completed`, `cancelled` | This is a lookup keyed by plain strings shared across entities. `active`, `completed`, and `planning` are used by campaigns, bookings, and landing pages. Removing the "task" ones would silently break badge colours elsewhere. |
| `Priority` / `PRIORITIES` | Used outside tasks. |
| `"Project management"` in the AI system prompt's CORE SERVICES list | That is a service the business sells, not an admin feature. |
