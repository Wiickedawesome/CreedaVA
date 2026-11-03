import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

/**
 * LinkedIn OAuth — step 1: send the browser to LinkedIn's consent screen.
 *
 * Only the admin can start this, because whatever token comes back lets us post
 * as the authorized member. It is gated on the same Firebase session cookie the
 * rest of /admin uses, so an anonymous hit does nothing.
 *
 * The `state` value is generated here and stored in a short-lived, httpOnly
 * cookie. The callback refuses to continue unless the state LinkedIn returns
 * matches it, which is the CSRF check LinkedIn's docs require.
 */

const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";

/** Scopes we asked for in the app config. Keep in sync with the Developer Portal. */
const SCOPES = ["openid", "profile", "email", "w_member_social"];

const STATE_COOKIE = "li_oauth_state";
const STATE_MAX_AGE = 60 * 10; // 10 minutes — the auth code itself expires in 30

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: "LinkedIn is not configured",
        missing: [
          ...(clientId ? [] : ["LINKEDIN_CLIENT_ID"]),
          ...(redirectUri ? [] : ["LINKEDIN_REDIRECT_URI"]),
        ],
      },
      { status: 500 },
    );
  }

  const state = randomBytes(16).toString("hex");

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", SCOPES.join(" "));

  const response = NextResponse.redirect(url.toString());
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" still sends the cookie on LinkedIn's top-level redirect back to us,
    // but not on cross-site subrequests.
    sameSite: "lax",
    maxAge: STATE_MAX_AGE,
    path: "/api/linkedin",
  });

  return response;
}
