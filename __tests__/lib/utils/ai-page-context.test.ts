import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Firestore before importing SUT
vi.mock("@/lib/firebase/config", () => ({ app: {}, auth: {}, db: {} }));
vi.mock("@/lib/firebase/firestore", () => ({
  fetchAll: vi.fn().mockResolvedValue([]),
}));
vi.mock("firebase/firestore", () => ({
  where: vi.fn(),
  orderBy: vi.fn(),
}));
vi.mock("@/lib/utils/ai-system-prompt", () => ({
  getPageContext: vi.fn((p: string) => `Context for ${p}`),
}));
vi.mock("@/lib/utils/ai-data-context", () => ({
  buildFullContext: vi.fn(() => "full-context"),
  buildSalesContext: vi.fn(() => "sales-context"),
  buildSEOContext: vi.fn(() => "seo-context"),
  buildMarketingContext: vi.fn(() => "marketing-context"),
  buildOperationsContext: vi.fn(() => "ops-context"),
  buildKeywordContext: vi.fn(() => "keyword-context"),
  buildLandingPageContext: vi.fn(() => "lp-context"),
  buildBookingContext: vi.fn(() => "booking-context"),
  buildBlogContext: vi.fn(() => "blog-context"),
  buildForumContext: vi.fn(() => "forum-context"),
  buildCustomerLTVContext: vi.fn(() => "ltv-context"),
  buildLeadResponseContext: vi.fn(() => "lead-context"),
  buildEmailEngagementContext: vi.fn(() => "email-context"),
}));

import {
  getPageConfig,
  loadPageAwareContext,
  loadSlimContext,
} from "@/lib/utils/ai-page-context";
import { fetchAll } from "@/lib/firebase/firestore";

const mockFetchAll = fetchAll as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── getPageConfig ─────────────────────────────────

describe("getPageConfig", () => {
  it("returns correct config for known pages", () => {
    const config = getPageConfig("/admin/leads");
    expect(config.section).toBe("Leads AI");
    expect(config.collections).toContain("leads");
  });

  it("normalizes path — strips /admin/ prefix", () => {
    const a = getPageConfig("/admin/blog");
    const b = getPageConfig("blog");
    expect(a.section).toBe(b.section);
    expect(a.collections).toEqual(b.collections);
  });

  it("handles nested routes like marketing/campaigns", () => {
    const config = getPageConfig("/admin/marketing/campaigns");
    expect(config.section).toBe("Campaigns AI");
    expect(config.collections).toContain("campaigns");
  });

  it("handles nested routes like seo/keywords", () => {
    const config = getPageConfig("/admin/seo/keywords");
    expect(config.section).toBe("SEO Keywords AI");
    expect(config.collections).toContain("keywords");
  });

  it("returns default config for unknown pages", () => {
    const config = getPageConfig("/admin/unknown-page");
    expect(config.section).toBe("CreedaVA AI");
    expect(config.collections.length).toBeGreaterThanOrEqual(1);
  });

  it("strips trailing slashes", () => {
    const config = getPageConfig("/admin/forum/");
    expect(config.section).toBe("Forum AI");
  });

  it("is case-insensitive", () => {
    const config = getPageConfig("/admin/BLOG");
    expect(config.section).toBe("Blog AI");
  });

  it("maps all expected admin pages", () => {
    const expectedPages = [
      "analytics", "blog", "bookings", "contacts", "customers",
      "emails", "forum", "leads", "marketing/campaigns",
      "marketing/landing-pages", "projects",
      "seo/content", "seo/keywords", "tasks",
    ];
    for (const page of expectedPages) {
      const config = getPageConfig(page);
      expect(config.section).not.toBe("CreedaVA AI");
    }
  });
});

// ─── loadPageAwareContext ─────────────────────────────

describe("loadPageAwareContext", () => {
  it("returns the correct shape", async () => {
    const result = await loadPageAwareContext("/admin/leads");
    expect(result).toHaveProperty("dataContext");
    expect(result).toHaveProperty("pageContext");
    expect(result).toHaveProperty("section");
    expect(result).toHaveProperty("loadedCollections");
    expect(result).toHaveProperty("rawData");
  });

  it("fetches only relevant collections", async () => {
    await loadPageAwareContext("/admin/forum");
    // Forum only needs forumThreads
    expect(mockFetchAll).toHaveBeenCalledTimes(1);
  });

  it("fetches multiple collections in parallel", async () => {
    await loadPageAwareContext("/admin/leads");
    // leads config needs: leads, contacts, bookings
    expect(mockFetchAll).toHaveBeenCalledTimes(3);
  });

  it("returns section label matching page config", async () => {
    const result = await loadPageAwareContext("/admin/blog");
    expect(result.section).toBe("Blog AI");
  });

  it("includes loadedCollections list", async () => {
    const result = await loadPageAwareContext("/admin/blog");
    expect(result.loadedCollections).toContain("blog");
  });

  it("handles fetchAll errors gracefully", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mockFetchAll.mockRejectedValueOnce(new Error("Firestore error"));
    const result = await loadPageAwareContext("/admin/forum");
    expect(result.rawData).toBeDefined();
    // Should not throw
    expect(warnSpy).toHaveBeenCalledWith(
      "[AI Context] Failed to fetch forumThreads:",
      expect.any(Error),
    );
  });

  it("returns default context for unknown page", async () => {
    const result = await loadPageAwareContext("/admin/xyz");
    expect(result.section).toBe("CreedaVA AI");
    // Default config has a minimal set of collections (leads, tasks)
    expect(result.loadedCollections.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── loadSlimContext ─────────────────────────────────

describe("loadSlimContext", () => {
  it("fetches only specified collections", async () => {
    await loadSlimContext(["leads", "customers"]);
    expect(mockFetchAll).toHaveBeenCalledTimes(2);
  });

  it("returns proper AllCollections shape", async () => {
    mockFetchAll.mockResolvedValueOnce([{ id: "1" }]);
    mockFetchAll.mockResolvedValueOnce([]);
    const result = await loadSlimContext(["leads", "tasks"]);
    expect(result).toBeDefined();
  });

  it("handles errors silently", async () => {
    mockFetchAll.mockRejectedValueOnce(new Error("fail"));
    const result = await loadSlimContext(["leads"]);
    expect(result).toBeDefined();
  });

  it("handles empty collections list", async () => {
    const result = await loadSlimContext([]);
    expect(result).toBeDefined();
    expect(mockFetchAll).not.toHaveBeenCalled();
  });
});
