import { describe, it, expect } from "vitest";
import {
  BRAND,
  FORMATS,
  FORMAT_IDS,
  LAYOUT_IDS,
  LIMITS,
  PLATFORMS,
  TONES,
  buildPhotoPrompt,
  buildPlanPrompt,
  creativeFilename,
  isFormat,
  isLayout,
  isPlatform,
  isTone,
  parsePlan,
  type Design,
} from "@/lib/brand/creative";

/** A complete design object, so each test overrides only what it cares about. */
function design(overrides: Record<string, unknown> = {}) {
  return {
    layout: "hero",
    eyebrow: "Coverage",
    headline: "Never miss another call",
    subhead: "Support that answers.",
    stat: "11 hrs",
    items: ["One", "Two", "Three"],
    cta: "Book a call",
    photoSource: "library",
    photoId: "photo-1556745753-b2904692b3cd",
    photoBrief: "",
    ...overrides,
  };
}

/** Wrap a design in the plan envelope the model is asked for. */
function plan(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    concept: "Missed calls cost law firms clients.",
    design: design(),
    captions: { facebook: "A caption.", linkedin: "", instagram: "" },
    hashtags: ["lawfirm", "#bilingual"],
    ...overrides,
  });
}

describe("guards", () => {
  it("accepts only known format ids", () => {
    for (const id of FORMAT_IDS) expect(isFormat(id)).toBe(true);
    expect(isFormat("square")).toBe(false);
    expect(isFormat("")).toBe(false);
    expect(isFormat("FEED")).toBe(false);
  });

  it("does not accept inherited object keys", () => {
    for (const key of ["constructor", "toString", "hasOwnProperty"]) {
      expect(isFormat(key)).toBe(false);
      expect(isLayout(key)).toBe(false);
    }
  });

  it("accepts only known layouts", () => {
    for (const id of LAYOUT_IDS) expect(isLayout(id)).toBe(true);
    expect(isLayout("carousel")).toBe(false);
  });

  it("accepts only known tones and platforms", () => {
    for (const tone of TONES) expect(isTone(tone.id)).toBe(true);
    for (const platform of PLATFORMS) expect(isPlatform(platform.id)).toBe(true);
    expect(isTone("sarcastic")).toBe(false);
    expect(isPlatform("tiktok")).toBe(false);
  });
});

describe("formats", () => {
  it("gives every format a canvas and a colon aspect ratio", () => {
    for (const id of FORMAT_IDS) {
      const spec = FORMATS[id];
      expect(spec.width).toBeGreaterThan(0);
      expect(spec.height).toBeGreaterThan(0);
      // The image API rejects the CSS slash form.
      expect(spec.aspectRatio).toMatch(/^\d+:\d+$/);
    }
  });

  it("matches each ratio to its canvas", () => {
    expect(FORMATS.feed.aspectRatio).toBe("1:1");
    expect(FORMATS.feed.width).toBe(FORMATS.feed.height);
    expect(FORMATS.portrait.aspectRatio).toBe("4:5");
    expect(FORMATS.portrait.height).toBeGreaterThan(FORMATS.portrait.width);
    expect(FORMATS.story.aspectRatio).toBe("9:16");
    expect(FORMATS.landscape.aspectRatio).toBe("16:9");
    expect(FORMATS.landscape.width).toBeGreaterThan(FORMATS.landscape.height);
  });
});

describe("buildPlanPrompt", () => {
  it("embeds the brief and the tone", () => {
    const prompt = buildPlanPrompt("Bilingual receptionists for law firms", "direct");
    expect(prompt).toContain("Bilingual receptionists for law firms");
    expect(prompt).toContain("direct");
  });

  it("carries the palette so the model does not invent one", () => {
    const prompt = buildPlanPrompt("A brief about coverage", "warm");
    expect(prompt).toContain(BRAND.green);
    expect(prompt).toContain(BRAND.ink);
  });

  it("forbids invented numbers and contact details", () => {
    const prompt = buildPlanPrompt("A brief about coverage", "warm");
    expect(prompt).toMatch(/never invent statistics/i);
    expect(prompt).toMatch(/phone number/i);
  });

  it("offers every layout and every curated photo id", () => {
    const prompt = buildPlanPrompt("A brief about coverage", "warm");
    for (const id of LAYOUT_IDS) expect(prompt).toContain(`- ${id}:`);
    expect(prompt).toContain("photo-1556745753-b2904692b3cd");
  });

  it("asks for JSON rather than prose", () => {
    expect(buildPlanPrompt("A brief", "warm")).toMatch(/ONLY valid JSON/);
  });
});

