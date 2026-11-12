/**
 * Shared shape for `rank-history` rows.
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

export interface RankHistoryRow {
  id: string;
  keyword: string;
  page: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  dayKey: string;
  capturedAt?: string;
}

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

export interface LatestMetrics {
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  dayKey: string;
}

/**
 * Collapse the row history into the most recent measurement per keyword.
 *
 * A keyword can rank on several pages, so the best (lowest) position wins —
 * that is the number an operator reads as "where am I ranking for this".
 */
export function latestMetricsByKeyword(
  rows: RankHistoryRow[],
): Map<string, LatestMetrics> {
  const best = new Map<string, LatestMetrics>();

  for (const row of rows) {
    const key = row.keyword.toLowerCase();
    const current = best.get(key);
    if (!current) {
      best.set(key, {
        position: row.position,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        dayKey: row.dayKey,
      });
      continue;
    }

    // Newer day wins outright; same day keeps the better position.
    const isNewer = row.dayKey > current.dayKey;
    const isBetterSameDay = row.dayKey === current.dayKey && row.position < current.position;
    if (isNewer || isBetterSameDay) {
      best.set(key, {
        position: row.position,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        dayKey: row.dayKey,
      });
    }
  }

  return best;
}
