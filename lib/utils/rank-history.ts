/**
 * `rank-history` id and day-key helpers.
 *
 * The agent's `rank-history` skill (`functions/src/seo/rank-history.ts`) and the
 * admin's Search Console button both write this collection. Before this module
 * existed the button instead flattened clicks/impressions/ctr/position onto the
 * `keywords` docs, so the same measurement lived in two shapes and the button's
 * copy silently overwrote the agent's meaning. Both writers now agree on one
 * document shape and one id format.
 *
 * Keep the id format in sync with `rank-history.ts` — the agent slugs with
 * underscores, not hyphens, and re-runs rely on those ids to upsert.
 */

/** Agent-compatible slug: lowercase, non-alphanumerics to underscores. */
function agentSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Stable id for one (keyword, page, day) measurement, matching the agent. */
export function rankHistoryId(dayKey: string, keyword: string, page: string): string {
  return `${dayKey}__${agentSlug(keyword)}__${agentSlug(page)}`.slice(0, 380);
}

/** `YYYY-MM-DD` in UTC, matching the agent's `dayKey`. */
export function rankDayKey(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}
