/**
 * Server-side session check for API routes.
 *
 * The session cookie is minted only by /api/session, but cookies live for up
 * to 5 days, so a cookie minted before the admin gate tightened can still be
 * presented. Every route therefore re-checks the gate here rather than
 * trusting the cookie's presence.
 */

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import {
  ADMIN_EMAIL_DOMAIN,
  SESSION_COOKIE_NAME,
} from "@/lib/constants/security";

/**
 * Resolve the caller's UID from the `__session` cookie.
 *
 * Returns null for every failure mode — no cookie, bad signature, expired or
 * revoked session, wrong domain, unverified email. Callers only need to know
 * whether the caller is an authorised admin.
 */
export async function getAdminUidFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session) return null;

    const decoded = await adminAuth.verifySessionCookie(session, true);
    if (!decoded.email?.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) return null;
    if (decoded.email_verified !== true) return null;

    return decoded.uid;
  } catch {
    return null;
  }
}
