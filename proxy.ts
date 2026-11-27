import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants/security";

/**
 * Fast path only: redirect when no session cookie is present at all.
 *
 * This cannot validate the credential — the Edge runtime has no Admin SDK — so
 * `app/(admin)/layout.tsx` verifies it with `verifySessionCookie` before any
 * admin content is served. Keep this check here to avoid paying that round trip
 * for visitors who are not signed in at all.
 */
export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE_NAME);

  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

