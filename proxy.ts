import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side auth gate for admin routes.
 *
 * Checks for a `__session` cookie which is set after successful Firebase
 * sign-in (see app/api/session/route.ts). This prevents:
 *   - Unauthenticated users from loading admin page HTML/JS
 *   - Search engines from indexing admin pages
 *   - Flash of admin content before client-side redirect
 *
 * The actual Firebase Auth token verification still happens client-side
 * in the AdminAuthGate component (app/(admin)/admin/layout.tsx).
 */
export function proxy(request: NextRequest) {
  const session = request.cookies.get("__session");

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
