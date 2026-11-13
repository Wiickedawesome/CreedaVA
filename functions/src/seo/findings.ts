/**
 * Findings — the single shape every agent skill writes.
 *
 * One doc per (skill, target, code). A skill run upserts what it detected and
 * resolves what it stopped detecting, so the status of a finding is decided by
 * evidence rather than by someone ticking a box.
 *
 * The client twin of the types below is `lib/types/findings.ts`. They are
 * duplicated because functions deploy from `functions/` alone and cannot import
 * app code; `__tests__/lib/utils/findings.test.ts` pins the id format so the two
 * sides cannot drift.
 */

import { db } from "../admin";

export type FindingScope = "page" | "keyword" | "domain";
export type FindingSeverity = "low" | "medium" | "high";

/**
 * `open`     — detected and nobody has acted.
 * `ignored`  — a human dismissed it; survives every later run.
 * `resolved` — either applied by a human via Fix, or no longer detected.
 */
export type FindingStatus = "open" | "ignored" | "resolved";

/** A fix we know how to apply, expressed as a `page-seo` field write. */
export interface FindingSuggestion {
  field: "title" | "description";
  value: string;
}

export interface FindingInput {
  skill: string;
  scope: FindingScope;
  /** Path for `page`, keyword for `keyword`, hostname for `domain`. */
  target: string;
  code: string;
  severity: FindingSeverity;
  message: string;
  /** The measurement behind the finding, e.g. "Title is 0 chars (target 30–60)". */
  evidence?: string;
  suggested?: FindingSuggestion;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "root"
  );
}

/** Stable id so a re-run upserts the same doc instead of appending a copy. */
export function findingId(scope: FindingScope, target: string, code: string): string {
  return `${scope}__${slug(target)}__${slug(code)}`.slice(0, 380);
}

/**
 * Upsert this run's findings and resolve what it stopped detecting.
 *
 * Resolution is scoped to targets that were actually inspected this run: the
 * on-page crawl is paginated, so a page that was not crawled must keep its
 * findings rather than silently reading as fixed.
 */
export async function syncFindings(
  skill: string,
  inputs: FindingInput[],
): Promise<{ written: number; resolved: number }> {
  if (inputs.length === 0) return { written: 0, resolved: 0 };

  // Whole-skill read: a few hundred docs at most, and it avoids a composite
  // index on (skill, target) just to diff one run.
  const existingSnap = await db.collection("findings").where("skill", "==", skill).get();
  const existing = new Map<string, Record<string, unknown>>();
  existingSnap.forEach((doc) => existing.set(doc.id, doc.data()));

  const now = new Date().toISOString();
  const inspectedTargets = new Set(inputs.map((input) => input.target));
  const liveIds = new Set(inputs.map((input) => findingId(input.scope, input.target, input.code)));

  const batch = db.batch();
  let written = 0;
  let resolved = 0;

  for (const input of inputs) {
    const id = findingId(input.scope, input.target, input.code);
    const prior = existing.get(id);

    const payload: Record<string, unknown> = {
      ...input,
      lastSeenAt: now,
      updatedAt: now,
    };

    if (!prior) {
      payload.status = "open";
      payload.detectedAt = now;
      payload.createdAt = now;
    } else if (prior.status === "ignored") {
      // A dismissal is a human decision; re-detection must not resurrect it.
      payload.status = "ignored";
    } else {
      // Present again after being marked resolved means it regressed.
      payload.status = "open";
    }

    batch.set(db.collection("findings").doc(id), payload, { merge: true });
    written++;
  }

  for (const [id, prior] of existing) {
    if (liveIds.has(id)) continue;
    if (!inspectedTargets.has(prior.target as string)) continue;
    if (prior.status === "resolved") continue;

    batch.set(
      db.collection("findings").doc(id),
      {
        status: "resolved",
        resolvedAt: now,
        resolvedBy: prior.status === "ignored" ? "dismissed" : "not-detected",
        updatedAt: now,
      },
      { merge: true },
    );
    resolved++;
  }

  await batch.commit();
  return { written, resolved };
}
