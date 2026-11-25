/**
 * The rule that decides whether a brief may become a blog post.
 *
 * This exists because it got this wrong once, expensively: the content writer
 * created five blog drafts that duplicated existing pages, and one of them was
 * published and competed with /contact. See `canComposeBlogDraft()`.
 */

import { describe, expect, it } from "vitest";
import { canComposeBlogDraft } from "../src/seo/content-writer";

const brief = (over: Record<string, unknown> = {}) => ({
  id: "brief_x",
  ...over,
});

describe("canComposeBlogDraft", () => {
  it("accepts a striking-distance keyword", () => {
    expect(
      canComposeBlogDraft(brief({ type: "striking-distance", keyword: "virtual assistant pricing" })),
    ).toBe(true);
  });

  it("accepts a brief with no type when the keyword is a real query", () => {
    // Older briefs predate the `type` field.
    expect(canComposeBlogDraft(brief({ keyword: "bookkeeping services" }))).toBe(true);
  });

  it("rejects thin-content briefs, whose keyword is a page path", () => {
    // The synthesizer writes `keyword: pathKey` for these. Feeding "/contact"
    // to Gemini as a topic is what produced the duplicate article.
    expect(canComposeBlogDraft(brief({ type: "expand-thin-content", keyword: "/contact" }))).toBe(
      false,
    );
  });

  it("rejects competitor-gap briefs, which also describe an existing page", () => {
    expect(canComposeBlogDraft(brief({ type: "competitor-gap", keyword: "va services" }))).toBe(
      false,
    );
  });

  it("rejects any brief whose keyword is a route path, even untyped", () => {
    // Belt and braces for a future brief type nobody classified.
    expect(canComposeBlogDraft(brief({ keyword: "/services" }))).toBe(false);
  });

  it("rejects a brief that already produced a draft", () => {
    expect(
      canComposeBlogDraft(brief({ type: "striking-distance", keyword: "va", blogId: "some-post" })),
    ).toBe(false);
  });

  it("rejects a brief with no keyword", () => {
    expect(canComposeBlogDraft(brief({ type: "striking-distance" }))).toBe(false);
    expect(canComposeBlogDraft(brief({ type: "striking-distance", keyword: "" }))).toBe(false);
  });

  it("stops retrying once the attempt cap is reached", () => {
    expect(
      canComposeBlogDraft(brief({ type: "striking-distance", keyword: "va", draftAttempts: 2 })),
    ).toBe(true);
    expect(
      canComposeBlogDraft(brief({ type: "striking-distance", keyword: "va", draftAttempts: 3 })),
    ).toBe(false);
  });
});
