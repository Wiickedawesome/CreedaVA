import { describe, expect, it } from "vitest";
import {
  AI_TELLS,
  buildImagePrompt,
  buildSceneRequest,
  buildScreeningRequest,
  parseScreening,
} from "@/lib/utils/product-photography";

describe("buildImagePrompt", () => {
  it("keeps the scene and appends the style spec", () => {
    const prompt = buildImagePrompt("A worn oak desk by a window.");
    expect(prompt).toContain("A worn oak desk by a window.");
    expect(prompt).toContain("f/2.8");
    expect(prompt).toContain("natural light");
  });

  it("names the tells it wants avoided", () => {
    const prompt = buildImagePrompt("Anything");
    expect(prompt).toContain("Avoid absolutely");
    expect(prompt).toContain("holographic");
    expect(prompt).toContain("lettering, logo or watermark");
  });

  it("trims stray whitespace from the scene", () => {
    expect(buildImagePrompt("  desk  ")).toMatch(/^desk\n\n/);
  });
});

describe("buildSceneRequest", () => {
  const request = buildSceneRequest("Boost Growth with BI", "A summary.");

  it("carries the article's title and summary", () => {
    expect(request).toContain("Boost Growth with BI");
    expect(request).toContain("A summary.");
  });

  it("rules out people and screens", () => {
    // A convincing face reads as an invented client photo, which is the same
    // honesty problem as a fake testimonial.
    expect(request).toContain("No people, no hands, no faces");
    expect(request).toContain("No screens");
  });
});

describe("AI_TELLS", () => {
  it("are specific enough to act on", () => {
    expect(AI_TELLS.length).toBeGreaterThanOrEqual(8);
    for (const tell of AI_TELLS) {
      expect(tell.length).toBeGreaterThan(15);
    }
  });

  it("has no duplicates", () => {
    expect(new Set(AI_TELLS).size).toBe(AI_TELLS.length);
  });
});

describe("buildScreeningRequest", () => {
  it("lists every tell by number", () => {
    const request = buildScreeningRequest();
    AI_TELLS.forEach((tell, i) => {
      expect(request).toContain(`${i + 1}. ${tell}`);
    });
  });

  it("only accepts a clean verdict", () => {
    expect(buildScreeningRequest()).toContain(
      '"passes" is true only when you cannot name a tell',
    );
  });
});

describe("parseScreening", () => {
  it("accepts a passing verdict", () => {
    expect(parseScreening('{"passes": true, "tells": []}')).toEqual({
      passes: true,
      tells: [],
    });
  });

  it("accepts a failing verdict with reasons", () => {
    expect(
      parseScreening('{"passes": false, "tells": ["neon glow"]}'),
    ).toEqual({ passes: false, tells: ["neon glow"] });
  });

  it("reads JSON wrapped in prose", () => {
    const raw = 'Here is my verdict:\n{"passes": true, "tells": []}\nDone.';
    expect(parseScreening(raw).passes).toBe(true);
  });

  it("fails closed when there is no verdict", () => {
    // A broken screener must not become a rubber stamp.
    const result = parseScreening("I cannot tell.");
    expect(result.passes).toBe(false);
    expect(result.tells[0]).toContain("no verdict");
  });

  it("fails closed on malformed JSON", () => {
    const result = parseScreening("{passes: true}");
    expect(result.passes).toBe(false);
  });

  it("does not treat a truthy string as a pass", () => {
    expect(parseScreening('{"passes": "yes"}').passes).toBe(false);
  });

  it("drops non-string tells", () => {
    expect(parseScreening('{"passes": false, "tells": [1, "glow", null]}')).toEqual({
      passes: false,
      tells: ["glow"],
    });
  });
});
