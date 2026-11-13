/**
 * SEO Agent — data model for the autonomous "living AI" SEO worker.
 *
 * One agent runs on a daily-harvest + weekly-synthesis loop:
 *   Mon  on-page audit + rank history snapshot   (no Custom Search)
 *   Tue  keyword gap analysis                    (~80 Custom Search queries)
 *   Wed  citation / AIO readiness audit          (~80)
 *   Thu  backlink prospects: resources           (~80)
 *   Fri  backlink prospects: competitor mentions (~80)
 *   Sat  brand-mention scan                      (~60)
 *   Sun  synthesizer (Gemini-only): tasks, briefs, outreach, weekly email
 *
 * All collections are admin-only; see firestore.rules.
 */

import type { FirestoreDoc } from "./crm";

// ─── Agent config (singleton: integrations/seo-agent) ─────────

export type AgentAutonomy = "draft" | "execute" | "off";

export interface SeoAgentConfig {
  enabled: boolean;
  killSwitch: boolean;
  autonomy: {
    content: AgentAutonomy;       // blog drafts, briefs
    outreach: AgentAutonomy;       // backlink outreach emails
    metaFixes: AgentAutonomy;      // page-seo title/desc/og fixes
    internalLinks: AgentAutonomy;  // internal-link recommendations
  };
  /** Per-skill Custom Search hard cap (default 80, leaves 20-query buffer under free 100/day). */
  maxQueriesPerSkill: number;
  /** Email recipients for weekly synth summary. */
  summaryRecipients: string[];
  lastRunAt?: string;
}

export const DEFAULT_AGENT_CONFIG: SeoAgentConfig = {
  enabled: true,
  killSwitch: false,
  autonomy: {
    content: "draft",
    outreach: "draft",
    metaFixes: "execute",
    internalLinks: "execute",
  },
  maxQueriesPerSkill: 80,
  summaryRecipients: ["admins@creedava.com", "contact@creedava.com"],
};

// ─── Agent runs (one doc per skill invocation: agent-runs) ────

export type AgentSkill =
  | "onpage-audit"
  | "rank-history"
  | "keyword-gaps"
  | "citation-audit"
  | "backlinks-resources"
  | "backlinks-competitor"
  | "brand-mentions"
  | "synthesizer";

export type AgentRunStatus = "running" | "ok" | "partial" | "skipped" | "error";

export interface AgentRun extends FirestoreDoc {
  skill: AgentSkill;
  status: AgentRunStatus;
  startedAt: string;            // ISO
  completedAt?: string;
  source: "cron" | "manual";
  triggeredBy?: string;         // user email if manual
  /** Custom Search queries used during this run. */
  queriesUsed: number;
  queriesCap: number;
  /** Resume cursor written when quota cap hit; null when run finished. */
  cursor?: { offset: number; nextItem?: string } | null;
  findings: number;
  /** Skill-specific summary fields, kept small for the dashboard. */
  summary?: Record<string, unknown>;
  error?: string;
  killSwitchTripped?: boolean;
}

// ─── Rank history (rank-history) ──────────────────────────────

export interface RankSnapshot extends FirestoreDoc {
  keyword: string;
  page: string;            // URL
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  capturedAt: string;      // ISO date (day-resolution key)
  dayKey: string;          // YYYY-MM-DD for query-friendly grouping
}

// ─── On-page audits (onpage-audits) ───────────────────────────

export type OnPageIssueSeverity = "info" | "low" | "medium" | "high";

export interface OnPageIssue {
  code: string;            // e.g. "title-missing", "meta-too-short"
  severity: OnPageIssueSeverity;
  message: string;
  fix?: string;
  /** When `auto-fixable`, the agent may apply via page-seo if autonomy allows. */
  autoFixable?: boolean;
}

export interface OnPageAudit extends FirestoreDoc {
  url: string;
  pathKey: string;          // route path used by page-seo (e.g. "/services")
  score: number;            // 0–100
  fetchedAt: string;
  status: number;           // HTTP status
  responseTimeMs: number;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Count: number;
  canonical: string | null;
  ogTags: { property: string; content: string }[];
  jsonLdTypes: string[];
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  imagesMissingAlt: number;
  wordCount: number;
  issues: OnPageIssue[];
}

