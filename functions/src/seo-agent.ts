/**
 * SEO Agent orchestrator.
 *
 * Owns:
 *   - daily skill rotation (Mon-Sat = harvest, Sun = synthesizer)
 *   - per-run agent-runs document (start/finish, status, queriesUsed, cursor)
 *   - kill switch + concurrency lock (skip if same skill already running <1h)
 *   - manual trigger from /admin/seo "Run now"
 *
 * No Custom Search quota is consumed here — the orchestrator only dispatches.
 */

import { db } from "./admin";
import { getAgentConfig, touchLastRun } from "./seo/config";
import { runOnPageAudit } from "./seo/onpage";
import { runRankHistory } from "./seo/rank-history";
import { runKeywordGaps } from "./seo/keyword-gaps";
import { runCitationAudit } from "./seo/citation";
import {
  runBacklinksResources,
  runBacklinksCompetitor,
  runBrandMentions,
} from "./seo/backlinks";
import { runSynthesizer } from "./seo/synthesizer";
import { runSerpAnalysis } from "./seo/serp-analysis";
import type { AgentSkill, SkillContext, SkillResult, SeoAgentConfigDoc } from "./seo/types";

const SKILL_LOCK_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Read a Firestore timestamp defensively.
 * Stored values are `Timestamp`s, but legacy/mocked rows may be ISO strings.
 */
function startedAtMs(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  const parsed = new Date(value as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Newest document by `startedAt`, or null for an empty result set. */
function newestByStartedAt<T extends { data: () => { startedAt?: unknown } }>(
  docs: T[],
): T | null {
  if (docs.length === 0) return null;
  return docs.reduce((a, b) =>
    startedAtMs(a.data().startedAt) >= startedAtMs(b.data().startedAt) ? a : b,
  );
}

export type RunSource = "scheduled" | "manual";

export interface RunOptions {
  skill: AgentSkill;
  source: RunSource;
  userId?: string;
  /** When true, ignore an existing in-progress lock (admin override). */
  force?: boolean;
}

export interface RunOutcome {
  runId: string;
  status: "ok" | "partial" | "skipped" | "error" | "locked" | "killswitch";
  result?: SkillResult;
  error?: string;
}

export async function runSeoAgent(opts: RunOptions): Promise<RunOutcome> {
  const config = await getAgentConfig();

  // Kill switch.
  if (config.killSwitch || !config.enabled) {
    return { runId: "skip", status: "killswitch" };
  }

  // Concurrency lock — skip if the same skill is already in-progress recently.
  //
  // Deliberately NO orderBy: pairing two equality filters with an orderBy on a
  // third field requires a composite index, and when that index is absent the
  // query throws. The throw used to be swallowed, which silently disabled this
  // lock entirely — measured 2026-11-25: eight duplicate onpage-audit runs that
  // nothing deduplicated. Two equalities use single-field indexes only, so this
  // query cannot fail for a missing index. The newest row is picked in memory.
  if (!opts.force) {
    const active = await db
      .collection("agent-runs")
      .where("skill", "==", opts.skill)
      .where("status", "==", "in-progress")
      .limit(25)
      .get()
      .catch((err) => {
        // Never silently unlock: an invisible lock failure is what let duplicate
        // runs through unnoticed. Automation still proceeds, but it is logged.
        console.error(`[seo-agent] lock check failed for ${opts.skill}:`, err);
        return null;
      });

    const holder = active ? newestByStartedAt(active.docs) : null;
    if (holder && Date.now() - startedAtMs(holder.data().startedAt) < SKILL_LOCK_WINDOW_MS) {
      return { runId: holder.id, status: "locked" };
    }
  }

  // Look up the latest cursor from a previous partial run, if any.
  const previousCursor = await fetchLatestCursor(opts.skill);

  // Create the agent-runs doc.
  const runRef = db.collection("agent-runs").doc();
  const runId = runRef.id;
  await runRef.set({
    skill: opts.skill,
    source: opts.source,
    triggeredBy: opts.userId ?? null,
    status: "in-progress",
    queriesUsed: 0,
    cursor: previousCursor ?? null,
    startedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const ctx = buildContext(runId, opts.skill, config, previousCursor ?? null);

  let result: SkillResult;
  try {
    result = await dispatch(opts.skill, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await runRef.set(
      {
        status: "error",
        error: message,
        queriesUsed: ctx.queriesUsed(),
        finishedAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true },
    );
    return { runId, status: "error", error: message };
  }

  await runRef.set(
    {
      status: result.status === "error" ? "error" : result.status === "partial" ? "partial" : "completed",
      queriesUsed: result.queriesUsed,
      cursor: result.cursor ?? null,
      summary: result.summary ?? null,
      findings: result.findings,
      error: result.error ?? null,
      finishedAt: new Date(),
      updatedAt: new Date(),
    },
    { merge: true },
  );

  await touchLastRun();

  return { runId, status: result.status, result };
}

/** Look up cursor from the most recent partial run for this skill. */
async function fetchLatestCursor(
  skill: AgentSkill,
): Promise<{ offset: number; nextItem?: string } | null> {
  try {
    // Same index constraint as the lock above: no orderBy, newest chosen in
    // memory. This catch used to swallow the throw, so the cursor was ALWAYS
    // null and a chunked skill like backlinks-resources restarted at offset 0
    // on every run — burning its full query budget and never advancing.
    const snap = await db
      .collection("agent-runs")
      .where("skill", "==", skill)
      .where("status", "==", "partial")
      .limit(25)
      .get();

    const latest = newestByStartedAt(snap.docs);
    if (!latest) return null;

    const c = latest.data().cursor;
    if (c && typeof c === "object" && typeof (c as { offset?: number }).offset === "number") {
      return c as { offset: number; nextItem?: string };
    }
    return null;
  } catch (err) {
    console.warn(`[seo-agent] cursor lookup failed for ${skill}:`, err);
    return null;
  }
}

function buildContext(
  runId: string,
  skill: AgentSkill,
  config: SeoAgentConfigDoc,
  cursor: { offset: number; nextItem?: string } | null,
): SkillContext {
  const cap = config.maxQueriesPerSkill;
  let used = 0;
  return {
    runId,
    skill,
    queryCap: cap,
    config,
    cursor,
    consumeQuery() {
      if (used >= cap) return false;
      used++;
      return true;
    },
    queriesUsed() {
      return used;
    },
    hasQuota() {
      return used < cap;
    },
  };
}

async function dispatch(skill: AgentSkill, ctx: SkillContext): Promise<SkillResult> {
  switch (skill) {
    case "onpage-audit":
      return runOnPageAudit(ctx);
    case "rank-history":
      return runRankHistory(ctx);
    case "keyword-gaps":
      return runKeywordGaps(ctx);
    case "citation-audit":
      return runCitationAudit(ctx);
    case "backlinks-resources":
      return runBacklinksResources(ctx);
    case "backlinks-competitor":
      return runBacklinksCompetitor(ctx);
    case "brand-mentions":
      return runBrandMentions(ctx);
    case "synthesizer":
      return runSynthesizer(ctx);
    case "serp-analysis":
      return runSerpAnalysis(ctx);
    default: {
      const exhaustive: never = skill;
      throw new Error(`Unknown SEO skill: ${exhaustive as string}`);
    }
  }
}
