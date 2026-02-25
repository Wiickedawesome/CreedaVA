/**
 * AI Proxy — Per-user rate limiter
 *
 * Allows 60 Gemini API calls per user per clock-hour.
 * Counts are stored in Firestore `ai-rate-limit/{userId}` and
 * reset atomically at the top of each hour.
 */

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/** Maximum requests allowed per user per hour. */
const REQUESTS_PER_HOUR = 60;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Check (and increment) the rate-limit counter for a user.
 * Uses a Firestore transaction so concurrent requests are safe.
 *
 * @param userId - Firebase Auth UID
 */
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const ref = adminDb.collection("ai-rate-limit").doc(userId);
  const hourStart = Math.floor(Date.now() / 3_600_000) * 3_600_000;

  return adminDb.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const data = doc.data();

    // New hour or first request ever — reset the counter
    if (!data || data.hourStart !== hourStart) {
      t.set(ref, { hourStart, count: 1 });
      return { allowed: true, remaining: REQUESTS_PER_HOUR - 1 };
    }

    if (data.count >= REQUESTS_PER_HOUR) {
      return { allowed: false, remaining: 0 };
    }

    t.update(ref, { count: FieldValue.increment(1) });
    return { allowed: true, remaining: REQUESTS_PER_HOUR - data.count - 1 };
  });
}
