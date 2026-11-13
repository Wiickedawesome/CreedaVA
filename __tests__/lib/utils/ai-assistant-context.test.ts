import { describe, it, expect } from "vitest";
import { getAssistantContext } from "@/lib/utils/ai-assistant-context";

/**
 * There is one assistant, so what these tests pin is that each admin area still
 * resolves to the skill set its page needs — losing a module would silently thin
 * the prompt without any visible failure.
 */
describe("getAssistantContext", () => {
  it("gives the dashboard the company-wide view", () => {
    for (const path of ["/admin", "/admin/", "", "/admin/bookings"]) {
      const { area, promptOptions } = getAssistantContext(path);
      expect(area).toBe("overview");
      expect(promptOptions.includeKPIs).toBe(true);
      expect(promptOptions.includeMarketIntel).toBe(true);
      expect(promptOptions.includeReportFormat).toBe(true);
    }
  });

  it("gives SEO pages the search modules", () => {
    for (const path of ["/admin/seo/keywords", "/admin/seo/content", "/admin/analytics"]) {
      const { area, promptOptions } = getAssistantContext(path);
      expect(area).toBe("search");
      expect(promptOptions.includeSEOAlgorithms).toBe(true);
      expect(promptOptions.includeTechnicalSEO).toBe(true);
      expect(promptOptions.includeSERP).toBe(true);
    }
  });

  it("gives content pages the writing and design modules", () => {
    for (const path of ["/admin/blog", "/admin/forum", "/admin/marketing/landing-pages"]) {
      const { area, promptOptions } = getAssistantContext(path);
      expect(area).toBe("content");
      expect(promptOptions.includeDesignSystem).toBe(true);
      expect(promptOptions.includeBlogRules).toBe(true);
    }
  });

  it("gives marketing pages the acquisition and conversion modules", () => {
    for (const path of ["/admin/marketing/campaigns", "/admin/emails"]) {
      const { area, promptOptions } = getAssistantContext(path);
      expect(area).toBe("marketing");
      expect(promptOptions.includeSEM).toBe(true);
      expect(promptOptions.includeCRO).toBe(true);
    }
  });

  it("gives CRM pages the pipeline modules", () => {
    for (const path of ["/admin/leads", "/admin/contacts", "/admin/customers"]) {
      const { area, promptOptions } = getAssistantContext(path);
      expect(area).toBe("sales");
      expect(promptOptions.includeKPIs).toBe(true);
    }
  });

  it("keeps business data out of the settings area", () => {
    const { area, promptOptions } = getAssistantContext("/admin/settings");
    expect(area).toBe("configuration");
    expect(promptOptions.includeSEOAlgorithms).toBe(false);
    expect(promptOptions.includeKPIs).toBeUndefined();
  });

  it("falls back to the dashboard set for an unknown path", () => {
    // Removed surfaces must not resolve to a skill set that no longer exists.
    for (const path of ["/admin/tasks", "/admin/projects", "/admin/nonsense"]) {
      expect(getAssistantContext(path).area).toBe("overview");
    }
  });

  it("accepts paths with or without the /admin prefix", () => {
    expect(getAssistantContext("/admin/leads").area).toBe(
      getAssistantContext("leads").area,
    );
  });
});
