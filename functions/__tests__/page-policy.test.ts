/**
 * Which checks apply to which page.
 *
 * Regression: one standard for every page reported `/contact` as thin at 154
 * words and fired FAQ/article schema advice on legal pages.
 */

import { describe, expect, test } from "vitest";
import { appliesToPage, pageKind } from "../src/seo/page-policy";

describe("pageKind", () => {
  test("treats a page written to be read as content", () => {
    expect(pageKind("/")).toBe("content");
    expect(pageKind("/about")).toBe("content");
    expect(pageKind("/services")).toBe("content");
  });

  test("treats a published post as an article", () => {
    expect(pageKind("/news/creedava-right-choice")).toBe("article");
    expect(pageKind("/news")).toBe("utility");
  });

  test("treats a form, index or legal page as utility", () => {
    expect(pageKind("/contact")).toBe("utility");
    expect(pageKind("/join")).toBe("utility");
    expect(pageKind("/news")).toBe("utility");
    expect(pageKind("/privacy")).toBe("utility");
    expect(pageKind("/terms")).toBe("utility");
    expect(pageKind("/faq")).toBe("utility");
  });

  test("treats a discussion thread as utility", () => {
    // User-generated: demanding six paragraphs from a visitor is not a fix.
    expect(pageKind("/forum")).toBe("utility");
    expect(pageKind("/forum/tPYg3AO5YiyhSeALm2t0")).toBe("utility");
  });
});

describe("appliesToPage", () => {
  test("withholds depth advice on a utility page", () => {
    for (const code of ["thin-content", "no-qa-blocks", "faq-schema-missing"]) {
      expect(appliesToPage(code, "/contact")).toBe(false);
    }
  });

  test("still reports defects on a utility page", () => {
    for (const code of ["title-missing", "meta-missing", "h1-missing", "canonical-missing"]) {
      expect(appliesToPage(code, "/contact")).toBe(true);
    }
  });

  test("reports everything on a content page", () => {
    expect(appliesToPage("thin-content", "/services")).toBe(true);
    expect(appliesToPage("no-qa-blocks", "/about")).toBe(true);
  });

  test("asks for Article schema only on an article", () => {
    // A pricing page describing itself as an Article is wrong, so the check
    // must not fire there — it did, on /, /about, /pricing and /services.
    expect(appliesToPage("article-schema-missing", "/pricing")).toBe(false);
    expect(appliesToPage("article-schema-missing", "/news/creedava-right-choice")).toBe(true);
  });
});
