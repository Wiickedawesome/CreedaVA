/**
 * Findings — the client shape of what every agent skill writes.
 *
 * Server twin: `functions/src/seo/findings.ts`. The two are separate modules
 * because functions deploy from `functions/` alone and cannot import app code.
 * The id format is pinned by `__tests__/lib/utils/findings.test.ts`; keep both
 * copies in step.
 */

export type FindingScope = "page" | "keyword" | "domain";
export type FindingSeverity = "low" | "medium" | "high";

/**
 * `open`     — detected and nobody has acted.
 * `ignored`  — a human dismissed it; survives every later run.
 * `resolved` — applied via Fix, or no longer detected by a later run.
 */
export type FindingStatus = "open" | "ignored" | "resolved";

export type FindingSkill =
  | "onpage-audit"
  | "citation-audit"
  | "keyword-gaps"
  | "serp-analysis"
  | "backlinks-resources"
  | "backlinks-competitor"
  | "backlinks-unlinked"
  | "rank-drop";

export interface FindingSuggestion {
  field: "title" | "description";
  value: string;
}

export interface Finding extends FirestoreFindingFields {
  id: string;
}

/** The stored fields, without the document id. */
export interface FirestoreFindingFields {
  skill: FindingSkill | string;
  scope: FindingScope;
  /** Path for `page`, keyword for `keyword`, hostname for `domain`. */
  target: string;
  code: string;
  severity: FindingSeverity;
  message: string;
  /** The measurement behind the finding, e.g. "Title is 0 chars (target 30–60)". */
  evidence?: string;
  suggested?: FindingSuggestion;
  status: FindingStatus;
  detectedAt: string;
  lastSeenAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export const SKILL_LABELS: Record<string, string> = {
  "onpage-audit": "On-page audit",
  "citation-audit": "Citation audit",
  "keyword-gaps": "Keyword gaps",
  "serp-analysis": "SERP analysis",
  "backlinks-resources": "Backlink prospects",
  "backlinks-competitor": "Competitor mentions",
  "backlinks-unlinked": "Unlinked mentions",
  "rank-drop": "Rank drop",
};

export function skillLabel(skill: string): string {
  return SKILL_LABELS[skill] ?? skill;
}

/** Findings a human can still act on. `resolved` and `ignored` are history. */
export function isActionable(finding: Finding): boolean {
  return finding.status === "open";
}

/** Sort worst first, then most recently seen — the order an operator wants. */
const SEVERITY_RANK: Record<FindingSeverity, number> = { high: 0, medium: 1, low: 2 };

export function byUrgency(a: Finding, b: Finding): number {
  const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (bySeverity !== 0) return bySeverity;
  return (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? "");
}

/** Count open findings per target, for badges in list views. */
export function openCountByTarget(findings: Finding[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    if (!isActionable(finding)) continue;
    counts.set(finding.target, (counts.get(finding.target) ?? 0) + 1);
  }
  return counts;
}

/**
 * Join key for a finding's target.
 *
 * A kwyword or path is the same thing regardless of case, and Search Console
 * is inconsistent about it — joining on the raw string would silently miss.
 */
export function targetKey(target: string): string {
  return target.trim().toLowerCase();
}

/** Open first, then dismissed, then resolved — the order an operator reads them. */
const STATUS_RANK: Record<FindingStatus, number> = { open: 0, ignored: 1, resolved: 2 };

/**
 * Group findings by their target so a list view can annotate each row.
 *
 * Lets Gaps and Rankings own their own data while the finding carries only the
 * decision, instead of duplicating the row into a second collection.
 */
export function mapFindingsByTarget(
  findings: Finding[],
  scope: FindingScope,
): Map<string, Finding[]> {
  const grouped = new Map<string, Finding[]>();
  for (const finding of findings) {
    if (finding.scope !== scope) continue;
    const key = targetKey(finding.target);
    const list = grouped.get(key);
    if (list) list.push(finding);
    else grouped.set(key, [finding]);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
  }
  return grouped;
}
