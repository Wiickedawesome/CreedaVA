import { describe, it, expect } from "vitest";
import {
  BRAND,
  FORMATS,
  FORMAT_IDS,
  LAYOUT_IDS,
  LIMITS,
  buildPhotoPrompt,
  buildPlanPrompt,
  creativeFilename,
  isFormat,
  isLayout,
  parsePlan,
  type Design,
} from "@/lib/brand/creative";

const KNOWN_PHOTO = "photo-1556745753-b2904692b3cd";

/** A complete design object, so each test overrides only what it cares about. */
function design(overrides: Record<string, unknown> = {}) {
  return {
    layout: "hero",
    eyebrow: "Coverage",
    headline: "Never miss another call",
    subhead: "Support that answers.",
    cta: "Book a call",
    photoSource: "library",
    photoId: KNOWN_PHOTO,
    photoBrief: "",
    ...overrides,
  };
}

/** Wrap a design in the plan envelope the model is asked for. */
function plan(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    concept: "Missed calls cost law firms clients.",
    design: design(),
    caption: "A caption.",
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

  it("offers no layout without a photo", () => {
    expect(LAYOUT_IDS).toEqual(["hero", "band", "split"]);
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
  it("embeds the brief", () => {
    const prompt = buildPlanPrompt("Bilingual receptionists for law firms");
    expect(prompt).toContain("Bilingual receptionists for law firms");
  });

  it("carries the palette so the model does not invent one", () => {
    const prompt = buildPlanPrompt("A brief about coverage");
    expect(prompt).toContain(BRAND.green);
    expect(prompt).toContain(BRAND.ink);
  });

  it("forbids invented numbers and contact details", () => {
    const prompt = buildPlanPrompt("A brief about coverage");
    expect(prompt).toMatch(/never invent statistics/i);
    expect(prompt).toMatch(/phone number/i);
  });

  it("asks for a short headline and no bullet lists", () => {
    const prompt = buildPlanPrompt("A brief about coverage");
    expect(prompt).toContain(String(LIMITS.headline));
    expect(prompt).toMatch(/no bullet lists/i);
  });

  it("requires a photo and offers every curated id", () => {
    const prompt = buildPlanPrompt("A brief about coverage");
    expect(prompt).toMatch(/every design has a photo/i);
    expect(prompt).toContain(KNOWN_PHOTO);
  });

  it("offers every layout and every curated photo id", () => {
    const prompt = buildPlanPrompt("A brief about coverage");
    for (const id of LAYOUT_IDS) expect(prompt).toContain(`- ${id}:`);
  });

  it("asks for JSON rather than prose", () => {
    expect(buildPlanPrompt("A brief")).toMatch(/ONLY valid JSON/);
  });
});

describe("parsePlan", () => {
  it("reads a bare JSON object", () => {
    const parsed = parsePlan(plan());
    expect(parsed).not.toBeNull();
    expect(parsed?.design.headline).toBe("Never miss another call");
    expect(parsed?.design.layout).toBe("hero");
    expect(parsed?.caption).toBe("A caption.");
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

  it("rejects a plan with no caption", () => {
    expect(parsePlan(plan({ caption: "   " }))).toBeNull();
  });

  it("clamps overlong text to the renderer's limits", () => {
    const parsed = parsePlan(
      plan({
        concept: "x".repeat(LIMITS.concept + 200),
        caption: "c".repeat(LIMITS.caption + 200),
        design: design({ headline: "y".repeat(LIMITS.headline + 200) }),
      }),
    );
    expect(parsed?.concept).toHaveLength(LIMITS.concept);
    expect(parsed?.caption).toHaveLength(LIMITS.caption);
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

  it("falls back to a photo-led layout when none is named", () => {
    const parsed = parsePlan(plan({ design: design({ layout: "carousel" }) }));
    expect(parsed?.design.layout).toBe("hero");
  });
});

describe("parsePlan photo resolution", () => {
  it("keeps a known library photo", () => {
    const parsed = parsePlan(plan());
    expect(parsed?.design.photoSource).toBe("library");
    expect(parsed?.design.photoId).toBe(KNOWN_PHOTO);
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

  it("stays on a drawn scene when the id is unknown and no brief exists", () => {
    const parsed = parsePlan(
      plan({ design: design({ photoId: "photo-does-not-exist" }) }),
    );
    expect(parsed?.design.photoSource).toBe("custom");
    expect(parsed?.design.photoBrief).toBe("");
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
