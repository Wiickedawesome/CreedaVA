import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockVerifyIdToken = vi.fn();
const mockCreateSessionCookie = vi.fn();
const mockVerifySessionCookie = vi.fn();
const mockCreateCustomToken = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: {
    verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args),
    createSessionCookie: (...args: unknown[]) => mockCreateSessionCookie(...args),
    verifySessionCookie: (...args: unknown[]) => mockVerifySessionCookie(...args),
    createCustomToken: (...args: unknown[]) => mockCreateCustomToken(...args),
  },
}));

import { POST, DELETE, GET } from "@/app/api/session/route";

function getRequest(sessionCookie?: string) {
  return new NextRequest("https://creedava.com/api/session", {
    headers: sessionCookie ? { cookie: `__session=${sessionCookie}` } : {},
  });
}

function postRequest(token = "id-token") {
  return new Request("https://creedava.com/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

const VERIFIED_ADMIN = {
  uid: "uid-1",
  email: "hello@creedava.com",
  email_verified: true,
};

describe("POST /api/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyIdToken.mockResolvedValue(VERIFIED_ADMIN);
    mockCreateSessionCookie.mockResolvedValue("session-cookie-value");
  });

  it("attaches the session cookie to the response", async () => {
    // Regression: the handler answered 200 while sending no Set-Cookie at all,
    // because the cookie was written through `cookies()` and never reached the
    // response. The client believed it had signed in, the proxy saw no cookie,
    // and every visit to /admin redirected back to /login — in every browser.
    // A status-code-only assertion would not have caught this.
    const res = await POST(postRequest());

    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("__session=session-cookie-value");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("SameSite=lax");
  });

  it("refuses a valid token from a domain that is not allowed", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "uid-2",
      email: "someone@gmail.com",
      email_verified: true,
    });

    const res = await POST(postRequest());

    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(mockCreateSessionCookie).not.toHaveBeenCalled();
  });

  it("refuses an unverified address on the allowed domain", async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: "uid-3",
      email: "info@creedava.com",
      email_verified: false,
    });

    const res = await POST(postRequest());

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Email address is not verified" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a token Firebase will not verify", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("expired"));

    const res = await POST(postRequest());

    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a request with no token", async () => {
    const res = await POST(postRequest(""));

    expect(res.status).toBe(400);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("DELETE /api/session", () => {
  it("clears the session cookie on the response", async () => {
    const res = await DELETE();

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("__session=");
    expect(setCookie).toContain("Max-Age=0");
  });
});

describe("GET /api/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifySessionCookie.mockResolvedValue({ uid: "uid-1" });
    mockCreateCustomToken.mockResolvedValue("custom-token");
  });

  it("returns a custom token for a valid session", async () => {
    const res = await GET(getRequest("good-cookie"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ customToken: "custom-token" });
  });

  it("reports a missing session as no_session", async () => {
    const res = await GET(getRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "no_session" });
  });

  it("reports an unverifiable cookie as invalid_session", async () => {
    mockVerifySessionCookie.mockRejectedValue(new Error("expired"));

    const res = await GET(getRequest("bad-cookie"));

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "invalid_session" });
  });

  it("distinguishes a valid session that could not be restored", async () => {
    // Regression: this case was reported as 401, identical to "signed out".
    // The admin guard then treated a legitimate visitor as anonymous and
    // replaced the URL with /login, sending them back to the sign-in screen
    // while they still held a valid session cookie. It is a server-side
    // failure, not a sign-out, so it must not look like one.
    mockCreateCustomToken.mockRejectedValue(new Error("signBlob denied"));

    const res = await GET(getRequest("good-cookie"));

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: "restore_unavailable" });
  });
});
