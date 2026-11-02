import { describe, it, expect } from "vitest";
import { demoteBodyH1 } from "@/lib/utils/blog-content";
import {
  pickFeaturedImage,
  thumbnailPromptList,
  thumbnailUrl,
  THUMBNAIL_PHOTOS,
} from "@/lib/constants/blog-images";

describe("demoteBodyH1", () => {
  it("demotes a plain h1 to h2", () => {
    expect(demoteBodyH1("<h1>Title</h1>")).toBe("<h2>Title</h2>");
  });

  it("preserves attributes on the heading", () => {
    const html = '<h1 style="color:#002D72">Title</h1>';
    expect(demoteBodyH1(html)).toBe('<h2 style="color:#002D72">Title</h2>');
  });

  it("demotes every h1 in the fragment", () => {
    const html = "<h1>A</h1><p>x</p><h1>B</h1>";
    expect(demoteBodyH1(html)).toBe("<h2>A</h2><p>x</p><h2>B</h2>");
  });

  it("leaves existing h2/h3 untouched", () => {
    const html = "<h2>A</h2><h3>B</h3>";
    expect(demoteBodyH1(html)).toBe(html);
  });

  it("returns the input unchanged when there is no h1", () => {
    expect(demoteBodyH1("<p>body</p>")).toBe("<p>body</p>");
  });

  it("handles empty input", () => {
    expect(demoteBodyH1("")).toBe("");
  });
});

describe("blog thumbnails", () => {
  it("builds a 16:9 Unsplash URL", () => {
    const url = thumbnailUrl("photo-123");
    expect(url).toContain("images.unsplash.com/photo-123");
    expect(url).toContain("w=1200");
    expect(url).toContain("h=675");
    expect(url).toContain("fit=crop");
  });

  it("only ever returns allow-listed Unsplash URLs", () => {
    const allowed = new Set(THUMBNAIL_PHOTOS.map((p) => thumbnailUrl(p.id)));
    const samples = [
      "virtual assistant growth",
      "customer support chatbot",
      "bilingual team onboarding",
      "",
      "zzzzz no keywords here",
    ];
    for (const sample of samples) {
      expect(allowed.has(pickFeaturedImage(sample))).toBe(true);
    }
  });

  it("matches a topical keyword over the default", () => {
    const customer = pickFeaturedImage("Improving customer support response times");
    expect(customer).toBe(thumbnailUrl("photo-1556745753-b2904692b3cd"));
  });

  it("is deterministic for the same input", () => {
    const text = "analytics dashboard reporting";
    expect(pickFeaturedImage(text)).toBe(pickFeaturedImage(text));
  });

  it("falls back to a default image when nothing matches", () => {
    expect(pickFeaturedImage("qqqq wwww")).toBe(thumbnailUrl(THUMBNAIL_PHOTOS[0]!.id));
  });

  it("lists every thumbnail for prompts", () => {
    const list = thumbnailPromptList();
    expect(list.split("\n")).toHaveLength(THUMBNAIL_PHOTOS.length);
    for (const photo of THUMBNAIL_PHOTOS) {
      expect(list).toContain(thumbnailUrl(photo.id));
    }
  });
});
