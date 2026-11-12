import { describe, it, expect } from "vitest";

import {
  buildFullContext,
  buildPeriodContext,
  buildSalesContext,
  buildSEOContext,
  buildMarketingContext,
  buildKeywordContext,
  buildLandingPageContext,
  buildBookingContext,
  buildBlogContext,
  buildForumContext,
  buildContentVelocityContext,
  buildCustomerLTVContext,
  buildLeadResponseContext,
  buildEmailEngagementContext,
  buildRevenueAttributionContext,
  type AllCollections,
} from "@/lib/utils/ai-data-context";

// ─── Test fixtures ───────────────────────────────────

const SAMPLE_DATA: AllCollections = {
  leads: [
    { id: "l1", name: "Alice", email: "a@a.com", status: "new", source: "web", value: 1000, createdAt: new Date().toISOString() } as never,
    { id: "l2", name: "Bob", email: "b@b.com", status: "contacted", source: "referral", value: 2000, createdAt: new Date().toISOString() } as never,
  ],
  customers: [
    { id: "c1", name: "Charlie", email: "c@c.com", status: "active", plan: "pro", mrr: 500, createdAt: new Date().toISOString() } as never,
  ],

  contacts: [
    { id: "co1", name: "Diana", email: "d@d.com", company: "ACME", createdAt: new Date().toISOString() } as never,
  ],
  bookings: [
    { id: "b1", service: "VA", name: "Eve", status: "confirmed", createdAt: new Date().toISOString() } as never,
  ],
  campaigns: [
    { id: "ca1", name: "Google Ads Q1", platform: "google", spend: 500, clicks: 100, impressions: 5000, conversions: 10 } as never,
  ],
  emails: [
    { id: "e1", subject: "Welcome", to: "new@customer.com", status: "sent", createdAt: new Date().toISOString() } as never,
  ],
  blog: [
    { id: "bl1", title: "Top VA Tips", slug: "top-va-tips", status: "published", views: 500, createdAt: new Date().toISOString() } as never,
  ],
  keywords: [
    { id: "k1", keyword: "virtual assistant", position: 12, volume: 5000, difficulty: 45 } as never,
  ],
  seoAudits: [
    { id: "sa1", url: "/services", score: 85, issues: [{ severity: "high", message: "Missing alt" }] } as never,
  ],
  landingPages: [
    { id: "lp1", title: "VA Services", slug: "va-services", views: 200, conversions: 15 } as never,
  ],
  forumThreads: [
    { id: "f1", title: "Best tools?", status: "open", replies: 5, createdAt: new Date().toISOString() } as never,
  ],
};

const EMPTY_DATA: AllCollections = {};

