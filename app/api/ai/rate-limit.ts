/**
 * AI Proxy — per-user rate limiters
 *
 * Counts live in Firestore `ai-rate-limit/{key}` and reset at the top of each
 * window. Every limiter is a fixed-window counter holding the window start and
 * a count, so concurrent requests are safe inside a transaction.
 *
 * Three budgets, because they cost wildly different amounts:
 *   - text calls are cheap and frequent          → 60 / hour
 *   - grounded search is metered upstream        → 20 / day
 *   - image generation is ~$0.03 per image       → 10 generations / hour
 *
 * The image limit exists so a stuck button or a double-click cannot run up a
 * bill; it is a safety valve, not a product decision.
 */

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/** Maximum text/chat requests allowed per user per hour. */
const REQUESTS_PER_HOUR = 60;

/** Maximum grounded (Google Search) requests per user per day. */
const GROUNDED_SEARCHES_PER_DAY = 20;

/**
 * Maximum image generations per user per hour. One generation produces
 * several candidates, so this is a stronger limit than the number suggests.
 */
const IMAGE_GENERATIONS_PER_HOUR = 10;

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/** Take one unit from a fixed-window counter, creating or resetting it. */
async function consumeWindow(
  docId: string,
  windowMs: number,
  limit: number,
): Promise<RateLimitResult> {
  const ref = adminDb.collection("ai-rate-limit").doc(docId);
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;

  return adminDb.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const data = doc.data();

    // New window or first request ever — reset the counter.
    if (!data || data.windowStart !== windowStart) {
      t.set(ref, { windowStart, count: 1 });
      return { allowed: true, remaining: limit - 1 };
    }

    if (data.count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    t.update(ref, { count: FieldValue.increment(1) });
    return { allowed: true, remaining: limit - data.count - 1 };
  });
}

/**
 * Check (and increment) the hourly text-call counter for a user.
 *
 * @param userId - Firebase Auth UID
 */
export function checkRateLimit(userId: string): Promise<RateLimitResult> {
  return consumeWindow(userId, HOUR_MS, REQUESTS_PER_HOUR);
}

/**
 * Check (and increment) the daily grounded search counter for a user.
 * Uses a separate counter: `ai-rate-limit/{userId}_grounded`.
 */
export function checkGroundedSearchLimit(
  userId: string,
): Promise<RateLimitResult> {
  return consumeWindow(`${userId}_grounded`, DAY_MS, GROUNDED_SEARCHES_PER_DAY);
}

/**
 * Check (and increment) the hourly image-generation counter for a user.
 * Uses a separate counter: `ai-rate-limit/{userId}_image`.
 */
export function checkImageGenerationLimit(
  userId: string,
): Promise<RateLimitResult> {
  return consumeWindow(`${userId}_image`, HOUR_MS, IMAGE_GENERATIONS_PER_HOUR);
}