// ─── Keyword gaps (keyword-gaps) ──────────────────────────────

export interface KeywordGap extends FirestoreDoc {
  keyword: string;
  type: "striking-distance" | "competitor-only" | "low-ctr";
  /** For striking-distance: position 11–30 today. */
  currentPosition?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  /** Page already targeting this keyword (if any). */
  rankingPage?: string;
  /** Competitors observed ranking for this term. */
  competitorPages?: { domain: string; url: string }[];
  priority: number;        // 0–100 (impact * ease)
  capturedAt: string;
}

// ─── Citation / AIO readiness audits (citation-audits) ────────

export interface CitationAudit extends FirestoreDoc {
  url: string;
  pathKey: string;
  score: number;             // 0–100
  fetchedAt: string;
  hasFaqSchema: boolean;
  hasArticleSchema: boolean;
  paaCoverage: number;       // count of PAA questions answered on the page
  quotableBullets: number;   // bullet/list count (LLM extraction friendliness)
  hasCitations: boolean;     // outbound .gov/.edu links or <cite>
  headingDepth: number;
  paragraphCount: number;
  recommendations: string[];
}

// ─── Backlink prospects (backlink-prospects) ──────────────────

export type ProspectKind =
  | "resources-page"
  | "guest-post"
  | "competitor-mention"
  | "unlinked-brand-mention";

export interface BacklinkProspect extends FirestoreDoc {
  kind: ProspectKind;
  domain: string;
  url: string;
  title: string;
  snippet: string;
  /** Search query that surfaced this prospect (for audit trail). */
  sourceQuery: string;
  /** 0–100; heuristic from URL depth, HTTPS, freshness, snippet relevance. */
  score: number;
  /** Status managed by user / outreach drafter. */
  status: "new" | "drafted" | "contacted" | "won" | "ignored";
  capturedAt: string;
  notes?: string;
}

// ─── Outreach emails (outreach-emails) ────────────────────────

export interface OutreachEmail extends FirestoreDoc {
  prospectId: string;
  recipientDomain: string;
  recipientEmail?: string;     // best-guess if found in snippet
  subject: string;
  bodyHtml: string;
  bodyText: string;
  status: "draft" | "sent" | "replied" | "ignored";
  generatedAt: string;
  sentAt?: string;
}

// ─── Internal-link suggestions (internal-link-suggestions) ────

export interface InternalLinkSuggestion extends FirestoreDoc {
  fromPath: string;
  toPath: string;
  anchorText: string;
  reason: string;             // e.g. "boost striking-distance keyword"
  cluster?: string;           // shared-keyword cluster id
  status: "new" | "applied" | "ignored";
  capturedAt: string;
}

// ─── Content briefs (content-briefs) ──────────────────────────

export interface ContentBrief extends FirestoreDoc {
  keyword: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  targetWordCount: number;
  outline: { heading: string; bullets: string[] }[];
  faqs: { question: string; answer: string }[];
  internalLinks: { toPath: string; anchorText: string }[];
  citationSources: string[];
  /** Optional source signals. */
  sourceGapId?: string;
  status: "new" | "drafted" | "published" | "ignored";
  /** Set when AI writes a draft blog post from this brief. */
  blogPostId?: string;
  generatedAt: string;
}

// ─── SEO tasks (seo-tasks) ────────────────────────────────────

export type SeoTaskKind =
  | "fix-meta"
  | "rewrite-title"
  | "add-internal-links"
  | "publish-content"
  | "outreach"
  | "improve-citation"
  | "investigate-rank-drop";

export interface SeoTask extends FirestoreDoc {
  kind: SeoTaskKind;
  title: string;
  description: string;
  priority: number;            // 0–100
  status: "todo" | "in-progress" | "done" | "ignored";
  /** Source links so the user can drill into the source data. */
  sources: {
    audits?: string[];
    gaps?: string[];
    citations?: string[];
    prospects?: string[];
    rankDrops?: string[];
    briefs?: string[];
  };
  area: "meta" | "content" | "links" | "outreach" | "rankings";
  affectedPath?: string;
  affectedKeyword?: string;
  capturedAt: string;
  appliedAt?: string;
  /** Set when the agent auto-applied (e.g. meta fix); enables rollback. */
  autoApplied?: boolean;
  /** For meta fix audit trail. */
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}
