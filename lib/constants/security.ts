/**
 * Security facts shared by the server gate and the admin dashboard.
 *
 * These were duplicated as local constants in `/api/session` and
 * `lib/firebase/admin-session.ts`. A settings screen that describes the gate
 * must read the same values the gate enforces, otherwise the description
 * drifts; this module is importable from client components (no server-only
 * imports), so both sides can use it.
 */

/** Only accounts on this domain can sign in to the admin dashboard. */
export const ADMIN_EMAIL_DOMAIN = "creedava.com";

/** Cookie that carries the minted Firebase session. */
export const SESSION_COOKIE_NAME = "__session";

/** Session lifetime: 5 days, matching the Firebase ID-token refresh window. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

/** Firebase App Check (reCAPTCHA Enterprise) is on unless explicitly disabled. */
export const APP_CHECK_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_APP_CHECK !== "false";
