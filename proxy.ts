import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth gating temporarily disabled while login is rebuilt.
 * All /admin routes pass through directly.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

