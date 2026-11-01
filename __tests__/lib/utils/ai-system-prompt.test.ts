import { describe, it, expect } from "vitest";

import {
  buildTrainedPrompt,
  buildReportPrompt,
  buildLandingPagePrompt,
  buildContentPrompt,
  getPageContext,
  CREEDA_IDENTITY,
  DESIGN_SYSTEM,
  SEO_ALGORITHMS,
  FORUM_CONTENT_RULES,
  BLOG_CONTENT_RULES,
  LANDING_PAGE_RULES,
  CITATION_RULES,
  TOOL_USE_GUIDELINES,
  PAGE_CONTEXT_MAP,
} from "@/lib/utils/ai-system-prompt";
import {
  MAX_SYSTEM_INSTRUCTION_LENGTH,
  MAX_USER_CONTENT_LENGTH,
} from "@/lib/constants/ai";

describe("AI System Prompt", () => {
  // ─── Constants exist and are non-empty ──────────────

  describe("exported constants", () => {
    it("CREEDA_IDENTITY is a non-empty string", () => {
      expect(CREEDA_IDENTITY.length).toBeGreaterThan(100);
      expect(CREEDA_IDENTITY).toContain("CreedaVA");
    });

    it("DESIGN_SYSTEM contains CSS variable references", () => {
      expect(DESIGN_SYSTEM).toContain("--");
      expect(DESIGN_SYSTEM.length).toBeGreaterThan(50);
    });

    it("SEO_ALGORITHMS contains ranking strategy content", () => {
      expect(SEO_ALGORITHMS).toContain("SEO");
      expect(SEO_ALGORITHMS.length).toBeGreaterThan(50);
    });

    it("FORUM_CONTENT_RULES contains moderation directives", () => {
      expect(FORUM_CONTENT_RULES).toContain("FORUM");
    });

    it("BLOG_CONTENT_RULES contains blog directives", () => {
      expect(BLOG_CONTENT_RULES).toContain("BLOG");
    });

    it("LANDING_PAGE_RULES contains LP generation directives", () => {
      expect(LANDING_PAGE_RULES).toContain("LANDING PAGE");
    });

    it("CITATION_RULES contains citation directives", () => {
      expect(CITATION_RULES).toContain("CITATION");
    });

    it("TOOL_USE_GUIDELINES contains function calling rules", () => {
      expect(TOOL_USE_GUIDELINES).toContain("FUNCTION CALLING");
    });
  });

  // ─── PAGE_CONTEXT_MAP ───────────────────────────────

  describe("PAGE_CONTEXT_MAP", () => {
    it("maps all expected admin pages", () => {
      const expected = [
        "analytics",
        "blog",
        "bookings",
        "contacts",
        "customers",
        "emails",
        "forum",
        "leads",
        "marketing/campaigns",
        "marketing/landing-pages",
        "marketing/social",
        "projects",
        "seo/content",
        "seo/keywords",
        "settings",
        "tasks",
      ];
      for (const page of expected) {
        expect(PAGE_CONTEXT_MAP).toHaveProperty(page);
        expect(PAGE_CONTEXT_MAP[page].length).toBeGreaterThan(50);
      }
    });
  });

  // ─── getPageContext ─────────────────────────────────

  describe("getPageContext", () => {
    it("returns analytics context for /admin/analytics", () => {
      const ctx = getPageContext("/admin/analytics");
      expect(ctx).toContain("ANALYTICS");
    });

    it("returns leads context for /admin/leads/", () => {
      const ctx = getPageContext("/admin/leads/");
      expect(ctx).toContain("LEADS");
    });

    it("handles nested paths like /admin/seo/keywords", () => {
      const ctx = getPageContext("/admin/seo/keywords");
      expect(ctx).toContain("KEYWORD");
    });

    it("returns fallback for unknown pages", () => {
      const ctx = getPageContext("/admin/unknown-page");
      expect(ctx).toContain("holistic");
    });

    it("normalizes paths (strips /admin/, trailing slash, lowercases)", () => {
      const ctx = getPageContext("/admin/BLOG/");
      expect(ctx).toContain("BLOG");
    });
  });

  // ─── buildTrainedPrompt ─────────────────────────────

  describe("buildTrainedPrompt", () => {
    it("returns TrainedPrompt with systemInstruction and userContent", () => {
      const result = buildTrainedPrompt("Test Section", "What are my leads?");
      expect(result).toHaveProperty("systemInstruction");
      expect(result).toHaveProperty("userContent");
    });

    it("always includes CREEDA_IDENTITY in systemInstruction", () => {
      const result = buildTrainedPrompt("X", "Y");
      expect(result.systemInstruction).toContain("CreedaVA");
    });

    it("always includes SEO_ALGORITHMS by default", () => {
      // includeSEOAlgorithms defaults to true (!== false)
      const result = buildTrainedPrompt("X", "Y");
      expect(result.systemInstruction).toContain("SEO");
    });

    it("includes section in userContent", () => {
      const result = buildTrainedPrompt("Blog AI", "Write a post");
      expect(result.userContent).toContain("SECTION: Blog AI");
    });

    it("includes user prompt in userContent", () => {
      const result = buildTrainedPrompt("X", "Generate a report");
      expect(result.userContent).toContain("Generate a report");
    });

    it("includes data context when provided", () => {
      const result = buildTrainedPrompt("X", "Y", "Leads: 42, Revenue: $10K");
      expect(result.userContent).toContain("LIVE BUSINESS DATA");
      expect(result.userContent).toContain("Leads: 42");
    });

    it("includes design system when option is set", () => {
      const result = buildTrainedPrompt("X", "Y", "", {
        includeDesignSystem: true,
      });
      expect(result.systemInstruction).toContain("DESIGN SYSTEM");
    });

    it("includes forum rules when option is set", () => {
      const result = buildTrainedPrompt("X", "Y", "", {
        includeForumRules: true,
      });
      expect(result.systemInstruction).toContain("FORUM");
    });

    it("includes blog rules when option is set", () => {
      const result = buildTrainedPrompt("X", "Y", "", {
        includeBlogRules: true,
      });
      expect(result.systemInstruction).toContain("BLOG");
    });

    it("includes citation rules when option is set", () => {
      const result = buildTrainedPrompt("X", "Y", "", {
        includeCitationRules: true,
      });
      expect(result.systemInstruction).toContain("CITATION");
    });

    it("includes tool guidelines when option is set", () => {
      const result = buildTrainedPrompt("X", "Y", "", {
        includeToolGuidelines: true,
      });
      expect(result.systemInstruction).toContain("FUNCTION CALLING");
    });

    it("includes page context when provided", () => {
      const result = buildTrainedPrompt("X", "Y", "", {
        pageContext: "You are on the LEADS page",
      });
      expect(result.systemInstruction).toContain("CURRENT PAGE CONTEXT");
      expect(result.systemInstruction).toContain("LEADS page");
    });

    it("includes web search results in userContent", () => {
      const result = buildTrainedPrompt("X", "Y", "", {
        webSearchResults: "VA market grew 15% in 2025",
      });
      expect(result.userContent).toContain("REAL-TIME MARKET DATA");
      expect(result.userContent).toContain("VA market grew");
    });

    it("includeWebMastery=true adds all web expertise modules", () => {
      const result = buildTrainedPrompt("X", "Y", "", {
        includeWebMastery: true,
      });
      // Should contain AIO, GEO, SERP, SEM, Analytics, Technical SEO, Authority, CRO
      expect(result.systemInstruction).toContain("AI OPTIMIZATION");
      expect(result.systemInstruction).toContain("GENERATIVE ENGINE");
      expect(result.systemInstruction).toContain("SERP FEATURE");
      expect(result.systemInstruction).toContain("SEARCH ENGINE MARKETING");
    });
  });

  // ─── buildReportPrompt ──────────────────────────────

  describe("buildReportPrompt", () => {
    it("includes competitor context and report format", () => {
      const result = buildReportPrompt(
        "Weekly",
        "Generate weekly report",
        "Leads: 10",
      );
      expect(result.systemInstruction).toContain("COMPETITIVE LANDSCAPE");
      expect(result.systemInstruction).toContain("REPORT OUTPUT FORMAT");
      expect(result.systemInstruction).toContain("VALID JSON ONLY");
    });

    it("includes web search results when provided", () => {
      const result = buildReportPrompt(
        "Daily",
        "Daily digest",
        "x",
        "Google trends data",
      );
      expect(result.userContent).toContain("Google trends data");
    });
  });

  // ─── buildLandingPagePrompt ─────────────────────────

  describe("buildLandingPagePrompt", () => {
    it("includes design system and creative framework", () => {
      const result = buildLandingPagePrompt("Bilingual VA services");
      expect(result.systemInstruction).toContain("DESIGN SYSTEM");
      expect(result.systemInstruction).toContain("CREATIVE HTML");
      expect(result.systemInstruction).toContain("LANDING PAGE");
      expect(result.userContent).toContain("Bilingual VA services");
    });
  });

  // ─── buildContentPrompt ─────────────────────────────

  describe("buildContentPrompt", () => {
    it("includes blog rules when isBlog is true", () => {
      const result = buildContentPrompt("Blog AI", "Write a post", "", {
        isBlog: true,
      });
      expect(result.systemInstruction).toContain("BLOG");
      expect(result.systemInstruction).toContain("DESIGN SYSTEM");
    });

    it("includes forum rules when isForum is true", () => {
      const result = buildContentPrompt("Forum AI", "Create a thread", "", {
        isForum: true,
      });
      expect(result.systemInstruction).toContain("FORUM");
    });

    it("does not include blog rules when isBlog is false", () => {
      const result = buildContentPrompt("Email AI", "Write email", "");
      expect(result.systemInstruction).not.toContain("BLOG & ARTICLE CONTENT");
    });
  });

  // ─── API proxy limits ───────────────────────────────
  // A 50k cap silently rejected blog and landing-page generation; keep every
  // builder under the limit the /api/ai proxy enforces.

  describe("stays within /api/ai limits", () => {
    const builders = [
      { name: "default", build: () => buildTrainedPrompt("X", "prompt") },
      { name: "blog", build: () => buildContentPrompt("Blog", "prompt", "", { isBlog: true }) },
      { name: "forum", build: () => buildContentPrompt("Forum", "prompt", "", { isForum: true }) },
      { name: "social", build: () => buildContentPrompt("Social", "prompt") },
      { name: "landing page", build: () => buildLandingPagePrompt("prompt") },
      { name: "report", build: () => buildReportPrompt("Weekly", "prompt", "data") },
    ];

    it.each(builders)("$name prompt fits the system instruction limit", ({ build }) => {
      const prompt = build();
      expect(prompt.systemInstruction.length).toBeLessThanOrEqual(
        MAX_SYSTEM_INSTRUCTION_LENGTH,
      );
      expect(prompt.userContent.length).toBeLessThanOrEqual(MAX_USER_CONTENT_LENGTH);
    });
  });
});
