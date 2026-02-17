import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Session management API for admin auth.
 *
 * POST — Set session cookie after Firebase sign-in
 * DELETE — Clear session cookie on sign-out
 *
 * The cookie stores the Firebase ID token which serves as proof of
 * authentication for the middleware layer. Full token verification
 * happens client-side via Firebase Auth SDK.
 */

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("__session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: "/",
    });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ status: "ok" });
}
