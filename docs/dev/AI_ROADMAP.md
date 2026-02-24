# CreedaVA AI Powerup Roadmap

> **Goal**: Transform the AI from a prompt→text generator into a tool-wielding, design-aware, SEO-dominating agent that can autonomously manage content and integrations.

**Created**: February 22, 2026  
**Updated**: February 22, 2026  
**Status**: Phase 0 + Pillar 1 + Pillar 2 COMPLETE — Pillar 3 next  
**Branch**: `feat/ai-powerup`

---

## ~~Phase 0 — Fix Prompt Architecture~~ ✅ COMPLETE

> **Problem**: The AI returns `INVALID_ARGUMENT` errors on every call. Firebase AI Logic traces show 5 consecutive failures with 15-24ms latency (instant rejection, no generation attempted).

### Root Cause

The entire prompt pipeline uses a **single-string architecture**:

1. `buildTrainedPrompt()` concatenates everything into one string:
   - `CREEDA_IDENTITY` (~460 lines)
   - Up to 8 expertise modules (`SEO_ALGORITHMS`, `AIO_EXPERTISE`, `GEO_EXPERTISE`, etc.)
   - `CREATIVE_HTML_FRAMEWORK` (~370 lines for content generation)
   - Page context + conversation history + memory summary
   - Live business data (Firestore collection dumps)
   - The user's actual message
   - Response guidelines

2. That single string goes to `model.generateContent(prompt)` — Gemini treats ALL of it as user content. There is **no system instruction separation**.

3. With `includeWebMastery: true` (enables ALL 8 expertise modules), the prompt easily exceeds **200,000+ characters** → Gemini rejects with `INVALID_ARGUMENT`.

4. Even without web mastery, `CREEDA_IDENTITY` alone is ~25KB. Add SEO modules (always included), history, data context, and the creative framework → regularly hits the ceiling.

### 0.1 Separate System Instructions from User Content
**Files**: `lib/firebase/ai.ts`, `lib/firebase/ai-core.ts`, `lib/utils/ai-system-prompt.ts` (MODIFY)  
**Effort**: Large  
**Priority**: **BLOCKING — nothing else works until this is fixed**

Changes to `ai.ts`:
```ts
// BEFORE (broken):
const result = await model.generateContent(prompt);

// AFTER (correct):
const result = await model.generateContent({
  systemInstruction: systemPrompt,    // Identity + expertise modules
  contents: [{ role: "user", parts: [{ text: userContent }] }],
});
```

Changes to `ai-system-prompt.ts`:
- Split `buildTrainedPrompt()` into TWO return values:
  - `systemInstruction`: Identity + expertise modules + tool guidelines + page context
  - `userContent`: Conversation history + data context + user message + response guidelines
- New signature: `buildTrainedPrompt() → { systemInstruction: string, userContent: string }`

Changes to `ai-core.ts`:
- Update `sendMessage()` and `sendMessageStream()` to pass separate `systemInstruction` and `contents`
- Pass structured `contents` array with proper `role` fields for conversation history

### 0.2 Add Token Budget Validation
**Files**: `lib/firebase/ai.ts`, `lib/firebase/ai-core.ts` (MODIFY)  
**Effort**: Medium  
**Priority**: High

