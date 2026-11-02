import type { NextRequest } from "next/server";

/**
 * Best-effort, in-process sliding-window rate limiter for public API routes.
 *
 * Scope and honest limits:
 *   - State lives in the Node instance, so the real ceiling is
 *     (limit x live instances). App Hosting scales horizontally, so treat this
 *     as abuse friction, not as a guarantee.
 *   - Use it to stop trivial floods (form spam, email bombs, cost abuse) from a
 *     single client. Anything stronger needs shared state (Firestore/Redis) or
 *     an edge control such as Cloud Armor.
 */
export interface RateLimitOptions {
  /** Length of the sliding window in milliseconds. */
  windowMs: number;
  /** Requests allowed per window, per client. */
  max: number;
  /** Drop all state past this many tracked clients, to bound memory. */
  maxTracked?: number;
}

export interface RateLimiter {
  /** Records this request and reports whether the client is now over budget. */
  isLimited(req: NextRequest): boolean;
  /** Seconds a throttled client should wait, for the `Retry-After` header. */
  retryAfterSeconds: number;
}

/**
 * Behind Firebase App Hosting every request carries `x-forwarded-for`; the
 * first entry is the client. Requests without the header share an "unknown"
 * bucket, which is intentional: they are not attributable, so they collapse
 * into one conservative bucket rather than getting unlimited attempts.
 */
function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function createRateLimiter({
  windowMs,
  max,
  maxTracked = 10_000,
}: RateLimitOptions): RateLimiter {
  const requestLog = new Map<string, number[]>();

  return {
    retryAfterSeconds: Math.ceil(windowMs / 1000),

    isLimited(req: NextRequest): boolean {
      const ip = clientIp(req);
      const now = Date.now();
      const recent = (requestLog.get(ip) ?? []).filter(
        (timestamp) => now - timestamp < windowMs,
      );

      if (recent.length >= max) {
        requestLog.set(ip, recent);
        return true;
      }

      recent.push(now);
      requestLog.set(ip, recent);

      // Bound memory if the instance sees many distinct clients.
      if (requestLog.size > maxTracked) requestLog.clear();

      return false;
    },
  };
}
