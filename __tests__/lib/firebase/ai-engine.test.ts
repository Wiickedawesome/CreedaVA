import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies before importing SUT
vi.mock("@/lib/firebase/config", () => ({ app: {}, auth: {}, db: {} }));
vi.mock("@/lib/firebase/firestore", () => ({
  fetchAll: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue("new-doc-id"),
  createWithId: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("firebase/firestore", () => ({
  where: vi.fn(),
  orderBy: vi.fn(),
}));
vi.mock("@/lib/firebase/ai", () => ({
  generateText: vi.fn().mockResolvedValue('{"result": "ok"}'),
}));
vi.mock("@/lib/firebase/cloud-functions", () => ({
  cloudWebSearch: vi.fn().mockResolvedValue({ success: true, results: [] }),
}));
vi.mock("@/lib/utils/ai-system-prompt", () => ({
  buildTrainedPrompt: vi.fn(() => ({
    systemInstruction: "sys",
    userContent: "user",
  })),
  buildReportPrompt: vi.fn(() => ({
    systemInstruction: "report-sys",
    userContent: "report-user",
  })),
  getPageContext: vi.fn(() => "page-ctx"),
  DAILY_STATUS_PROMPT: "daily prompt",
}));
vi.mock("@/lib/utils/ai-page-context", () => ({
  loadPageAwareContext: vi.fn().mockResolvedValue({
    dataContext: "data-ctx",
    pageContext: "page-ctx",
    section: "Test AI",
    loadedCollections: ["leads"],
    rawData: { leads: [] },
  }),
}));

import {
  analyzeAndRespond,
  analyzeAndRespondJSON,
  generateAndSaveBlogPost,
  generateAndSaveReport,
  generatePageSEO,
  aiEngine,
} from "@/lib/firebase/ai-engine";
import { generateText } from "@/lib/firebase/ai";
import { create } from "@/lib/firebase/firestore";
import { loadPageAwareContext } from "@/lib/utils/ai-page-context";
import { buildTrainedPrompt, buildReportPrompt } from "@/lib/utils/ai-system-prompt";

const mockGenerateText = generateText as unknown as ReturnType<typeof vi.fn>;
const mockCreate = create as unknown as ReturnType<typeof vi.fn>;
const mockLoadPageAwareContext = loadPageAwareContext as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateText.mockResolvedValue('{"result": "ok"}');
  mockCreate.mockResolvedValue("new-doc-id");
  mockLoadPageAwareContext.mockResolvedValue({
    dataContext: "data-ctx",
    pageContext: "page-ctx",
    section: "Test AI",
    loadedCollections: ["leads"],
    rawData: { leads: [] },
  });
});

// ─── analyzeAndRespond ──────────────────────────────

describe("analyzeAndRespond", () => {
  it("loads page context and generates text", async () => {
    mockGenerateText.mockResolvedValueOnce("AI response");
    const result = await analyzeAndRespond("/admin/leads", "How are leads?");
    expect(mockLoadPageAwareContext).toHaveBeenCalledWith("/admin/leads");
    expect(buildTrainedPrompt).toHaveBeenCalled();
    expect(result).toBe("AI response");
  });

  it("auto-detects SEO modules for seo pages", async () => {
    await analyzeAndRespond("/admin/seo/keywords", "Analyze keywords");
    const call = (buildTrainedPrompt as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const options = call[3]; // 4th argument is options
    expect(options.includeAIO).toBe(true);
    expect(options.includeGEO).toBe(true);
    expect(options.includeSERP).toBe(true);
    expect(options.includeTechnicalSEO).toBe(true);
  });

  it("auto-detects marketing modules for campaigns", async () => {
    await analyzeAndRespond("/admin/marketing/campaigns", "Campaign analysis");
    const call = (buildTrainedPrompt as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const options = call[3];
    expect(options.includeSEM).toBe(true);
    expect(options.includeAnalytics).toBe(true);
  });

  it("passes custom instructions through", async () => {
    await analyzeAndRespond("/admin/leads", "Help me", {
      customInstructions: "Be brief",
    });
    const call = (buildTrainedPrompt as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[3].customInstructions).toBe("Be brief");
  });
});

// ─── analyzeAndRespondJSON ──────────────────────────

describe("analyzeAndRespondJSON", () => {
  it("parses JSON from response", async () => {
    mockGenerateText.mockResolvedValueOnce('{"score": 85, "items": []}');
    const result = await analyzeAndRespondJSON("/admin/blog", "Info");
    expect(result).toEqual({ score: 85, items: [] });
  });

  it("strips markdown fences from response", async () => {
    mockGenerateText.mockResolvedValueOnce('```json\n{"ok": true}\n```');
    const result = await analyzeAndRespondJSON("/admin/blog", "Test");
    expect(result).toEqual({ ok: true });
  });

  it("throws on invalid JSON", async () => {
    mockGenerateText.mockResolvedValueOnce("not json at all");
    await expect(
      analyzeAndRespondJSON("/admin/blog", "Test"),
    ).rejects.toThrow();
  });
});

// ─── generateAndSaveBlogPost ─────────────────────────

describe("generateAndSaveBlogPost", () => {
  it("saves generated post to Firestore", async () => {
    mockGenerateText.mockResolvedValueOnce(
      JSON.stringify({
        title: "Test Post",
        slug: "test-post",
        excerpt: "A test",
        content: "<p>Hello</p>",
        tags: ["test"],
        metaDescription: "A test post",
        targetKeyword: "test",
        secondaryKeywords: [],
        internalLinks: [],
        seoScore: 80,
      }),
    );
    mockCreate.mockResolvedValueOnce("blog-123");

    const result = await generateAndSaveBlogPost("Test topic");
    expect(result.id).toBe("blog-123");
    expect(result.post.title).toBe("Test Post");
    expect(mockCreate).toHaveBeenCalledWith(
      "blog",
      expect.objectContaining({ title: "Test Post", status: "draft" }),
    );
  });
});

// ─── generateAndSaveReport ──────────────────────────

describe("generateAndSaveReport", () => {
  it("creates a report and saves to Firestore", async () => {
    mockGenerateText.mockResolvedValueOnce(
      JSON.stringify({
        title: "Daily Report",
        summaryHtml: "<p>Summary</p>",
        highlights: ["Good traffic"],
        recommendations: ["Write more"],
        score: 75,
      }),
    );
    // Second call is for dynamic presets (ignore)
    mockGenerateText.mockResolvedValueOnce("[]");
    mockCreate.mockResolvedValueOnce("report-456");

    const id = await generateAndSaveReport("daily");
    expect(id).toBe("report-456");
    expect(buildReportPrompt).toHaveBeenCalledWith("daily", expect.any(String), "data-ctx");
    expect(mockCreate).toHaveBeenCalledWith(
      "reports",
      expect.objectContaining({ type: "daily", category: "on-demand" }),
    );
  });
});

// ─── generatePageSEO ────────────────────────────────

describe("generatePageSEO", () => {
  it("returns SEO metadata", async () => {
    mockGenerateText.mockResolvedValueOnce(
      JSON.stringify({
        title: "VA Services | CreedaVA",
        description: "Best VA services in Belize.",
        ogTitle: "VA Services",
        ogDescription: "Best VA services.",
        keywords: ["virtual assistant", "belize"],
      }),
    );

    const result = await generatePageSEO("/services", "Our services page");
    expect(result.title).toContain("VA Services");
    expect(result.keywords).toContain("virtual assistant");
  });

  it("auto-saves when autoSave is true", async () => {
    mockGenerateText.mockResolvedValueOnce(
      JSON.stringify({
        title: "T",
        description: "D",
        ogTitle: "OT",
        ogDescription: "OD",
        keywords: ["k"],
      }),
    );

    await generatePageSEO("/about", "About page", true);
    expect(mockCreate).toHaveBeenCalledWith(
      "page-seo",
      expect.objectContaining({ path: "/about" }),
    );
  });
});

// ─── aiEngine namespace ─────────────────────────────

describe("aiEngine namespace", () => {
  it("exports all expected methods", () => {
    expect(aiEngine.analyzeAndRespond).toBe(analyzeAndRespond);
    expect(aiEngine.analyzeAndRespondJSON).toBe(analyzeAndRespondJSON);
    expect(aiEngine.runSEOAnalysis).toBeDefined();
    expect(aiEngine.generatePageSEO).toBeDefined();
    expect(aiEngine.generateMarketIntelReport).toBeDefined();
    expect(aiEngine.generateSEOBlogPost).toBeDefined();
    expect(aiEngine.generateAndSaveBlogPost).toBeDefined();
    expect(aiEngine.generateContentStrategy).toBeDefined();
    expect(aiEngine.analyzePipeline).toBeDefined();
    expect(aiEngine.analyzeCustomerHealth).toBeDefined();
    expect(aiEngine.generateAndSaveReport).toBeDefined();
  });
});
