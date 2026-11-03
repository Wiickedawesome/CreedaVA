import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb, canUseAdminDb } from "@/lib/firebase-admin";

/**
 * LinkedIn — post to the connected member's feed.
 *
 * Auth: admin session cookie, same gate as /api/ai. Publishing on the member's
 * behalf is a write to a third-party account, so it is never public.
 *
 * The token lives at `integrations/linkedin` (written by the OAuth callback) and
 * is deliberately never returned to the client in any response.
 */

const UGC_POSTS_URL = "https://api.linkedin.com/v2/ugcPosts";
const LINKEDIN_VERSION = "20241101"; // LinkedIn requires a dated version header
const MAX_POST_LENGTH = 3000; // LinkedIn's shareCommentary limit

interface LinkedInIntegration {
  accessToken?: string;
  expiresAt?: { toDate?: () => Date } | Date | null;
  memberUrn?: string | null;
}

async function requireAdmin(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("__session")?.value;
    if (!session) return null;
    const decoded = await adminAuth.verifySessionCookie(session, true);
    if (!decoded.email?.endsWith("@creedava.com")) return null;
    if (decoded.email_verified !== true) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

function expiryOf(value: LinkedInIntegration["expiresAt"]): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  return null;
}

/** Reports whether LinkedIn is connected, without leaking the token. */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUseAdminDb) {
    return NextResponse.json({ error: "Admin SDK unavailable" }, { status: 503 });
  }

  const snap = await adminDb.collection("integrations").doc("linkedin").get();
  if (!snap.exists) {
    return NextResponse.json({ connected: false });
  }

  const data = snap.data() as LinkedInIntegration;
  const expiresAt = expiryOf(data.expiresAt);

  return NextResponse.json({
    connected: Boolean(data.accessToken),
    memberUrn: data.memberUrn ?? null,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    expired: expiresAt ? expiresAt.getTime() <= Date.now() : null,
  });
}

/** Publishes a text post. Body: { text: string } */
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUseAdminDb) {
    return NextResponse.json({ error: "Admin SDK unavailable" }, { status: 503 });
  }

  let text: string;
  try {
    const body = (await request.json()) as { text?: unknown };
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Post text is required" }, { status: 400 });
  }
  if (text.length > MAX_POST_LENGTH) {
    return NextResponse.json(
      { error: `Post is ${text.length} characters; LinkedIn allows ${MAX_POST_LENGTH}.` },
      { status: 400 },
    );
  }

  const snap = await adminDb.collection("integrations").doc("linkedin").get();
  const integration = snap.data() as LinkedInIntegration | undefined;
  const accessToken = integration?.accessToken;
  const memberUrn = integration?.memberUrn;

  if (!accessToken || !memberUrn) {
    return NextResponse.json(
      { error: "LinkedIn is not connected. Connect it from the LinkedIn page first." },
      { status: 409 },
    );
  }

  const expiresAt = expiryOf(integration?.expiresAt);
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "The LinkedIn token has expired. Reconnect to continue." },
      { status: 409 },
    );
  }

  try {
    const res = await fetch(UGC_POSTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": LINKEDIN_VERSION,
      },
      body: JSON.stringify({
        author: memberUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[/api/linkedin/publish] LinkedIn rejected the post:", res.status, detail);

      // 401 = token revoked, 403 = scope missing. Both need a reconnect, and
      // saying so is more useful than echoing LinkedIn's raw payload.
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          {
            error:
              "LinkedIn refused the post. The token may have been revoked, or the app is missing the w_member_social permission.",
            status: res.status,
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "LinkedIn rejected the post.", status: res.status, detail: detail.slice(0, 400) },
        { status: 502 },
      );
    }

    // Success: the new post's id comes back in a header, not the body.
    const postId = res.headers.get("x-restli-id");

    await adminDb.collection("linkedin-posts").add({
      text,
      postId,
      author: memberUrn,
      postedAt: new Date(),
      source: "admin",
    });

    return NextResponse.json({ ok: true, postId });
  } catch (err) {
    console.error("[/api/linkedin/publish] request failed:", err);
    return NextResponse.json({ error: "Could not reach LinkedIn." }, { status: 502 });
  }
}
