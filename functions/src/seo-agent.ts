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
import type { AgentSkill, SkillContext, SkillResult, SeoAgentConfigDoc } from "./seo/types";

const SKILL_LOCK_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

  // Concurrency lock — skip if same skill is already in-progress recently.
  if (!opts.force) {
    const recent = await db
      .collection("agent-runs")
      .where("skill", "==", opts.skill)
      .where("status", "==", "in-progress")
      .orderBy("startedAt", "desc")
      .limit(1)
      .get()
      .catch(() => null);
    if (recent && !recent.empty) {
      const data = recent.docs[0].data() as { startedAt?: { toMillis?: () => number } | string };
      const startedAtMs =
        typeof data.startedAt === "object" && data.startedAt && typeof data.startedAt.toMillis === "function"
          ? data.startedAt.toMillis()
          : new Date(data.startedAt as string).getTime();
      if (Date.now() - startedAtMs < SKILL_LOCK_WINDOW_MS) {
        return { runId: recent.docs[0].id, status: "locked" };
      }
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
    const snap = await db
      .collection("agent-runs")
      .where("skill", "==", skill)
      .where("status", "==", "partial")
      .orderBy("startedAt", "desc")
      .limit(1)
      .get();
    if (snap.empty) return null;
    const c = snap.docs[0].data().cursor;
    if (c && typeof c === "object" && typeof (c as { offset?: number }).offset === "number") {
      return c as { offset: number; nextItem?: string };
    }
    return null;
  } catch {
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
    default: {
      const exhaustive: never = skill;
      throw new Error(`Unknown SEO skill: ${exhaustive as string}`);
    }
  }
}
