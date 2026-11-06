import { describe, it, expect } from "vitest";

import {
  buildTrainedPrompt,
  buildReportPrompt,
  buildLandingPagePrompt,
  buildContentPrompt,
  getPageContext,
  CREEDA_IDENTITY,
  SEO_ALGORITHMS,
  FORUM_CONTENT_RULES,
  CITATION_RULES,
  TOOL_USE_GUIDELINES,
  PAGE_CONTEXT_MAP,
} from "@/lib/utils/ai-system-prompt";
import {
  BLOG_BODY_RULES_2026,
  DESIGN_SYSTEM_2026,
  HTML_CONTENT_RULES_2026,
  LANDING_PAGE_RULES_2026,
} from "@/lib/utils/ai-design-2026";
import { ALL_SPECIALISTS } from "@/lib/utils/ai-specialists";
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

    it("DESIGN_SYSTEM_2026 uses the --mk-* tokens and drops the old headings", () => {
      expect(DESIGN_SYSTEM_2026).toContain("--mk-ink");
      expect(DESIGN_SYSTEM_2026).toContain("--mk-paper");
      // The legacy palette is named once, in the BANNED list, so a model can
      // recognise what not to use. What must be gone is the old positive
      // instruction: the approved-gradient table and the CoolGray scale.
      expect(DESIGN_SYSTEM_2026).toContain("BANNED");
      expect(DESIGN_SYSTEM_2026).not.toContain("APPROVED GRADIENTS");
      expect(DESIGN_SYSTEM_2026).not.toContain("COOLGRAY");
      expect(DESIGN_SYSTEM_2026).not.toContain("use sparingly");
    });

    it("HTML_CONTENT_RULES_2026 forbids <style> tags and inline colour", () => {
      expect(HTML_CONTENT_RULES_2026).toContain("NEVER emit a <style> tag");
      expect(HTML_CONTENT_RULES_2026).toContain("Inline styles are acceptable for LAYOUT only");
    });

    it("SEO_ALGORITHMS contains ranking strategy content", () => {
      expect(SEO_ALGORITHMS).toContain("SEO");
      expect(SEO_ALGORITHMS.length).toBeGreaterThan(50);
    });

    it("FORUM_CONTENT_RULES contains moderation directives", () => {
      expect(FORUM_CONTENT_RULES).toContain("FORUM");
    });

    it("BLOG_BODY_RULES_2026 forbids a body h1", () => {
      expect(BLOG_BODY_RULES_2026).toContain("BLOG BODY RULES");
      expect(BLOG_BODY_RULES_2026).toContain("<h1> in the body");
    });

    it("LANDING_PAGE_RULES_2026 forbids rebuilding the process cards", () => {
      expect(LANDING_PAGE_RULES_2026).toContain("LANDING PAGE BODY RULES");
      expect(LANDING_PAGE_RULES_2026).toContain("number circles");
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
    it("includes the 2026 design + HTML rules and no legacy design blob", () => {
      const result = buildLandingPagePrompt("Bilingual VA services");
      expect(result.systemInstruction).toContain("DESIGN SYSTEM (2026)");
      expect(result.systemInstruction).toContain("HTML CONTENT RULES");
      expect(result.systemInstruction).toContain("LANDING PAGE BODY RULES");
      // The pre-`--mk-*` blobs must never reach a prompt again: they ask for
      // gradients, gold accents and <style> blocks the site no longer has.
      expect(result.systemInstruction).not.toContain("CREATIVE HTML DESIGN FRAMEWORK");
      expect(result.systemInstruction).not.toContain("CREEDAVA DESIGN SYSTEM — Complete");
      expect(result.userContent).toContain("Bilingual VA services");
    });
  });

  // ─── buildContentPrompt ─────────────────────────────

  describe("buildContentPrompt", () => {
    it("includes blog rules when isBlog is true", () => {
      const result = buildContentPrompt("Blog AI", "Write a post", "", {
        isBlog: true,
      });
      expect(result.systemInstruction).toContain("BLOG BODY RULES");
      expect(result.systemInstruction).toContain("DESIGN SYSTEM (2026)");
      expect(result.systemInstruction).not.toContain("BLOG & ARTICLE CONTENT");
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
      expect(result.systemInstruction).not.toContain("BLOG BODY RULES");
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

    it.each(ALL_SPECIALISTS.map((s) => [s.codename, s] as const))(
      "%s chat prompt fits the system instruction limit",
      (_codename, specialist) => {
        const prompt = buildTrainedPrompt("Chat", "prompt", "context", {
          ...specialist.promptOptions,
          specialistIntro: specialist.intro,
          includeToolGuidelines: true,
          pageContext: "page context",
        });
        expect(prompt.systemInstruction.length).toBeLessThanOrEqual(
          MAX_SYSTEM_INSTRUCTION_LENGTH,
        );
      },
    );
  });
});
