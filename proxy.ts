import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

/**
 * Server-side auth gate for admin routes.
 *
 * Runs at the Edge (before any page code executes). Checks the `__session`
 * cookie that is set after successful Firebase sign-in via /api/session.
 *
 * Two-layer check:
 *   1. Cookie must be present
 *   2. JWT payload `exp` claim must not be in the past
 *
 * This prevents:
 *   - Unauthenticated users from loading admin page HTML/JS
 *   - Search engines from indexing admin pages
 *   - Flash of admin content before client-side redirect
 *   - Obviously stale cookies from granting access after the 5-day window
 *
 * NOTE: Full cryptographic token verification (signature check + revocation)
 * still happens server-side in the AdminAuthGate component and in
 * /api/session (firebase-admin SDK). This is a fast edge pre-filter only.
 *
 * NOTE: Do NOT rename this file. middleware.ts re-exports from here —
 * keep the implementation in proxy.ts to separate concerns.
 */
export function proxy(request: NextRequest) {
  const session = request.cookies.get("__session");

  if (!session?.value) {
    return redirectToLogin(request);
  }

  // Decode the JWT payload (no crypto verification — just read claims).
  // Both Firebase session cookies and raw ID tokens are standard JWTs.
  try {
    const payload = decodeJwt(session.value);
    const nowSecs = Math.floor(Date.now() / 1000);

    // Reject if the token is expired (exp claim is in the past with a 30s grace period)
    if (payload.exp && payload.exp < nowSecs - 30) {
      return redirectToLogin(request);
    }
  } catch {
    // Token is malformed — treat as unauthenticated
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};

