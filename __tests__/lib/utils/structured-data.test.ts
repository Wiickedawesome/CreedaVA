import { describe, it, expect } from "vitest";

import {
  websiteJsonLd,
  breadcrumbJsonLd,
  serviceJsonLd,
  faqJsonLd,
  blogPostingJsonLd,
  webPageJsonLd,
  forumPostingJsonLd,
  pricingJsonLd,
  contactPageJsonLd,
} from "@/lib/utils/structured-data";

const SITE = "https://creedava.com";

describe("Structured Data (JSON-LD)", () => {
  // ─── websiteJsonLd ──────────────────────────────────

  describe("websiteJsonLd", () => {
    it("returns WebSite schema with search action", () => {
      const ld = websiteJsonLd();
      expect(ld["@context"]).toBe("https://schema.org");
      expect(ld["@type"]).toBe("WebSite");
      expect(ld.name).toBe("CreedaVA");
      expect(ld.url).toBe(SITE);
      expect(ld.potentialAction?.["@type"]).toBe("SearchAction");
    });

    it("has publisher organization", () => {
      const ld = websiteJsonLd();
      expect(ld.publisher?.["@type"]).toBe("Organization");
      expect(ld.publisher?.name).toBe("CreedaVA");
    });
  });

  // ─── breadcrumbJsonLd ───────────────────────────────

  describe("breadcrumbJsonLd", () => {
    it("builds BreadcrumbList with correct positions", () => {
      const ld = breadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: "Services", href: "/services" },
      ]);
      expect(ld["@type"]).toBe("BreadcrumbList");
      expect(ld.itemListElement).toHaveLength(2);
      expect(ld.itemListElement[0].position).toBe(1);
      expect(ld.itemListElement[1].position).toBe(2);
    });

    it("prepends SITE to relative hrefs", () => {
      const ld = breadcrumbJsonLd([{ name: "About", href: "/about" }]);
      expect(ld.itemListElement[0].item).toBe(`${SITE}/about`);
    });

    it("keeps absolute URLs as-is", () => {
      const ld = breadcrumbJsonLd([
        { name: "External", href: "https://other.com" },
      ]);
      expect(ld.itemListElement[0].item).toBe("https://other.com");
    });
  });

  // ─── serviceJsonLd ─────────────────────────────────

  describe("serviceJsonLd", () => {
    it("returns Service schema with provider", () => {
      const ld = serviceJsonLd({
        name: "Executive VA",
        description: "Dedicated executive assistant services",
      });
      expect(ld["@type"]).toBe("Service");
      expect(ld.name).toBe("Executive VA");
      expect(ld.provider?.name).toBe("CreedaVA");
      expect(ld.availableLanguage).toContain("Spanish");
    });

    it("uses default URL when not provided", () => {
      const ld = serviceJsonLd({ name: "X", description: "Y" });
      expect(ld.url).toBe(`${SITE}/services`);
    });

    it("uses custom URL when provided", () => {
      const ld = serviceJsonLd({
        name: "X",
        description: "Y",
        url: "/services/custom",
      });
      expect(ld.url).toBe("/services/custom");
    });
  });

  // ─── faqJsonLd ──────────────────────────────────────

  describe("faqJsonLd", () => {
    it("builds FAQPage with questions", () => {
      const ld = faqJsonLd([
        { question: "What is a VA?", answer: "A virtual assistant." },
        { question: "Pricing?", answer: "Starting at $X/hr." },
      ]);
      expect(ld["@type"]).toBe("FAQPage");
      expect(ld.mainEntity).toHaveLength(2);
      expect(ld.mainEntity[0]["@type"]).toBe("Question");
      expect(ld.mainEntity[0].acceptedAnswer.text).toContain("virtual assistant");
    });
  });

  // ─── blogPostingJsonLd ──────────────────────────────

  describe("blogPostingJsonLd", () => {
    it("returns BlogPosting with correct URL", () => {
      const ld = blogPostingJsonLd({
        title: "Top 10 VA Tips",
        slug: "top-10-va-tips",
        excerpt: "Best practices for virtual assistants.",
        publishedAt: "2025-01-15",
        tags: ["VA", "productivity"],
      });
      expect(ld["@type"]).toBe("BlogPosting");
      expect(ld.headline).toBe("Top 10 VA Tips");
      expect(ld.url).toBe(`${SITE}/news/top-10-va-tips`);
      expect(ld.keywords).toBe("VA, productivity");
    });

    it("uses publishedAt as dateModified fallback", () => {
      const ld = blogPostingJsonLd({
        title: "T",
        slug: "t",
        excerpt: "X",
        publishedAt: "2025-06-01",
      });
      expect(ld.dateModified).toBe("2025-06-01");
    });

    it("prefers explicit updatedAt over publishedAt for dateModified", () => {
      const ld = blogPostingJsonLd({
        title: "T",
        slug: "t",
        excerpt: "X",
        publishedAt: "2025-06-01",
        updatedAt: "2025-07-01",
      });
      expect(ld.dateModified).toBe("2025-07-01");
    });
  });

  // ─── webPageJsonLd ──────────────────────────────────

  describe("webPageJsonLd", () => {
    it("returns WebPage with absolute URL", () => {
      const ld = webPageJsonLd({
        name: "Pricing",
        description: "Our plans",
        url: "/pricing",
      });
      expect(ld["@type"]).toBe("WebPage");
      expect(ld.url).toBe(`${SITE}/pricing`);
    });

    it("keeps absolute URLs as-is", () => {
      const ld = webPageJsonLd({
        name: "X",
        description: "Y",
        url: "https://creedava.com/custom",
      });
      expect(ld.url).toBe("https://creedava.com/custom");
    });
  });

  // ─── forumPostingJsonLd ─────────────────────────────

  describe("forumPostingJsonLd", () => {
    it("returns DiscussionForumPosting with interaction count", () => {
      const ld = forumPostingJsonLd({
        id: "thread-1",
        title: "Best VA tools",
        author: "Jane",
        datePublished: "2025-03-01",
        text: "What are your favorite tools for virtual assistance?",
        replyCount: 5,
      });
      expect(ld["@type"]).toBe("DiscussionForumPosting");
      expect(ld.url).toBe(`${SITE}/forum/thread-1`);
      expect(ld.author.name).toBe("Jane");
      expect(ld.interactionStatistic.userInteractionCount).toBe(5);
    });

    it("truncates long text to 200 chars", () => {
      const longText = "a".repeat(500);
      const ld = forumPostingJsonLd({
        id: "t",
        title: "T",
        author: "A",
        datePublished: "2025-01-01",
        text: longText,
        replyCount: 0,
      });
      expect(ld.text.length).toBe(200);
    });
  });

  // ─── pricingJsonLd ──────────────────────────────────

  describe("pricingJsonLd", () => {
    it("returns Product with offers", () => {
      const ld = pricingJsonLd([
        { name: "Basic", price: 499, description: "10 hrs/month" },
        { name: "Pro", price: 999, description: "25 hrs/month" },
      ]);
      expect(ld["@type"]).toBe("Product");
      expect(ld.offers).toHaveLength(2);
      expect(ld.offers[0].price).toBe(499);
      expect(ld.offers[0].priceCurrency).toBe("USD");
      expect(ld.offers[1].name).toBe("Pro");
    });
  });

  // ─── contactPageJsonLd ──────────────────────────────

  describe("contactPageJsonLd", () => {
    it("returns ContactPage with organization", () => {
      const ld = contactPageJsonLd();
      expect(ld["@type"]).toBe("ContactPage");
      expect(ld.url).toBe(`${SITE}/contact`);
      expect(ld.mainEntity.telephone).toBeTruthy();
      expect(ld.mainEntity.contactPoint.availableLanguage).toContain("English");
    });
  });
});
