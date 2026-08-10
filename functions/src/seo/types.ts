/**
 * SEO Agent shared types — internal to functions/.
 * Keep parallel to lib/types/seo-agent.ts (which is consumed by the Next.js app).
 */

export type AgentSkill =
  | "onpage-audit"
  | "rank-history"
  | "keyword-gaps"
  | "citation-audit"
  | "serp-analysis"
  | "backlinks-resources"
  | "backlinks-competitor"
  | "brand-mentions"
  | "synthesizer";

export interface SeoAgentConfigDoc {
  enabled: boolean;
  killSwitch: boolean;
  autonomy: {
    content: "draft" | "execute" | "off";
    outreach: "draft" | "execute" | "off";
    metaFixes: "draft" | "execute" | "off";
    internalLinks: "draft" | "execute" | "off";
  };
  maxQueriesPerSkill: number;
  summaryRecipients: string[];
  lastRunAt?: string;
}

export const DEFAULT_AGENT_CONFIG: SeoAgentConfigDoc = {
  enabled: true,
  killSwitch: false,
  autonomy: {
    content: "draft",
    outreach: "draft",
    metaFixes: "execute",
    internalLinks: "execute",
  },
  maxQueriesPerSkill: 80,
  summaryRecipients: ["john@creedava.com", "hello@creedava.com", "contact@creedava.com"],
};

/** Result returned by every skill. */
export interface SkillResult {
  status: "ok" | "partial" | "skipped" | "error";
  findings: number;
  queriesUsed: number;
  summary?: Record<string, unknown>;
  cursor?: { offset: number; nextItem?: string } | null;
  error?: string;
}

export interface SkillContext {
  runId: string;
  skill: AgentSkill;
  /** Hard cap from config — skills must abort cleanly when this is exhausted. */
  queryCap: number;
  config: SeoAgentConfigDoc;
  /** Resume cursor from a previous partial run, if any. */
  cursor?: { offset: number; nextItem?: string } | null;
  /** Increment after each Custom Search call; returns true while under cap. */
  consumeQuery(): boolean;
  /** How many Custom Search queries have been used so far on this run. */
  queriesUsed(): number;
  /** Soft check without consuming. */
  hasQuota(): boolean;
}
