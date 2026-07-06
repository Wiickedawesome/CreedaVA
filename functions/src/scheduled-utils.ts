/**
 * Shared utilities for scheduled functions.
 */

import { Timestamp } from "firebase-admin/firestore";

/** Shorthand: convert JS Date to Firestore Timestamp (required for where() comparisons). */
export const TS = Timestamp.fromDate;

/**
 * Runs a Firestore count query safely — returns 0 instead of throwing if the
 * query fails, so a single Firestore issue won't abort the entire digest.
 */
export async function safeCount(q: Promise<FirebaseFirestore.QuerySnapshot>): Promise<number> {
  try {
    return (await q).size;
  } catch (err) {
    console.warn("[safeCount] Firestore query failed:", err);
    return 0;
  }
}

/** Empty snapshot fallback used in Promise.all so full snapshot queries also degrade gracefully. */
export const emptySafe = (): FirebaseFirestore.QuerySnapshot =>
  ({ docs: [], size: 0 } as unknown as FirebaseFirestore.QuerySnapshot);