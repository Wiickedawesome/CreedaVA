import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAdminUid = vi.fn();
const mockCheckLimit = vi.fn();
const mockGenerateContent = vi.fn();

vi.mock("@/lib/firebase/admin-session", () => ({
  getAdminUidFromSession: () => mockGetAdminUid(),
}));

vi.mock("@/app/api/ai/rate-limit", () => ({
  checkImageGenerationLimit: (uid: string) => mockCheckLimit(uid),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: (...args: unknown[]) => mockGenerateContent(...args) };
  },
}));

import { POST } from "@/app/api/ai/image/route";

function request(body: unknown) {
  return new Request("https://creedava.com/api/ai/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

const IMAGE_PART = {
  inlineData: { mimeType: "image/png", data: "aGVsbG8=" },
};

/**
 * One mock serves three different calls, so they are told apart by shape: an
 * image draw is the only one carrying `config.responseModalities`. The others
 * are text-only (scene brief, then screening).
 */
function primeGenerator() {
  mockGenerateContent.mockImplementation(
    async (args: { config?: { responseModalities?: string[] } }) => {
      if (args?.config?.responseModalities) {
        return {
          candidates: [{ content: { parts: [IMAGE_PART] } }],
        };
      }
      // Valid for both: long enough for a scene brief, and `passes: true` for
      // the screener.
      return { text: JSON.stringify({ passes: true, tells: [] }) };
    },
  );
}

describe("POST /api/ai/image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminUid.mockResolvedValue("uid-1");
    mockCheckLimit.mockResolvedValue({ allowed: true });
    primeGenerator();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("rejects a request with neither a title nor source material", async () => {
    const res = await POST(request({}));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining("source material"),
    });
  });

  it("accepts free-form material with no title, for the image studio", async () => {
    // The studio has no title field — people paste a draft or a brief. Requiring
    // a title there made the whole page unusable.
    const res = await POST(
      request({ material: "A quiet morning desk with a notebook and a mug." }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.candidates)).toBe(true);
  });

  it("rejects material beyond the cap instead of silently truncating it", async () => {
    const res = await POST(request({ material: "x".repeat(4001) }));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining("too long"),
    });
  });

  it("still accepts the original title and excerpt contract", async () => {
    const res = await POST(
      request({ title: "A post", excerpt: "A summary of the post." }),
    );

    expect(res.status).toBe(200);
  });

  it("refuses an unauthenticated caller", async () => {
    mockGetAdminUid.mockResolvedValue(null);

    const res = await POST(request({ material: "anything" }));

    expect(res.status).toBe(401);
  });

  it("refuses once the hourly image budget is spent", async () => {
    mockCheckLimit.mockResolvedValue({ allowed: false });

    const res = await POST(request({ material: "anything" }));

    expect(res.status).toBe(429);
  });
});
