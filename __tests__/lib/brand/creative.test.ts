import { describe, it, expect } from "vitest";
import {
  FORMATS,
  FORMAT_IDS,
  LAYOUT_IDS,
  LAYOUTS,
  LIMITS,
  PALETTE_IDS,
  PALETTES,
  buildPhotoPrompt,
  buildPlanPrompt,
  chooseStyle,
  creativeFilename,
  isAlign,
  isAnchor,
  isFormat,
  isLayout,
  isPalette,
  parsePlan,
  type Design,
} from "@/lib/brand/creative";

const KNOWN_PHOTO = "photo-1556745753-b2904692b3cd";

/** A complete design object, so each test overrides only what it cares about. */
function design(overrides: Record<string, unknown> = {}) {
  return {
    frame: "overlay",
    palette: "noir",
    anchor: "bottom",
    align: "left",
    eyebrow: "Coverage",
    headline: "Never miss another call",
    subhead: "Support that answers.",
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

  it("accepts only known palettes, anchors and alignments", () => {
    for (const id of PALETTE_IDS) expect(isPalette(id)).toBe(true);
    expect(isPalette("neon")).toBe(false);
    expect(isAnchor("top")).toBe(true);
    expect(isAnchor("sideways")).toBe(false);
    expect(isAlign("center")).toBe(true);
    expect(isAlign("right")).toBe(false);
  });

  it("offers no layout without a photo", () => {
    for (const id of LAYOUT_IDS) expect(LAYOUTS[id]).toMatch(/photo/);
  });

  it("gives every palette a field, a readable type colour and an accent", () => {
    for (const id of PALETTE_IDS) {
      const palette = PALETTES[id];
      for (const value of [palette.field, palette.type, palette.accent]) {
        expect(value).toMatch(/^#[0-9A-F]{6}$/i);
      }
      expect(palette.field).not.toBe(palette.type);
    }
  });

  it("varies the ground colour rather than reusing one brand colour", () => {
    const fields = new Set(PALETTE_IDS.map((id) => PALETTES[id].field));
    expect(fields.size).toBe(PALETTE_IDS.length);
    expect(PALETTE_IDS.length).toBeGreaterThanOrEqual(6);
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

  it("tells the model the frame and palette are not its call", () => {
    const prompt = buildPlanPrompt("A brief about coverage");
    expect(prompt).toMatch(/set by the art director, not by you/i);
    for (const id of PALETTE_IDS) expect(prompt).not.toContain(`- ${id}:`);
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

  it("asks for no buttons, since a rendered control cannot be pressed", () => {
    expect(buildPlanPrompt("A brief about coverage")).toMatch(/no buttons/i);
  });

  it("offers every curated photo id", () => {
    expect(buildPlanPrompt("A brief about coverage")).toContain(KNOWN_PHOTO);
  });

  it("warns against forcing an office photo onto an unrelated subject", () => {
    expect(buildPlanPrompt("A brief about coverage")).toMatch(
      /do not force an office photo/i,
    );
  });

  it("does not ask the model to pick a frame", () => {
    const prompt = buildPlanPrompt("A brief about coverage");
    for (const id of LAYOUT_IDS) expect(prompt).not.toContain(`\"frame\": \"${id}`);
  });

  it("asks for JSON rather than prose", () => {
    expect(buildPlanPrompt("A brief")).toMatch(/ONLY valid JSON/);
  });
});

describe("chooseStyle", () => {
  it("returns a known frame and a known palette", () => {
    for (const brief of ["a", "hiring", "thanksgiving", "pricing page"]) {
      const style = chooseStyle(brief);
      expect(isLayout(style.frame)).toBe(true);
      expect(isPalette(style.palette)).toBe(true);
    }
  });

  it("spreads different briefs over more than one frame", () => {
    const frames = new Set(
      Array.from({ length: 40 }, (_, i) => chooseStyle(`brief number ${i}`).frame),
    );
    expect(frames.size).toBeGreaterThan(1);
  });

  it("spreads different briefs over more than one palette", () => {
    const palettes = new Set(
      Array.from({ length: 40 }, (_, i) => chooseStyle(`brief number ${i}`).palette),
    );
    expect(palettes.size).toBeGreaterThan(1);
  });

  it("avoids repeating the previous frame when re-rolling", () => {
    const previous = { frame: "overlay" as const, palette: "brand" as const };
    for (let i = 0; i < 25; i += 1) {
      const style = chooseStyle("same brief every time", previous);
      expect(style.frame).not.toBe(previous.frame);
    }
  });

  it("avoids repeating the previous palette when re-rolling", () => {
    const previous = { frame: "split" as const, palette: "noir" as const };
    for (let i = 0; i < 25; i += 1) {
      const style = chooseStyle("same brief every time", previous);
      expect(style.palette).not.toBe(previous.palette);
    }
  });
});

describe("parsePlan", () => {
  it("reads a bare JSON object", () => {
    const parsed = parsePlan(plan());
    expect(parsed).not.toBeNull();
    expect(parsed?.design.headline).toBe("Never miss another call");
    expect(parsed?.design.frame).toBe("overlay");
    expect(parsed?.design.palette).toBe("noir");
    expect(parsed?.design.anchor).toBe("bottom");
    expect(parsed?.design.align).toBe("left");
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

  it("falls back to a photo-led frame when none is named", () => {
    const parsed = parsePlan(plan({ design: design({ frame: "carousel" }) }));
    expect(parsed?.design.frame).toBe("overlay");
  });

  it("falls back on an unknown palette, anchor or alignment", () => {
    const parsed = parsePlan(
      plan({ design: design({ palette: "neon", anchor: "sideways", align: "right" }) }),
    );
    expect(parsed?.design.palette).toBe("brand");
    expect(parsed?.design.anchor).toBe("bottom");
    expect(parsed?.design.align).toBe("left");
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
    frame: "overlay",
    palette: "noir",
    anchor: "bottom",
    align: "left",
    eyebrow: "",
    headline: "Never miss another call",
    subhead: "",
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