describe("parsePlan", () => {
  it("reads a bare JSON object", () => {
    const parsed = parsePlan(plan());
    expect(parsed).not.toBeNull();
    expect(parsed?.design.headline).toBe("Never miss another call");
    expect(parsed?.design.layout).toBe("hero");
  });

  it("reads a fenced JSON block", () => {
    expect(parsePlan("```json\n" + plan() + "\n```")).not.toBeNull();
  });

  it("ignores prose around the object", () => {
    expect(parsePlan(`Here is the post:\n${plan()}\nHope that helps!`)).not.toBeNull();
  });

  it("rejects replies that are not JSON", () => {
    expect(parsePlan("I cannot help with that.")).toBeNull();
    expect(parsePlan("")).toBeNull();
    expect(parsePlan("{ broken")).toBeNull();
  });

  it("rejects a plan with no headline", () => {
    expect(parsePlan(plan({ design: design({ headline: "   " }) }))).toBeNull();
  });

  it("rejects a plan with no captions at all", () => {
    expect(
      parsePlan(plan({ captions: { facebook: "", linkedin: "", instagram: "" } })),
    ).toBeNull();
  });

  it("keeps a plan that has only one caption", () => {
    const parsed = parsePlan(plan({ captions: { instagram: "Just this one." } }));
    expect(parsed?.captions.instagram).toBe("Just this one.");
    expect(parsed?.captions.facebook).toBe("");
  });

  it("clamps overlong text to the renderer's limits", () => {
    const parsed = parsePlan(
      plan({
        concept: "x".repeat(LIMITS.concept + 200),
        design: design({ headline: "y".repeat(LIMITS.headline + 200) }),
      }),
    );
    expect(parsed?.concept).toHaveLength(LIMITS.concept);
    expect(parsed?.design.headline).toHaveLength(LIMITS.headline);
  });

  it("strips leading hashes and spaces from hashtags", () => {
    const parsed = parsePlan(
      plan({ hashtags: ["#lawfirm", " legal marketing ", "", 3, "###bilingual"] }),
    );
    expect(parsed?.hashtags).toEqual(["lawfirm", "legalmarketing", "bilingual"]);
  });

  it("caps the hashtag list", () => {
    const many = Array.from({ length: 30 }, (_, i) => `tag${i}`);
    expect(parsePlan(plan({ hashtags: many }))?.hashtags).toHaveLength(
      LIMITS.hashtags,
    );
  });

  it("falls back to a quote when no layout is named", () => {
    const parsed = parsePlan(plan({ design: design({ layout: "carousel" }) }));
    expect(parsed?.design.layout).toBe("quote");
  });
});

describe("parsePlan layout downgrades", () => {
  it("turns a stat with no figure into a quote", () => {
    const parsed = parsePlan(plan({ design: design({ layout: "stat", stat: "" }) }));
    expect(parsed?.design.layout).toBe("quote");
  });

  it("keeps a stat that has a figure", () => {
    const parsed = parsePlan(plan({ design: design({ layout: "stat", stat: "11 hrs" }) }));
    expect(parsed?.design.layout).toBe("stat");
    expect(parsed?.design.stat).toBe("11 hrs");
  });

  it("turns a list with fewer than two points into a quote", () => {
    const parsed = parsePlan(
      plan({ design: design({ layout: "list", items: ["Only one"] }) }),
    );
    expect(parsed?.design.layout).toBe("quote");
  });

  it("keeps a list with two points", () => {
    const parsed = parsePlan(
      plan({ design: design({ layout: "list", items: ["One", "Two"] }) }),
    );
    expect(parsed?.design.layout).toBe("list");
  });

  it("drops non-string list entries", () => {
    const parsed = parsePlan(
      plan({ design: design({ layout: "list", items: ["One", 2, null, "Two"] }) }),
    );
    expect(parsed?.design.items).toEqual(["One", "Two"]);
  });

  it("forces a quote to type alone", () => {
    const parsed = parsePlan(
      plan({ design: design({ layout: "quote", photoSource: "library" }) }),
    );
    expect(parsed?.design.photoSource).toBe("none");
    expect(parsed?.design.photoId).toBe("");
  });
});

