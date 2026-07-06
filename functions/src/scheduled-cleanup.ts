/**
 * Scheduled Cleanup Functions — maintenance tasks to control storage costs.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "./admin";
import { functionOptions } from "./config";

const TS = Timestamp.fromDate;
const BATCH_SIZE = 500;

// ─── Analytics TTL Cleanup ──────────────────────────────────
// Deletes `analytics` collection docs older than 90 days to control
// Firestore storage costs. Runs nightly at 2 AM Belize time.

export const cleanupAnalytics = onSchedule(
  {
    schedule: "0 2 * * *",
    ...functionOptions.scheduled,
  },
  async () => {
    const cutoff = TS(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
    const snap = await db.collection("analytics").where("createdAt", "<", cutoff).get();
    let deleted = 0;
    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      snap.docs.slice(i, i + BATCH_SIZE).forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      deleted += Math.min(BATCH_SIZE, snap.docs.length - i);
    }
    console.log(`Analytics cleanup: deleted ${deleted} docs older than 90 days`);
  },
);