/**
 * Scheduled Cleanup Functions — maintenance tasks to control storage costs.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "./admin";
import { functionOptions } from "./config";

const TS = Timestamp.fromDate;
const BATCH_SIZE = 500;

/**
 * Delete stale docs from a collection older than cutoffMs milliseconds.
 * Returns the count of deleted docs.
 */
async function pruneCollection(
  collectionName: string,
  cutoffMs: number,
  dateField = "createdAt",
): Promise<number> {
  const cutoff = TS(new Date(Date.now() - cutoffMs));
  const snap = await db
    .collection(collectionName)
    .where(dateField, "<", cutoff)
    .get()
    .catch(() => null);
  if (!snap || snap.empty) return 0;
  let deleted = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    snap.docs.slice(i, i + BATCH_SIZE).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += Math.min(BATCH_SIZE, snap.docs.length - i);
  }
  return deleted;
}

const DAY = 24 * 60 * 60 * 1000;

// ─── Analytics TTL Cleanup ──────────────────────────────────
// Deletes `analytics` collection docs older than 90 days to control
// Firestore storage costs. Runs nightly at 2 AM Belize time.

export const cleanupAnalytics = onSchedule(
  {
    schedule: "0 2 * * *",
    ...functionOptions.scheduled,
  },
  async () => {
    const deleted = await pruneCollection("analytics", 90 * DAY);
    console.log(`Analytics cleanup: deleted ${deleted} docs older than 90 days`);
  },
);

// ─── SEO Agent Collection Cleanup ──────────────────────────
// SEO collections grow unbounded — the agent writes to them weekly
// and nothing was ever cleaning them up. Runs weekly on Saturday at 01:00
// (before the brand-mentions skill runs at 02:00).

export const cleanupSeoCollections = onSchedule(
  {
    schedule: "0 1 * * 6", // Saturday 01:00 Belize
    ...functionOptions.scheduled,
  },
  async () => {
    const results = await Promise.all([
      // Backlink prospects — keep 90 days (3 full months of signals)
      pruneCollection("backlink-prospects", 90 * DAY),
      // Keyword gaps — keep 60 days (enough for trend comparison)
      pruneCollection("keyword-gaps", 60 * DAY, "updatedAt"),
      // Agent run logs — keep 180 days for audit trail
      pruneCollection("agent-runs", 180 * DAY, "startedAt"),
      // Report delivery receipts — keep 30 days
      pruneCollection("report-deliveries", 30 * DAY),
    ]);
    const [prospects, gaps, runs, deliveries] = results;
    console.log(
      `SEO cleanup: backlink-prospects=${prospects}, keyword-gaps=${gaps}, agent-runs=${runs}, report-deliveries=${deliveries}`,
    );
  },
);