describe("parsePlan photo resolution", () => {
  it("keeps a known library photo", () => {
    const parsed = parsePlan(plan());
    expect(parsed?.design.photoSource).toBe("library");
    expect(parsed?.design.photoId).toBe("photo-1556745753-b2904692b3cd");
  });

  it("draws the scene when the id is unknown but a brief exists", () => {
    const parsed = parsePlan(
      plan({
        design: design({
          photoId: "photo-does-not-exist",
          photoBrief: "A tidy reception desk at dawn.",
        }),
      }),
    );
    expect(parsed?.design.photoSource).toBe("custom");
    expect(parsed?.design.photoBrief).toBe("A tidy reception desk at dawn.");
    expect(parsed?.design.photoId).toBe("");
  });

  it("drops the photo when the id is unknown and no brief exists", () => {
    const parsed = parsePlan(
      plan({ design: design({ photoId: "photo-does-not-exist" }) }),
    );
    expect(parsed?.design.photoSource).toBe("none");
  });

  it("drops a custom source that has nothing to draw", () => {
    const parsed = parsePlan(
      plan({ design: design({ photoSource: "custom", photoBrief: "" }) }),
    );
    expect(parsed?.design.photoSource).toBe("none");
  });

  it("treats an unknown photo source as a library request", () => {
    const parsed = parsePlan(plan({ design: design({ photoSource: "stock" }) }));
    expect(parsed?.design.photoSource).toBe("library");
  });

  it("clears the photo brief when the photo is not custom", () => {
    const parsed = parsePlan(
      plan({ design: design({ photoSource: "library", photoBrief: "ignored" }) }),
    );
    expect(parsed?.design.photoBrief).toBe("");
  });
});

describe("buildPhotoPrompt", () => {
  const custom: Design = {
    layout: "hero",
    eyebrow: "",
    headline: "Never miss another call",
    subhead: "",
    stat: "",
    items: [],
    cta: "",
    photoSource: "custom",
    photoId: "",
    photoBrief: "A tidy reception desk at dawn.",
  };

  it("describes the scene and the canvas", () => {
    const prompt = buildPhotoPrompt(custom, "portrait");
    expect(prompt).toContain("A tidy reception desk at dawn.");
    expect(prompt).toContain(`${FORMATS.portrait.width} by ${FORMATS.portrait.height}`);
    expect(prompt).toContain(FORMATS.portrait.aspectRatio);
  });

  it("asks for no lettering, since the renderer sets every word", () => {
    const prompt = buildPhotoPrompt(custom, "feed");
    expect(prompt).toMatch(/no text, letters/i);
    expect(prompt).toMatch(/logos/i);
  });

  it("asks for no recognisable person", () => {
    expect(buildPhotoPrompt(custom, "feed")).toMatch(/no recognisable real person/i);
  });
});

describe("creativeFilename", () => {
  it("names the format and the true canvas size", () => {
    expect(creativeFilename("story")).toBe("creedava-story-1080x1920-1.png");
    expect(creativeFilename("landscape")).toBe("creedava-landscape-1200x630-1.png");
  });

  it("numbers exports from one", () => {
    expect(creativeFilename("feed", 0)).toContain("-1.png");
    expect(creativeFilename("feed", 2)).toContain("-3.png");
  });
});