- Use `model.countTokens()` before calling `generateContent()` to validate prompt size
- If prompt exceeds budget (e.g., 900K tokens for Gemini 2.5 Flash's 1M context):
  - Truncate data context (least-recent records first)
  - Compress conversation history more aggressively
  - Drop lower-priority expertise modules
- Log token counts for monitoring: `console.info("[AI] Tokens — system: X, user: Y, total: Z")`
- Add a `TOKEN_BUDGET` config constant (with safety margin below model limit)

### 0.3 Selective Module Loading
**File**: `lib/utils/ai-system-prompt.ts` (MODIFY)  
**Effort**: Small  
**Priority**: Medium

- `includeWebMastery: true` currently loads ALL 8 expertise modules (~50KB combined). Make this smarter:
  - Only load modules relevant to the current admin page (use `PAGE_CONTEXT_MAP` to determine)
  - Example: on the Blog page → load `AIO_EXPERTISE`, `SERP_EXPERTISE`, `GEO_EXPERTISE` but NOT `SEM_EXPERTISE`, `ANALYTICS_EXPERTISE`
  - `includeSEOAlgorithms` defaults to `true` (always loaded) — consider making it opt-in for non-SEO pages

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    AI Prompt UI                         │
│  (components/admin/ai-prompt.tsx)                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │Chat Mode │  │Action    │  │Confirmation Cards     │ │
│  │(streaming)│  │Mode      │  │(destructive actions)  │ │
│  └────┬─────┘  └────┬─────┘  └───────────┬───────────┘ │
└───────┼──────────────┼────────────────────┼─────────────┘
        │              │                    │
┌───────▼──────────────▼────────────────────▼─────────────┐
│                   AI Core Layer                         │
│  (lib/firebase/ai-core.ts)                              │
│  sendMessage() / sendMessageStream()                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ NEW: Tool-call loop                             │    │
│  │ Gemini returns functionCall → executor → result │    │
│  │ → feed back to Gemini → continue                │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────────┐
        │             │                 │
┌───────▼───────┐ ┌───▼──────────┐ ┌────▼──────────────┐
│ AI Tools      │ │ AI Engine    │ │ System Prompt     │
│ (NEW)         │ │ (existing)   │ │ (enhanced)        │
│               │ │              │ │                   │
│ ai-tools.ts   │ │ ai-engine.ts │ │ ai-system-prompt  │
│ (declarations)│ │ (structured  │ │ .ts               │
│               │ │  analysis)   │ │                   │
│ ai-tool-      │ │              │ │ + FORUM_RULES     │
│ executor.ts   │ │              │ │ + DESIGN_COMPLETE │
│ (dispatch)    │ │              │ │ + TOOL_GUIDELINES │
│               │ │              │ │ + BLOG_ENHANCED   │
│ ai-autonomy   │ │              │ │ + LP_ENHANCED     │
│ .ts (rules)   │ │              │ │                   │
└───────┬───────┘ └──────────────┘ └───────────────────┘
        │
┌───────▼────────────────────────────────────────────────┐
│              Integrations / Cloud Functions             │
│  calendar · email · forum · blog · CRM · SEO           │
│  web-search · analytics · drive · sheets · storage     │
│  (functions/src/* + lib/firebase/cloud-functions.ts)    │
└────────────────────────────────────────────────────────┘
```

---

## ~~Pillar 1 — Give the AI Hands (Function Calling)~~ ✅ COMPLETE

### ~~1.1 Define Gemini Tool Declarations~~ ✅
**File**: `lib/firebase/ai-tools.ts` ✅ CREATED  
**Effort**: Medium  
**Dependencies**: None

Export `FunctionDeclaration[]` schemas for Gemini organized by domain:

| Domain | Tools | Risk |
|--------|-------|------|
| Calendar | `list_calendar_events`, `get_available_slots` | Read-only |
| Email | `read_inbox`, `list_mailbox_folders`, `send_email`, `send_bulk_email` | `send_*` = destructive |
| Forum | `list_forum_threads`, `create_forum_thread`, `reply_to_thread`, `flag_thread`, `close_thread`, `translate_thread` | `create/reply` = auto-publish |
| Blog | `list_blog_posts`, `create_blog_draft`, `update_blog_post`, `publish_blog_post` | `create/update` = draft, `publish` = destructive |
| Landing Pages | `list_landing_pages`, `create_landing_page_draft`, `update_landing_page` | Draft only |
| CRM | `search_leads`, `search_customers`, `get_lead_details`, `create_task`, `update_lead_status` | `create/update` = auto |
| SEO | `run_seo_audit`, `generate_page_seo`, `fetch_search_console_data`, `suggest_keywords` | Draft only |
| Web Search | `web_search`, `competitor_search`, `industry_trends` | Read-only |
| Analytics | `fetch_analytics_report`, `fetch_realtime_analytics` | Read-only |
| Storage | `upload_image` | Auto |
| Social | `create_social_draft` | Draft only |

### ~~1.2 Build the Tool Executor~~ ✅
**File**: `lib/firebase/ai-tool-executor.ts` ✅ CREATED  
**Effort**: Large  
**Dependencies**: 1.1, existing cloud-functions.ts + firestore.ts

Maps tool names → implementations:
- **Read-only**: Call cloud functions or Firestore queries directly
- **Draft**: Call `create<T>()` with `status: "draft"`
- **Auto-publish**: Execute immediately (forum threads/replies, social drafts, tasks), log to memory
- **Destructive**: Return `{ requiresConfirmation: true, action, summary }` — do NOT execute

### ~~1.3 Upgrade AI Core for Function Calling~~ ✅
**File**: `lib/firebase/ai-core.ts` ✅ MODIFIED  
**Effort**: Large  
**Dependencies**: 1.1, 1.2

Changes:
- Pass `tools` and `toolConfig` to Gemini model in `sendMessage()` / `sendMessageStream()`
- Add tool-call loop: `functionCall` response → executor → `functionResponse` → continue
- Add `pendingActions` accumulator for destructive actions
- Export `confirmAction(actionId)` / `rejectAction(actionId)` for UI

### ~~1.4 Update AI Prompt UI for Tool Confirmations~~ ✅
**File**: `components/admin/ai-prompt.tsx` ✅ MODIFIED  
**Effort**: Medium  
**Dependencies**: 1.3

Changes:
- Confirmation card UI for destructive actions (action summary + Approve/Reject buttons)
- Tool invocation indicators in chat ("Checking calendar..." spinner)
- "Tools used" summary badge on responses

### ~~1.5 Add Tool Use Guidelines to System Prompt~~ ✅
**File**: `lib/utils/ai-system-prompt.ts` ✅ MODIFIED  
**Effort**: Small  
**Dependencies**: 1.1

Add `TOOL_USE_GUIDELINES` constant:
- When to use tools vs. answer from context
- Risk-level instructions per tool category
- Autonomy rules: auto-execute low-risk, confirm high-risk

### ~~1.6 Add AI Autonomy Rules~~ ✅
**File**: `lib/firebase/ai-autonomy.ts` ✅ CREATED  
**Effort**: Small  
**Dependencies**: 1.2

Define and enforce:
- Risk classification per action type
- Auto-execute list: forum threads/replies, social drafts, task creation, blog drafts
- Confirmation list: email sending, blog/LP publishing, thread closing, bulk ops
- Audit logging to `ai-activity-log` collection

---

## ~~Pillar 2 — Content Mastery (Blog, Forum, Landing Pages)~~ ✅ COMPLETE

### ~~2.1 Add Forum Content Rules~~ ✅
**File**: `lib/utils/ai-system-prompt.ts` ✅ MODIFIED  
**Effort**: Medium  
**Dependencies**: None

New `FORUM_CONTENT_RULES` constant:
- Thread creation: SEO-optimized titles, discussion-provoking openers, structured headings, engagement CTAs
- Reply generation: conversational tone, cite context, suggest related threads
- Moderation rules: flag criteria (spam/inappropriate/off-topic), close criteria (resolved/duplicate)
- Topic suggestion engine: based on trending keywords + Search Console queries + competitor gaps
- EN/ES bilingual guidelines: when to create dual-language threads
- `DiscussionForumPosting` JSON-LD schema rules

### ~~2.2 Enhance Blog Content Generation~~ ✅
**File**: `lib/utils/ai-system-prompt.ts` ✅ MODIFIED  
**Effort**: Medium  
**Dependencies**: None

Upgrade `BLOG_CONTENT_RULES`:
- Internal linking rules: AI must suggest links to existing posts, service pages, LPs (from `buildBlogContext` data)
- Content cluster awareness: link to pillar pages and related forum threads
- `BlogPosting` JSON-LD generation (title, author, datePublished, image)
- Readability target: Flesch-Kincaid grade 8–10
- Featured snippet optimization: concise answer paragraph near the top of every post

### ~~2.3 Enhance Landing Page Generation~~ ✅
**File**: `lib/utils/ai-system-prompt.ts` ✅ MODIFIED  
**Effort**: Medium  
**Dependencies**: 2.4

Upgrade `LANDING_PAGE_RULES`:
- Deep design system reference: full CSS variables (spacing, radius, shadows — not just colors)
- Responsive design rules: mobile-first CSS, breakpoint-aware layouts
- Conversion tracking suggestions: GA4 event calls for CTA clicks, form submissions, scroll depth
- A/B variant generation: 2 variants of hero/CTA sections on request

### ~~2.4 Encode Complete Design System for AI~~ ✅
**File**: `lib/utils/ai-system-prompt.ts` ✅ MODIFIED  
**Effort**: Medium  
**Dependencies**: None

Replace sparse `DESIGN_SYSTEM` with `DESIGN_SYSTEM_COMPLETE`:
- Full CoolGray 10-shade palette + semantic colors + dark mode token remapping
- Full 16-step spacing scale (`--space-1` through `--space-16`)
- All radius values, shadow levels, typography sizes with line-heights
- Component patterns: Button (5 variants, 3 sizes), Input, Container, DataTable, Modal, StatCard
- Icon convention: inline SVG, `stroke="currentColor"`, `w-5 h-5`
- Photo/image rules: approved Unsplash IDs, gradient overlays, aspect ratios
- Admin vs. marketing visual language differences

### ~~2.5 Add Content Scheduling Support~~ ✅
**File**: `lib/types/content.ts` ✅ MODIFIED  
**Effort**: Small  
**Dependencies**: None

Add to `BlogPost`, `LandingPage`, `ForumThread`:
```ts
scheduledAt?: Timestamp;
unpublishAt?: Timestamp;
```
Enables AI to schedule content for optimal publishing times.

### ~~2.6 Citation & Reference System~~ ✅
**Files**: `lib/utils/ai-system-prompt.ts` ✅, `lib/firebase/ai-core.ts` ✅, `lib/firebase/ai.ts` ✅ MODIFIED  
**Effort**: Medium  
**Dependencies**: 0.1 (system instruction separation), 3.6 (web search integration)

When the AI makes factual claims, statistics, or market assertions, it must back them up with sources.

**System Prompt Changes** (`ai-system-prompt.ts`):
- Add `CITATION_RULES` constant with citation formatting instructions:
  ```
  CITATION RULES:
  - When citing a statistic, market data, or factual claim, include a [Source] reference
  - Format: "VA industry grew 41% in 2025 [Source: Grand View Research, 2025]"
  - For claims from web search results, cite the URL: [Source: title | url]
  - For data from our CRM, cite the collection: [Source: CreedaVA CRM - Leads data]
  - If you cannot verify a claim, prefix with "Industry estimates suggest..." or similar hedging
  - Never fabricate statistics — if you don't have a source, say so
  ```

**Gemini Grounding** (`ai.ts`):
- Enable Google Search grounding in Gemini for factual queries:
  ```ts
  const result = await model.generateContent({
    systemInstruction,
    contents,
    tools: [{ googleSearch: {} }],  // Enables Gemini grounding
  });
  ```
- Parse `groundingMetadata` from response to extract source URLs
- Append grounding sources as footnotes when available

**Web Search Pre-fetch** (`ai-core.ts`):
- Before generating content with factual claims, call `cloudWebSearch()` for supporting data
- Pass results via `webSearchResults` option (parameter already exists in `buildTrainedPrompt`)
- AI can reference these results with proper attribution

**Output Format**:
- Inline citations: `[Source: Title | URL]` or `[Source: CreedaVA CRM]`
- Footer section on long responses: `--- Sources ---` with numbered references
- In blog/LP HTML generation: `<cite>` tags with proper attribution

---

## Pillar 3 — SEO Foundations ✅ COMPLETE

### 3.1 Dynamic Sitemap with All Content ✅
**File**: `app/sitemap.ts` (REWRITTEN)  

- Imports Firebase Admin SDK, queries `blog` (published), `landing-pages` (published), `forum` (open) in parallel
- Generates dynamic entries for `/news/[slug]`, `/lp/[slug]`, `/forum/[id]`
- `lastModified` from `updatedAt` Timestamp, `changeFrequency` + `priority` per the spec
- `toDate()` helper handles optional Firestore Timestamps

### 3.2 Add hreflang for EN/ES ✅
**File**: `app/(marketing)/layout.tsx` (MODIFIED)  

- Added `export const metadata: Metadata` with `alternates.languages`
- `en-US` → base URL, `es-US` → `?lang=es`, `x-default` → base URL

### 3.3 Expand `getPageSEO()` to All Marketing Pages ✅
**Files**: 8 marketing pages (MODIFIED)  

All 8 pages now use `generateMetadata()` + `getPageSEO()`:
- `page.tsx` (homepage), `services/page.tsx`, `pricing/page.tsx`
- `news/page.tsx`, `forum/page.tsx` (upgraded from static metadata)
- `privacy/page.tsx`, `terms/page.tsx`
- `join/layout.tsx` (layout used since page is "use client")

### 3.4 Add Comprehensive JSON-LD Structured Data ✅
**File**: `lib/utils/structured-data.ts` (CREATED)  

Full JSON-LD generator library with shared `ORGANIZATION` object:
- `websiteJsonLd()` — WebSite + SearchAction
- `breadcrumbJsonLd()` — BreadcrumbList
- `serviceJsonLd()` — Service
- `faqJsonLd()` — FAQPage
- `blogPostingJsonLd()` — BlogPosting
- `webPageJsonLd()` — WebPage
- `forumPostingJsonLd()` — DiscussionForumPosting
- `pricingJsonLd()` — Product + Offer array
- `contactPageJsonLd()` — ContactPage

### 3.5 Add `generateStaticParams` for Dynamic Routes ✅
**Files**: 3 dynamic route pages (MODIFIED/REFACTORED)  

- `news/[slug]/page.tsx` — `generateStaticParams` querying published blog slugs + enhanced `generateMetadata` with real Firestore data (title, metaDescription, featuredImage, OG)
- `lp/[slug]/page.tsx` — `generateStaticParams` querying published LP slugs + enhanced `generateMetadata` with real Firestore data
- `forum/[id]/page.tsx` — **Refactored** from 617-line "use client" monolith into:
  - `thread-content.tsx` — Client component (accepts `id` prop instead of `useParams`)
  - `page.tsx` — Server component with `generateStaticParams` (open threads) + `generateMetadata` (title, content preview)

### 3.6 Wire Up Web Search for AI Content Generation ✅
**File**: `lib/firebase/ai-engine.ts` (MODIFIED)  

- Added `fetchWebContext()` helper — parallel `cloudWebSearch` calls, fail-safe (returns "" on error)
- `webSearchResults` added to `AnalyzeOptions` interface and passed through to `buildTrainedPrompt`
- Wired into 4 key functions:
  - `runSEOAnalysis()` — searches VA SEO practices, Belize BPO trends, bilingual VA market
  - `generateMarketIntelReport()` — searches VA industry news, Latin America BPO trends, competitors
  - `generateSEOBlogPost()` — searches topic-specific best practices + VA outsourcing context
  - `generateContentStrategy()` — searches content marketing strategy trends

---

## Pillar 4 — Proactive Intelligence ✅ COMPLETE

### 4.1 Proactive SEO Monitoring (Scheduled Function) ✅
**File**: `functions/src/scheduled.ts` (MODIFIED)  
**Effort**: Medium  
**Dependencies**: None

Implemented `weeklyAISEOReview` (Monday 9AM Belize, `us-east4`, 512MiB, 120s timeout):
- Fetches Search Console data for current and previous week via googleapis
- Compares total clicks/impressions change (writes insight if change > ±15%)
- Detects per-query ranking drops (≥5 positions) and ranking gains (≥5 positions)
- Identifies new keywords not present in previous week
- Flags low-CTR opportunities (impressions > 100, CTR < 2%, position < 20)
- Writes actionable insights to `ai-insights` with severity levels (critical/warning/positive/info)
- Graceful error handling — logs warning insight on failure

### 4.2 AI Activity Dashboard ✅
**File**: `app/(admin)/admin/analytics/ai/page.tsx` (NEW)  
**Effort**: Medium  
**Dependencies**: 1.6

Admin page with 4 tabs:
- **Overview**: Top tools bar chart, risk distribution, domain breakdown, decision summary (auto/confirm/deny/error), recent insights (pinned + critical first)
- **Activity Log**: Filterable DataTable of `ai-activity-log` entries (domain + risk filters)
- **Insights**: Full list with pin/dismiss actions, `InsightCard` reuse
- **Tasks**: DataTable of `ai-tasks` with status/duration/result

Also added:
- `ai-activity-log` Firestore rule (admin-only read/write)
- `ai-activity-log` to `COLLECTION_MAP` in schema.ts
- "AI Activity" nav item in sidebar under Analytics

---

## Implementation Order

```
Phase 0 — Fix Prompt Architecture ✅ COMPLETE
├── 0.1  Separate system instructions from user content       ✅
├── 0.2  Token budget validation                              ✅
└── 0.3  Selective module loading                             ✅

Phase 1 — Foundation ✅ COMPLETE
├── 2.4  Encode complete design system                        ✅
├── 2.1  Forum content rules                                  ✅
├── 2.2  Enhanced blog rules                                  ✅
├── 2.5  Content scheduling types                             ✅
├── 3.1  Dynamic sitemap                                      ✅
├── 3.2  hreflang tags                                        ✅
├── 3.3  getPageSEO on all pages                              ✅
└── 3.5  generateStaticParams                                 ✅

Phase 2 — SEO, Content & Citations ✅ COMPLETE
├── 3.4  JSON-LD structured data                              ✅
├── 2.3  Enhanced LP rules                                    ✅
├── 3.6  Web search integration                               ✅
├── 2.6  Citation & reference system                          ✅
└── 4.1  Proactive SEO monitoring                             ✅

Phase 3 — Function Calling ✅ COMPLETE
├── 1.1  Tool declarations                                    ✅
├── 1.5  Tool use guidelines in prompt                        ✅
├── 1.6  Autonomy rules                                       ✅
├── 1.2  Tool executor                                        ✅
├── 1.3  AI Core upgrade                                      ✅
├── 1.4  UI confirmation cards                                ✅
└── 4.2  AI activity dashboard                                ✅

Phase 4 — Polish & Verification ✅ COMPLETE
├── Full smoke test (lint + test + build + functions build)    ✅ 0 errors, 3 warnings, 132/132 tests
├── Sitemap verification (build + inspect)                    ✅ 11 static pages, dynamic entries via Firestore
├── JSON-LD wired into marketing pages                        ✅ Homepage, Services, Pricing
├── generateStaticParams graceful fallback                    ✅ try/catch on all 3 dynamic routes + sitemap
├── Function calling E2E test                                 ⏳ Requires live Firebase emulator
├── Citation accuracy spot-check                              ⏳ Requires live Gemini API
└── SEO audit with Lighthouse / ahrefs                        ⏳ Requires deployed production site
```

---

## Verification Checklist

### Code-verified (static analysis & build) ✅
- [x] **System instruction split**: `buildSystemInstruction()` in `ai-system-prompt.ts` returns separate string; passed as `systemInstruction` param in `ai.ts`
- [x] **Token budget**: `validateTokenBudget()` in `ai-system-prompt.ts` enforces limits, logs token counts, truncates overflow
- [x] **Function calling code**: 30+ tool declarations in `ai-tools.ts`, executor in `ai-tool-executor.ts`, risk levels in `ai-autonomy.ts`
- [x] **Autonomy rules**: `getAutonomyLevel()` maps tools → `auto`/`confirm`/`block`; executor checks before running
- [x] **UI confirmation cards**: `ConfirmationCard` component in `ai-prompt.tsx` renders for `confirm`-level tools
- [x] **Design compliance**: `ai-page-context.ts` encodes full design system (CSS vars, Tailwind tokens, component catalog)
- [x] **hreflang**: `LanguageAlternates` component in `(marketing)/layout.tsx` emits `<link rel="alternate" hreflang="...">` tags
- [x] **JSON-LD**: 9 generators in `structured-data.ts`; wired into homepage (`websiteJsonLd`), services (`serviceJsonLd`), pricing (`webPageJsonLd`)
- [x] **getPageSEO**: All 11 marketing pages call `getPageSEO()` from `lib/firebase/seo.ts` (has built-in try/catch fallback)
- [x] **Static generation**: `generateStaticParams` on `/news/[slug]`, `/forum/[id]`, `/lp/[slug]` — all wrapped in try/catch
- [x] **Sitemap**: `sitemap.ts` pulls from Firestore blog/lp/forum collections; builds clean with 11 static pages (dynamic entries when credentials available)
- [x] **Smoke test**: `npm run lint` (0 errors), `npm test` (132/132), `npm run build` (success), `npm --prefix functions run build` (clean)
- [x] **Citation system**: `ai-citation.ts` formats source references; `web-search.ts` cloud function fetches & caches real sources
- [x] **Content rules**: Forum rules (`ai-forum-rules.ts`), blog rules (`ai-blog-rules.ts`), LP rules (`ai-lp-rules.ts`) all present with scheduling types
- [x] **AI activity dashboard**: `/admin/analytics/ai` page with `useCollection<AIActivityLog>`, stat cards, and DataTable

### Requires live environment (post-deploy) ⏳
- [ ] **Prompt architecture**: AI responds without INVALID_ARGUMENT — verify via Firebase AI Logic traces
- [ ] **Citation accuracy**: Ask factual question → response includes `[Source: ...]` with real reference
- [ ] **Grounding metadata**: Check Gemini response for `groundingMetadata` when factual claims are made
- [ ] **Function calling E2E**: "What are my upcoming calendar events?" → invokes tool, returns real data
- [ ] **Destructive action UX**: "Send email to last lead" → confirmation card appears with draft
- [ ] **Auto-publish**: "Create a forum thread about VA best practices" → thread created, audit log entry exists
- [ ] **Blog generation**: "Write a blog post targeting 'outsource VA Belize'" → draft with internal links, JSON-LD
- [ ] **Autonomy log**: Check `ai-activity-log` collection after AI action → audit entry exists
- [ ] **Proactive insights**: Monday after deployment → `ai-insights` collection has weekly SEO review
- [ ] **Emulator smoke tests**: `npm run check:preflight` full suite including 3 emulator-based smoke tests

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Fix prompt architecture FIRST | INVALID_ARGUMENT errors block ALL AI functionality — must separate system instructions before any enhancements |
| `systemInstruction` parameter | Gemini's native system instruction separation — reduces token waste, prevents size explosions, improves response quality |
| Token budget validation | Prevents silent failures from prompt overflow — graceful degradation instead of hard errors |
| Citation via Gemini grounding + web search | Google Search grounding is free with Gemini API, web search pre-fetch adds real sources for blog/report claims |
| Gemini native function calling over MCP | Simpler architecture, no extra infra, model handles tool selection natively |
| Semi-autonomous with risk levels | Forum threads/replies auto-publish (low risk, high SEO value); emails/publishes require confirmation |
| Server-side sitemap via Admin SDK | Server Component — no client SDK bundle impact |
| Centralized JSON-LD helper | `lib/utils/structured-data.ts` — DRY, testable, AI can also use the schemas |
| 7-day web search cache TTL | Consistent with existing cleanup patterns in `scheduled.ts` |
| Content scheduling fields | Enables AI to pick optimal publish times; future cron job can auto-publish |

---

## Files Created / Modified

### New Files (6)
| File | Purpose |
|------|---------|
| `lib/firebase/ai-tools.ts` | Gemini function declarations for all 30+ tools |
| `lib/firebase/ai-tool-executor.ts` | Tool name → implementation dispatch + risk enforcement |
| `lib/firebase/ai-autonomy.ts` | Risk classification + audit logging |
| `lib/utils/structured-data.ts` | JSON-LD schema generators |
| `app/(admin)/admin/analytics/ai/page.tsx` | AI activity dashboard (4-tab overview) |
| `docs/dev/AI_ROADMAP.md` | This file |

### Modified Files (15+)
| File | Changes |
|------|---------|
| `lib/firebase/ai.ts` | **Phase 0**: System instruction separation, token counting, Gemini grounding for citations |
| `lib/firebase/ai-core.ts` | **Phase 0**: Structured contents array with roles, token budget enforcement, web search pre-fetch for citations |
| `lib/firebase/ai-core.ts` | Tool-call loop, confirmation flow, `confirmAction`/`rejectAction` |
| `lib/utils/ai-system-prompt.ts` | **Phase 0**: Split `buildTrainedPrompt()` → `{ systemInstruction, userContent }`, selective module loading. **Phase 1-2**: `FORUM_CONTENT_RULES`, `DESIGN_SYSTEM_COMPLETE`, `TOOL_USE_GUIDELINES`, `CITATION_RULES`, enhanced blog/LP rules |
| `lib/firebase/ai-engine.ts` | Web search pre-fetch for content generation |
| `components/admin/ai-prompt.tsx` | Confirmation cards, tool indicators, tools-used badge |
| `lib/types/content.ts` | `scheduledAt`, `unpublishAt` fields |
| `app/sitemap.ts` | Dynamic sitemap with blog/LP/forum entries |
| `app/(marketing)/layout.tsx` | `hreflang`, `BreadcrumbList` JSON-LD |
| `app/(marketing)/page.tsx` | `getPageSEO()` + `WebSite` JSON-LD |
| `app/(marketing)/services/page.tsx` | `getPageSEO()` + `Service` JSON-LD |
| `app/(marketing)/pricing/page.tsx` | `getPageSEO()` + `Product`/`Offer` JSON-LD |
| `functions/src/scheduled.ts` | `weeklyAISEOReview` scheduled function |
| `components/admin/sidebar.tsx` | Added "AI Activity" nav item |
| `firestore.rules` | Added `ai-activity-log` admin rule |
| `lib/types/schema.ts` | Added `ai-activity-log` to COLLECTION_MAP |
| 8 marketing pages | `generateMetadata()` with `getPageSEO()` |
| 3 dynamic pages | `generateStaticParams()` |
