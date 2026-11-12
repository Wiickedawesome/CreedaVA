import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

/**
 * Session management API for admin auth.
 *
 * POST  — Verify Firebase ID token, then set a secure session cookie.
 * DELETE — Clear the session cookie on sign-out.
 *
 * Token verification happens server-side via Firebase Admin SDK so that:
 *   - expired / revoked tokens are rejected before the cookie is set
 *   - only @creedava.com email accounts can mint a valid session
 *   - the middleware cookie-presence check is backed by a real verified identity
 *
 * The cookie is attached to the returned response rather than written through
 * `cookies()`. Mutating the request-scoped cookie store did not reach the
 * response here: POST answered 200 while sending no `Set-Cookie` at all, so the
 * client believed it had signed in, the proxy found no cookie, and every
 * navigation to /admin bounced straight back to /login. Setting it on the
 * response is explicit and version-independent.
 */

const SESSION_COOKIE = "__session";
const ALLOWED_DOMAIN = "creedava.com";
const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

/** Attach the session cookie to `response` and hand it back. */
function withSessionCookie(
  response: NextResponse,
  value: string,
  maxAge: number,
): NextResponse {
  response.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  return response;
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 400 },
      );
    }

    // Verify the token with Firebase Admin — rejects expired / revoked tokens
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token, /* checkRevoked */ true);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Enforce domain restriction server-side
    const email = decoded.email ?? "";
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return NextResponse.json(
        { error: "Unauthorized domain" },
        { status: 403 },
      );
    }

    // Require a VERIFIED email. Domain alone is not enough: email/password
    // sign-up lets a user type any address they like, so without this an
    // unverified `anything@creedava.com` would mint a full admin session.
    // Google sign-in always sets email_verified, so real admins are unaffected.
    if (decoded.email_verified !== true) {
      return NextResponse.json(
        { error: "Email address is not verified" },
        { status: 403 },
      );
    }

    // Create a short-lived Firebase session cookie instead of storing the raw ID token.
    // Session cookies survive token refresh and respect admin-level revocation.
    let sessionCookie: string;
    try {
      sessionCookie = await adminAuth.createSessionCookie(token, {
        expiresIn: SESSION_MAX_AGE * 1000, // milliseconds
      });
    } catch (err) {
      console.error("[/api/session] session cookie creation failed:", err);
      return NextResponse.json(
        { error: "Session creation failed" },
        { status: 500 },
      );
    }

    return withSessionCookie(
      NextResponse.json({ status: "ok" }),
      sessionCookie,
      SESSION_MAX_AGE,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  return withSessionCookie(NextResponse.json({ status: "ok" }), "", 0);
}

/**
 * Rebuild the CLIENT Firebase session from the httpOnly session cookie.
 *
 * The cookie is the authority for access; the client SDK session is a separate
 * thing that normally survives a reload via IndexedDB. When browser storage is
 * restricted the SDK comes back with no user, and every client read then fails
 * even though the visitor is legitimately signed in. Minting a custom token for
 * the cookie's uid lets the client log back in without another Google prompt.
 *
 * Returns 401 when there is no valid session — that is the signal "genuinely
 * signed out", as opposed to "could not restore".
 */
export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const customToken = await adminAuth.createCustomToken(decoded.uid);
    return NextResponse.json({ customToken });
  } catch {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }
}
