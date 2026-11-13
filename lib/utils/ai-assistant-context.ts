/**
 * Creeda AI — one assistant, applied to the area you are looking at.
 *
 * There is no roster of named personas: the identity is "Creeda AI" everywhere
 * and only the skill modules change, because an SEO page needs the ranking and
 * SERP material while a leads page needs pipeline context. That is a routing
 * decision, not a different character, so the table below is keyed by admin area
 * rather than by codename.
 */

// ─── Types ───────────────────────────────────────────

/** Skill modules the system prompt should include for one admin area. */
export interface AssistantPromptOptions {
  includeCompetitors?: boolean;
  includeKPIs?: boolean;
  includeSEOAlgorithms?: boolean;
  includeMarketIntel?: boolean;
  includeDesignSystem?: boolean;
  includeCreativeFramework?: boolean;
  includeLandingPageRules?: boolean;
  includeBlogRules?: boolean;
  includeForumRules?: boolean;
  includeReportFormat?: boolean;
  includeAIO?: boolean;
  includeGEO?: boolean;
  includeSERP?: boolean;
  includeSEM?: boolean;
  includeAnalytics?: boolean;
  includeTechnicalSEO?: boolean;
  includeAuthority?: boolean;
  includeCRO?: boolean;
  includeCitationRules?: boolean;
}

export interface AssistantContext {
  /** Admin area this set of skills belongs to — for diagnostics, not display. */
  area: string;
  promptOptions: AssistantPromptOptions;
}

/** Everything the assistant always has, because every area reads the whole business. */
const BASELINE: AssistantPromptOptions = {
  includeAnalytics: true,
  includeCitationRules: true,
};

// ─── Skill sets, one per admin area ──────────────────

const SKILL_SETS: Record<string, AssistantPromptOptions> = {
  /** Dashboard and bookings — company-wide health. */
  overview: {
    ...BASELINE,
    includeCompetitors: true,
    includeKPIs: true,
    includeMarketIntel: true,
    includeReportFormat: true,
  },
  /** SEO, keywords, analytics — search performance. */
  search: {
    ...BASELINE,
    includeCompetitors: true,
    includeKPIs: true,
    includeSEOAlgorithms: true,
    includeAIO: true,
    includeGEO: true,
    includeSERP: true,
    includeTechnicalSEO: true,
    includeAuthority: true,
  },
  /** Blog, forum, landing pages — writing and design. */
  content: {
    ...BASELINE,
    includeSEOAlgorithms: true,
    includeDesignSystem: true,
    includeCreativeFramework: true,
    includeBlogRules: true,
    includeForumRules: true,
    includeLandingPageRules: true,
    includeAIO: true,
    includeGEO: true,
    includeSERP: true,
    includeAuthority: true,
  },
  /** Campaigns and email — acquisition and conversion. */
  marketing: {
    ...BASELINE,
    includeCompetitors: true,
    includeKPIs: true,
    includeSEM: true,
    includeCRO: true,
    includeAuthority: true,
  },
  /** Leads, contacts, customers — pipeline. */
  sales: {
    ...BASELINE,
    includeCompetitors: true,
    includeKPIs: true,
    includeMarketIntel: true,
  },
  /** Settings — configuration help needs no business data. */
  configuration: {
    includeSEOAlgorithms: false,
  },
};

const DEFAULT_SKILLS = SKILL_SETS.overview;

/** Admin page → area. Keys are the path with `/admin` stripped. */
const AREA_BY_ROUTE: Record<string, keyof typeof SKILL_SETS> = {
  "": "overview",
  bookings: "overview",
  "seo/keywords": "search",
  "seo/content": "search",
  analytics: "search",
  blog: "content",
  forum: "content",
  "marketing/landing-pages": "content",
  "marketing/campaigns": "marketing",
  emails: "marketing",
  leads: "sales",
  contacts: "sales",
  customers: "sales",
  settings: "configuration",
};

// ─── Public API ───────────────────────────────────────

/**
 * Resolve the skill set for an admin page.
 *
 * Accepts "/admin/leads", "leads", "/admin/marketing/campaigns" and similar.
 */
export function getAssistantContext(pagePath: string): AssistantContext {
  const normalized = pagePath
    .replace(/^\/admin\/?/, "")
    .replace(/\/$/, "")
    .toLowerCase();

  const area = AREA_BY_ROUTE[normalized] ?? "overview";
  return { area, promptOptions: SKILL_SETS[area] ?? DEFAULT_SKILLS };
}
