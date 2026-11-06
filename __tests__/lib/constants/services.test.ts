import { describe, expect, it } from "vitest";
import { INDUSTRIES, PRICING_PATH, SERVICE_ANCHORS } from "@/lib/constants/services";
import en from "@/lib/i18n/en";
import es from "@/lib/i18n/es";

describe("service anchors", () => {
  it("has a label for every anchor in both locales", () => {
    expect(en.footer.serviceLinks).toHaveLength(SERVICE_ANCHORS.length);
    expect(es.footer.serviceLinks).toHaveLength(SERVICE_ANCHORS.length);
  });

  it("keeps anchors unique so deep links resolve to one section", () => {
    expect(new Set(SERVICE_ANCHORS).size).toBe(SERVICE_ANCHORS.length);
  });

  // /services pairs categories with anchors by index, and the booking form
  // mirrors the categories — a count mismatch silently drops a section id.
  it("keeps each locale's category list aligned with the anchors", () => {
    expect(en.services.categories).toHaveLength(SERVICE_ANCHORS.length);
    expect(es.services.categories).toHaveLength(SERVICE_ANCHORS.length);
  });

  it("gives every package a unique anchor id", () => {
    for (const locale of [en, es]) {
      const ids = locale.services.packages.items.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  // Packages moved off /services onto their own route, so no service anchor may
  // collide with it and the pricing path must not be a fragment.
  it("keeps the pricing route separate from the service anchors", () => {
    expect(PRICING_PATH).toBe("/pricing");
    expect(SERVICE_ANCHORS.some((anchor) => PRICING_PATH.includes(anchor))).toBe(false);
  });
});

describe("industries", () => {
  // The industry cards deep-link into the service grid by anchor id, so an
  // anchor that is not in SERVICE_ANCHORS is a dead link with no compile error
  // to catch it.
  it("links only to anchors that exist in the grid", () => {
    const known = new Set<string>(SERVICE_ANCHORS);

    for (const industry of INDUSTRIES) {
      expect(industry.anchors.length).toBeGreaterThan(0);
      for (const anchor of industry.anchors) {
        expect(known.has(anchor)).toBe(true);
      }
    }
  });

  // The card renders `copy.industries[index]` by position, so a count mismatch
  // silently drops a card or renders one with no copy.
  it("has a copy entry for every industry in both locales", () => {
    expect(en.services.industries).toHaveLength(INDUSTRIES.length);
    expect(es.services.industries).toHaveLength(INDUSTRIES.length);
  });

  // Every service must be reachable from the industries band. Adding a service to
  // SERVICE_ANCHORS without giving it a sector silently hides it from the band
  // while its card still renders below — the reader sees 13 services in the grid
  // and 12 accounted for above, with no error to explain the gap.
  it("covers every service with at least one sector", () => {
    const covered = new Set(INDUSTRIES.flatMap((industry) => [...industry.anchors]));
    const uncovered = SERVICE_ANCHORS.filter((anchor) => !covered.has(anchor));

    expect(uncovered).toEqual([]);
  });

  it("keeps industry ids unique so React keys stay stable", () => {
    const ids = INDUSTRIES.map((industry) => industry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
