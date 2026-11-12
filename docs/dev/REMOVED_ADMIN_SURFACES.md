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
  `projects` from the customers page's collection list. `DEFAULT_CONFIG.collections` is
  now `["leads"]`.
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

## 4. Deliberately kept — do not "clean these up"

| Kept | Why |
|---|---|
| The `projects` and `tasks` **Firestore documents** | Not requested. Nothing reads them now. Deleting data is irreversible; deleting code is not. |
| `statusVariant` keys `todo`, `done`, `blocked`, `planning`, `active`, `on-hold`, `completed`, `cancelled` | This is a lookup keyed by plain strings shared across entities. `active`, `completed`, and `planning` are used by campaigns, bookings, and landing pages. Removing the "task" ones would silently break badge colours elsewhere. |
| `Priority` / `PRIORITIES` | Used outside tasks. |
| `"Project management"` in the AI system prompt's CORE SERVICES list | That is a service the business sells, not an admin feature. |
