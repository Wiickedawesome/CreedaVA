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

/**
 * Cookie that carries the minted Firebase session.
 *
 * Production uses the `__Host-` prefix. The browser then refuses the cookie
 * unless it is Secure, has no Domain attribute and uses Path=/, which stops a
 * sibling subdomain — or a subdomain takeover — from planting its own `__session`
 * cookie that shadows this one.
 *
 * The prefix is skipped outside production because `__Host-` requires Secure and
 * the app deliberately does not set Secure over plain http in development; the
 * browser would reject the cookie and sign-in would silently never persist.
 */
export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-__session" : "__session";

/** Session lifetime: 5 days, matching the Firebase ID-token refresh window. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

/** Firebase App Check (reCAPTCHA Enterprise) is on unless explicitly disabled. */
export const APP_CHECK_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_APP_CHECK !== "false";
