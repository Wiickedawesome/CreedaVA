import { describe, expect, it } from "vitest";

import {
  DEFAULT_CARD_PATH,
  SOCIAL_CARDS,
  SITE_ORIGIN,
  socialCardFor,
  socialCardUrl,
} from "@/lib/brand/social-cards";

describe("social cards", () => {
  it("has a default card every route can fall back to", () => {
    expect(SOCIAL_CARDS[DEFAULT_CARD_PATH]).toBeDefined();
    expect(socialCardFor("/privacy")).toBe(SOCIAL_CARDS[DEFAULT_CARD_PATH]);
  });

  it("keys every card by an absolute path", () => {
    for (const path of Object.keys(SOCIAL_CARDS)) {
      expect(path.startsWith("/")).toBe(true);
    }
  });

  it("keeps copy short enough for the card", () => {
    // The headline renders at 62px in a 940px column. Past roughly 75
    // characters it needs a third line and collides with the rule.
    for (const [path, card] of Object.entries(SOCIAL_CARDS)) {
      expect(card.headline.length, `${path} headline`).toBeLessThanOrEqual(75);
      expect(card.footnote.length, `${path} footnote`).toBeLessThanOrEqual(70);
      expect(card.alt.length, `${path} alt`).toBeGreaterThan(10);
    }
  });

  it("points registered pages at their own card", () => {
    expect(socialCardUrl("/services")).toBe(`${SITE_ORIGIN}/share/services`);
    expect(socialCardUrl("/pricing")).toBe(`${SITE_ORIGIN}/share/pricing`);
  });

  it("points the default and unregistered pages at /share", () => {
    expect(socialCardUrl("/")).toBe(`${SITE_ORIGIN}/share`);
    // Not registered: nothing shares a privacy policy, so it takes the default.
    expect(socialCardUrl("/privacy")).toBe(`${SITE_ORIGIN}/share`);
    expect(socialCardUrl("/news/some-post")).toBe(`${SITE_ORIGIN}/share`);
  });
});
