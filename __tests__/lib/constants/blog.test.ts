import { describe, expect, it } from "vitest";

import { BLOG_AUTHOR, blogAuthorName } from "@/lib/constants/blog";

describe("blog byline", () => {
  it("is the team", () => {
    expect(BLOG_AUTHOR).toBe("CreedaVA Team");
  });

  it("replaces the label older drafts were stored with", () => {
    // Posts written before the rename are still in Firestore as "SEO Agent".
    expect(blogAuthorName("SEO Agent")).toBe(BLOG_AUTHOR);
    expect(blogAuthorName("seo-agent")).toBe(BLOG_AUTHOR);
  });

  it("falls back to the team when no author is stored", () => {
    // Admin-created posts never set an author field.
    expect(blogAuthorName(undefined)).toBe(BLOG_AUTHOR);
    expect(blogAuthorName("")).toBe(BLOG_AUTHOR);
    expect(blogAuthorName("   ")).toBe(BLOG_AUTHOR);
  });

  it("keeps a real name that was set by hand", () => {
    expect(blogAuthorName("John Smith")).toBe("John Smith");
    expect(blogAuthorName("  John Smith  ")).toBe("John Smith");
  });
});
