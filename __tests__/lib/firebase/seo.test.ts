import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Firebase firestore module
const mockFetchAll = vi.fn();
vi.mock("@/lib/firebase/firestore", () => ({
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
  where: (field: string, op: string, value: unknown) => ({ field, op, value }),
}));
vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: {},
  db: {},
}));

import { getPageSEO } from "@/lib/firebase/seo";

describe("getPageSEO", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Firestore SEO data when a document exists", async () => {
    mockFetchAll.mockResolvedValue([
      {
        id: "1",
        path: "/about",
        title: "About Us | CreedaVA",
        description: "Learn about our team.",
        ogTitle: "About CreedaVA",
        ogDescription: "Discover our story.",
        ogImage: "https://creedava.com/og.png",
        keywords: ["virtual assistant", "about"],
      },
    ]);

    const meta = await getPageSEO("/about", {
      title: "Fallback Title",
      description: "Fallback description",
    });

    expect(meta.title).toBe("About Us | CreedaVA");
    expect(meta.description).toBe("Learn about our team.");
    expect(meta.alternates?.canonical).toBe("https://creedava.com/about");
    expect(meta.keywords).toEqual(["virtual assistant", "about"]);

    const og = meta.openGraph as Record<string, unknown>;
    expect(og.title).toBe("About CreedaVA");
    expect(og.description).toBe("Discover our story.");
    expect(og.url).toBe("https://creedava.com/about");
    expect(og.siteName).toBe("CreedaVA");

    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.title).toBe("About CreedaVA");
  });

  it("falls back to defaults when no Firestore doc exists", async () => {
    mockFetchAll.mockResolvedValue([]);

    const meta = await getPageSEO("/services", {
      title: "Our Services",
      description: "VA services description",
    });

    expect(meta.title).toBe("Our Services");
    expect(meta.description).toBe("VA services description");
    expect(meta.alternates?.canonical).toBe("https://creedava.com/services");

    const og = meta.openGraph as Record<string, unknown>;
    expect(og.title).toBe("Our Services");
    expect(og.url).toBe("https://creedava.com/services");
  });

  it("falls back to defaults when Firestore throws", async () => {
    mockFetchAll.mockRejectedValue(new Error("Permission denied"));

    const meta = await getPageSEO("/contact", {
      title: "Contact",
      description: "Get in touch",
    });

    expect(meta.title).toBe("Contact");
    expect(meta.description).toBe("Get in touch");
    expect(meta.alternates?.canonical).toBe("https://creedava.com/contact");
  });

  it("uses default title/description when Firestore doc has empty fields", async () => {
    mockFetchAll.mockResolvedValue([
      {
        id: "2",
        path: "/pricing",
        title: "",
        description: "",
      },
    ]);

    const meta = await getPageSEO("/pricing", {
      title: "Pricing",
      description: "Plans and pricing",
    });

    expect(meta.title).toBe("Pricing");
    expect(meta.description).toBe("Plans and pricing");
  });

  it("includes noIndex robots directive when set", async () => {
    mockFetchAll.mockResolvedValue([
      {
        id: "3",
        path: "/draft",
        title: "Draft Page",
        description: "Not public",
        noIndex: true,
      },
    ]);

    const meta = await getPageSEO("/draft", {
      title: "Draft",
      description: "Draft",
    });

    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("includes twitter card metadata in all responses", async () => {
    mockFetchAll.mockResolvedValue([]);

    const meta = await getPageSEO("/faq", {
      title: "FAQ",
      description: "Frequently asked questions",
    });

    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.title).toBe("FAQ");
    expect(twitter.description).toBe("Frequently asked questions");
  });

  it("includes OG image with dimensions when provided", async () => {
    mockFetchAll.mockResolvedValue([
      {
        id: "4",
        path: "/news",
        title: "News",
        description: "Latest news",
        ogImage: "https://creedava.com/news-og.png",
      },
    ]);

    const meta = await getPageSEO("/news", {
      title: "News",
      description: "News",
    });

    const og = meta.openGraph as { images?: { url: string; width: number; height: number; alt: string }[] };
    expect(og.images).toBeDefined();
    expect(og.images?.[0].url).toBe("https://creedava.com/news-og.png");
    expect(og.images?.[0].width).toBe(1200);
    expect(og.images?.[0].height).toBe(630);
  });
});
