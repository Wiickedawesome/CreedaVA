import { describe, expect, it } from "vitest";
import { PACKAGES_ANCHOR, SERVICE_ANCHORS } from "@/lib/constants/services";
import en from "@/lib/i18n/en";
import es from "@/lib/i18n/es";

describe("service anchors", () => {
  it("has a label for every anchor in both locales", () => {
    expect(en.footer.serviceLinks).toHaveLength(SERVICE_ANCHORS.length);
    expect(es.footer.serviceLinks).toHaveLength(SERVICE_ANCHORS.length);
  });

  it("keeps anchors unique so deep links resolve to one section", () => {
    expect(new Set(SERVICE_ANCHORS).size).toBe(SERVICE_ANCHORS.length);
    expect(SERVICE_ANCHORS).not.toContain(PACKAGES_ANCHOR);
  });

  it("gives every package a unique anchor id", () => {
    for (const locale of [en, es]) {
      const ids = locale.services.packages.items.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).not.toContain(PACKAGES_ANCHOR);
    }
  });
});