describe("AI Data Context Builders", () => {
  // ─── buildFullContext ───────────────────────────────

  describe("buildFullContext", () => {
    it("includes all collection summaries when data is present", () => {
      const result = buildFullContext(SAMPLE_DATA);
      expect(result).toContain("Business Intelligence Snapshot");
      expect(result.length).toBeGreaterThan(100);
    });

    it("returns minimal output for empty data", () => {
      const result = buildFullContext(EMPTY_DATA);
      expect(result).toContain("Business Intelligence Snapshot");
      // Should be short since no collections have data
      expect(result.length).toBeLessThan(200);
    });
  });

  // ─── buildPeriodContext ─────────────────────────────

  describe("buildPeriodContext", () => {
    it("includes period header for daily", () => {
      const result = buildPeriodContext(SAMPLE_DATA, "daily");
      expect(result).toContain("Daily Report");
      expect(result).toContain("ALL-TIME TOTALS");
    });

    it("includes period header for weekly", () => {
      const result = buildPeriodContext(SAMPLE_DATA, "weekly");
      expect(result).toContain("Weekly Report");
    });

    it("includes period header for monthly", () => {
      const result = buildPeriodContext(SAMPLE_DATA, "monthly");
      expect(result).toContain("Monthly Report");
    });

    it("includes all-time totals for comparison", () => {
      const result = buildPeriodContext(SAMPLE_DATA, "daily");
      expect(result).toContain("Leads: 2 total");
      expect(result).toContain("Customers: 1 total");
    });
  });

  // ─── Category-specific builders ─────────────────────

  describe("buildSalesContext", () => {
    it("includes sales header and lead data", () => {
      const result = buildSalesContext(SAMPLE_DATA);
      expect(result).toContain("SALES & PIPELINE");
    });

    it("returns header only for empty data", () => {
      const result = buildSalesContext(EMPTY_DATA);
      expect(result).toBe("SALES & PIPELINE CONTEXT");
    });
  });

  describe("buildSEOContext", () => {
    it("includes SEO header", () => {
      const result = buildSEOContext(SAMPLE_DATA);
      expect(result).toContain("SEO & CONTENT");
    });
  });

  describe("buildMarketingContext", () => {
    it("includes marketing header", () => {
      const result = buildMarketingContext(SAMPLE_DATA);
      expect(result).toContain("MARKETING");
    });
  });

  describe("buildKeywordContext", () => {
    it("includes keyword header", () => {
      const result = buildKeywordContext(SAMPLE_DATA);
      expect(result).toContain("KEYWORD HEALTH");
    });
  });

  describe("buildLandingPageContext", () => {
    it("includes landing page header", () => {
      const result = buildLandingPageContext(SAMPLE_DATA);
      expect(result).toContain("LANDING PAGE PERFORMANCE");
    });
  });

  describe("buildBookingContext", () => {
    it("includes booking header", () => {
      const result = buildBookingContext(SAMPLE_DATA);
      expect(result).toContain("BOOKING & RETENTION");
    });
  });

  describe("buildBlogContext", () => {
    it("includes blog header", () => {
      const result = buildBlogContext(SAMPLE_DATA);
      expect(result).toContain("BLOG PERFORMANCE");
    });
  });

  describe("buildForumContext", () => {
    it("includes forum header", () => {
      const result = buildForumContext(SAMPLE_DATA);
      expect(result).toContain("FORUM HEALTH");
    });
  });

  describe("buildContentVelocityContext", () => {
    it("includes content velocity header", () => {
      const result = buildContentVelocityContext(SAMPLE_DATA);
      expect(result).toContain("CONTENT VELOCITY");
    });
  });

  describe("buildCustomerLTVContext", () => {
    it("includes LTV header", () => {
      const result = buildCustomerLTVContext(SAMPLE_DATA);
      expect(result).toContain("CUSTOMER LTV");
    });
  });

  describe("buildLeadResponseContext", () => {
    it("includes lead response header", () => {
      const result = buildLeadResponseContext(SAMPLE_DATA);
      expect(result).toContain("LEAD RESPONSE");
    });
  });

  describe("buildEmailEngagementContext", () => {
    it("includes email header", () => {
      const result = buildEmailEngagementContext(SAMPLE_DATA);
      expect(result).toContain("EMAIL ENGAGEMENT");
    });
  });

  describe("buildRevenueAttributionContext", () => {
    it("includes revenue header", () => {
      const result = buildRevenueAttributionContext(SAMPLE_DATA);
      expect(result).toContain("REVENUE ATTRIBUTION");
    });
  });

  // ─── Empty data edge cases ──────────────────────────

  describe("edge cases", () => {
    it("all builders handle undefined collections gracefully", () => {
      const builders = [
        buildFullContext,
        buildSalesContext,
        buildSEOContext,
        buildMarketingContext,
        buildKeywordContext,
        buildLandingPageContext,
        buildBookingContext,
        buildBlogContext,
        buildForumContext,
        buildContentVelocityContext,
        buildCustomerLTVContext,
        buildLeadResponseContext,
        buildEmailEngagementContext,
        buildRevenueAttributionContext,
      ];
      for (const builder of builders) {
        expect(() => builder({})).not.toThrow();
      }
    });

    it("all builders handle empty arrays gracefully", () => {
      const emptyArrays: AllCollections = {
        leads: [],
        customers: [],
        contacts: [],
        bookings: [],
        campaigns: [],
        emails: [],
        blog: [],
        keywords: [],
        seoAudits: [],
        landingPages: [],
        forumThreads: [],
      };
      expect(() => buildFullContext(emptyArrays)).not.toThrow();
    });
  });
});
