import { describe, expect, it } from "vitest";
import { stripBrandDuplication } from "@/lib/utils/page-title";

describe("stripBrandDuplication", () => {
  it("removes a leading brand segment", () => {
    // The measured /faq case: the page-seo doc stored "CreedaVA — Faq" and the
    // layout template appended another "| CreedaVA".
    expect(stripBrandDuplication("CreedaVA — Faq")).toBe("Faq");
  });

  it("removes a trailing brand segment", () => {
    expect(stripBrandDuplication("Pricing | CreedaVA")).toBe("Pricing");
  });

  it("handles a hyphen separator with spaces", () => {
    expect(stripBrandDuplication("About - CreedaVA")).toBe("About");
  });

  it("leaves a title without the brand alone", () => {
    expect(stripBrandDuplication("Boost growth with BI")).toBe("Boost growth with BI");
  });

  it("does not strip the brand from the middle of a title", () => {
    expect(stripBrandDuplication("Why CreedaVA does this")).toBe("Why CreedaVA does this");
  });

  it("keeps the original when stripping would leave nothing", () => {
    expect(stripBrandDuplication("CreedaVA")).toBe("CreedaVA");
    expect(stripBrandDuplication("CreedaVA | CreedaVA")).toBe("CreedaVA");
  });
});
