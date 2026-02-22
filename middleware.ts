import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection middleware.
 *
 * Runs on the Edge runtime before every request that matches `config.matcher`.
 * Checks for the presence of the `__session` cookie (set by /api/session after
 * server-side token verification). If the cookie is absent the user is
 * redirected to /login with a `from` param so they land back on the originally
 * requested path after signing in.
 *
 * NOTE: This is an *existence* check, not a cryptographic verification — the
 * cookie is only written after Firebase Admin has already verified the ID token
 * in /api/session, so a missing cookie reliably means "not authenticated".
 * Client-side AdminAuthGate provides an additional layer of Firebase-state
 * verification after hydration.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = request.cookies.get("__session")?.value;
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect all /admin routes (both the catch-all and any nested segments).
  // Excludes API routes, Next.js internals, static assets, and Firebase auth
  // handler paths so they are never accidentally gated.
  matcher: ["/admin/:path*"],
};
