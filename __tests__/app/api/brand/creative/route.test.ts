import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetAdminUid = vi.fn();
const mockLimit = vi.fn();
const mockBuildCreative = vi.fn();

vi.mock("@/lib/firebase/admin-session", () => ({
  getAdminUidFromSession: () => mockGetAdminUid(),
}));

vi.mock("@/app/api/ai/rate-limit", () => ({
  checkImageGenerationLimit: (uid: string) => mockLimit(uid),
}));

vi.mock("@/lib/brand/creative-pipeline", () => ({
  buildCreative: (...args: unknown[]) => mockBuildCreative(...args),
}));

import { POST } from "@/app/api/brand/creative/route";

function post(body: unknown) {
  return new NextRequest("https://creedava.com/api/brand/creative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const BRIEF =
  "Bilingual 24/7 virtual receptionists for small law firms, answering in under ten seconds.";

const RENDERED = {
  ok: true as const,
  creative: {
    plan: { concept: "Idea", design: {}, caption: "A caption.", hashtags: [] },
    image: {
      dataUrl: "data:image/png;base64,abc",
      width: 1080,
      height: 1080,
      filename: "creedava-feed-1080x1080-1.png",
    },
    photoDropped: false,
  },
};

describe("POST /api/brand/creative", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    mockGetAdminUid.mockResolvedValue("uid-1");
    mockLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    mockBuildCreative.mockResolvedValue(RENDERED);
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("rejects a request with no session", async () => {
    mockGetAdminUid.mockResolvedValue(null);
    const res = await POST(post({ brief: BRIEF, format: "feed" }));
    expect(res.status).toBe(401);
    expect(mockBuildCreative).not.toHaveBeenCalled();
  });

  it("rejects a request over the hourly image budget", async () => {
    mockLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = await POST(post({ brief: BRIEF, format: "feed" }));
    expect(res.status).toBe(429);
    expect(mockBuildCreative).not.toHaveBeenCalled();
  });

  it("rejects a malformed body", async () => {
    const res = await POST(post("not json"));
    expect(res.status).toBe(400);
  });

  it("rejects a brief that is too short", async () => {
    const res = await POST(post({ brief: "hi", format: "feed" }));
    expect(res.status).toBe(400);
  });

  it("rejects a brief past the limit", async () => {
    const res = await POST(post({ brief: "x".repeat(5000), format: "feed" }));
    expect(res.status).toBe(400);
  });

  it("rejects an unknown format", async () => {
    const res = await POST(post({ brief: BRIEF, format: "square" }));
    expect(res.status).toBe(400);
  });

  it("reports a missing API key rather than calling the model", async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await POST(post({ brief: BRIEF, format: "feed" }));
    expect(res.status).toBe(503);
    expect(mockBuildCreative).not.toHaveBeenCalled();
  });

  it("passes the brief and size to the pipeline", async () => {
    await POST(post({ brief: BRIEF, format: "story" }));
    expect(mockBuildCreative).toHaveBeenCalledWith(
      expect.anything(),
      BRIEF,
      "story",
    );
  });

  it("ignores a tone the client still sends", async () => {
    await POST(post({ brief: BRIEF, format: "feed", tone: "playful" }));
    expect(mockBuildCreative).toHaveBeenCalledWith(
      expect.anything(),
      BRIEF,
      "feed",
    );
  });

  it("trims the brief before it reaches the model", async () => {
    await POST(post({ brief: `   ${BRIEF}   `, format: "feed" }));
    expect(mockBuildCreative).toHaveBeenCalledWith(
      expect.anything(),
      BRIEF,
      "feed",
    );
  });

  it("returns the rendered post", async () => {
    const res = await POST(post({ brief: BRIEF, format: "feed" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as typeof RENDERED.creative;
    expect(body.image.dataUrl).toBe("data:image/png;base64,abc");
    expect(body.photoDropped).toBe(false);
  });

  it("maps a planning failure to a 502", async () => {
    mockBuildCreative.mockResolvedValue({ ok: false, reason: "planning-failed" });
    const res = await POST(post({ brief: BRIEF, format: "feed" }));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/design the post/i);
  });

  it("maps a malformed plan to a 502", async () => {
    mockBuildCreative.mockResolvedValue({ ok: false, reason: "malformed" });
    const res = await POST(post({ brief: BRIEF, format: "feed" }));
    expect(res.status).toBe(502);
  });

  it("keeps the words when only the render failed", async () => {
    mockBuildCreative.mockResolvedValue({
      ok: false,
      reason: "render-failed",
      plan: { concept: "Idea", design: {}, caption: "A caption.", hashtags: [] },
    });
    const res = await POST(post({ brief: BRIEF, format: "feed" }));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { plan?: unknown };
    expect(body.plan).toBeDefined();
  });
});
