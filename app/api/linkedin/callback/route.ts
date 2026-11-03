import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";

/**
 * LinkedIn OAuth — step 2: LinkedIn redirects the browser back here.
 *
 * Exchanges the authorization code for an access token, records who the token
 * belongs to, and stores it at `integrations/linkedin` so the rest of the app
 * can post with it. The Firestore shape matches the other integrations
 * (google-ads, google-calendar): credentials live on the document itself.
 *
 * The token is never rendered in the response body. What the page shows is the
 * token's owner, scopes and expiry, which is enough to prove the grant worked
 * without putting a credential on screen or in a log.
 */

const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

const STATE_COOKIE = "li_oauth_state";

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface UserInfo {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function page(title: string, rows: [string, string][], ok: boolean): NextResponse {
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><th style="text-align:left;padding:6px 16px 6px 0;color:#4b5563;font-weight:600">${escapeHtml(
          label,
        )}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<meta name="robots" content="noindex"></head>
<body style="font-family:system-ui,sans-serif;max-width:640px;margin:64px auto;padding:0 24px;line-height:1.5">
<div style="font-size:40px">${ok ? "✅" : "❌"}</div>
<h1 style="font-size:22px;margin:8px 0 20px">${escapeHtml(title)}</h1>
<table style="border-collapse:collapse;font-size:14px">${body}</table>
<p style="margin-top:28px;font-size:13px;color:#6b7280">
  You can close this tab. Manage the connection from the LinkedIn page in the admin dashboard.
</p>
</body></html>`;

  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // The member can decline at the consent screen; LinkedIn sends us the reason.
  if (oauthError) {
    return page(
      "LinkedIn authorization was not completed",
      [
        ["Error", oauthError],
        ["Detail", errorDescription ?? "—"],
      ],
      false,
    );
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;

  // CSRF check. A mismatch means the callback did not originate from a flow we
  // started, so the code is not ours to exchange.
  if (!returnedState || !expectedState || returnedState !== expectedState) {
    return page(
      "Authorization rejected",
      [
        ["Reason", "The state value did not match the one we issued."],
        ["What to do", "Start the connection again from the admin dashboard."],
      ],
      false,
    );
  }

  if (!code) {
    return page("Authorization rejected", [["Reason", "No authorization code was returned."]], false);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return page(
      "LinkedIn is not configured",
      [
        [
          "Missing",
          [
            ...(clientId ? [] : ["LINKEDIN_CLIENT_ID"]),
            ...(clientSecret ? [] : ["LINKEDIN_CLIENT_SECRET"]),
            ...(redirectUri ? [] : ["LINKEDIN_REDIRECT_URI"]),
          ].join(", "),
        ],
      ],
      false,
    );
  }

  // ── Exchange the code for a token ──────────────────
  let token: TokenResponse;
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });
    token = (await res.json()) as TokenResponse;

    if (!res.ok || !token.access_token) {
      return page(
        "Token exchange failed",
        [
          ["HTTP", String(res.status)],
          ["Error", token.error ?? "unknown"],
          ["Detail", token.error_description ?? "—"],
        ],
        false,
      );
    }
  } catch (err) {
    return page("Token exchange failed", [["Error", String(err)]], false);
  }

  const accessToken = token.access_token;
  const expiresIn = token.expires_in ?? 0;
  const scope = token.scope ?? "";
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // ── Find out who we are now able to post as ────────
  let profile: UserInfo = {};
  try {
    const res = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) profile = (await res.json()) as UserInfo;
  } catch {
    // Non-fatal: the token is still valid even if userinfo hiccups.
  }

  // ── Persist for the app to use ─────────────────────
  let stored = false;
  let storeError = "";
  if (canUseAdminDb) {
    try {
      await adminDb
        .collection("integrations")
        .doc("linkedin")
        .set(
          {
            provider: "linkedin",
            status: "connected",
            accessToken,
            scope,
            expiresAt,
            memberUrn: profile.sub ? `urn:li:person:${profile.sub}` : null,
            memberName: profile.name ?? null,
            memberEmail: profile.email ?? null,
            connectedAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true },
        );
      stored = true;
    } catch (err) {
      storeError = String(err);
    }
  } else {
    storeError = "Admin SDK unavailable in this environment (missing service account).";
  }

  const rows: [string, string][] = [
    ["Authorized as", profile.name ?? "(name not returned)"],
    ["Email", profile.email ?? "(not returned)"],
    ["Member ID", profile.sub ?? "(not returned)"],
    ["Granted scopes", scope || "(none reported)"],
    ["Token expires", expiresAt.toISOString()],
    ["Saved to Firestore", stored ? "yes — integrations/linkedin" : `no — ${storeError}`],
  ];

  if (!scope.split(" ").includes("w_member_social")) {
    rows.push([
      "Warning",
      "w_member_social was NOT granted. Add the 'Share on LinkedIn' product, then reconnect.",
    ]);
  }

  return page("LinkedIn connected", rows, true);
}
