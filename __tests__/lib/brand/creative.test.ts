import { describe, expect, it } from "vitest";
import {
  FORMATS,
  FORMAT_IDS,
  LIMITS,
  PLATFORMS,
  buildImagePrompt,
  buildPlanPrompt,
  creativeFilename,
  isFormat,
  isPlatform,
  isTone,
  parsePlan,
} from "@/lib/brand/creative";

const VALID = JSON.stringify({
  concept: "After-hours calls answered",
  imagePrompt: "A calm evening desk, phone off the hook, soft window light.",
  onImageText: "No missed calls",
  captions: {
    facebook: "Your phone rings after five.",
    linkedin: "After-hours coverage without a night shift.",
    instagram: "Nobody misses a call now.",
  },
  hashtags: ["#virtualassistant", "bilingual", "smallbusiness"],
});

describe("parsePlan", () => {
  it("reads a plain JSON reply", () => {
    const plan = parsePlan(VALID);
    expect(plan?.concept).toBe("After-hours calls answered");
    expect(plan?.onImageText).toBe("No missed calls");
    expect(plan?.captions.linkedin).toContain("After-hours");
  });

  it("reads a reply wrapped in a markdown fence", () => {
    const plan = parsePlan("Here you go:\n```json\n" + VALID + "\n```\nEnjoy!");
    expect(plan?.imagePrompt).toContain("evening desk");
  });

  it("strips the hash a model adds to hashtags", () => {
    expect(parsePlan(VALID)?.hashtags).toEqual([
      "virtualassistant",
      "bilingual",
      "smallbusiness",
    ]);
  });

  it("caps the hashtag list rather than trusting its length", () => {
    const many = JSON.stringify({
      ...JSON.parse(VALID),
      hashtags: Array.from({ length: 40 }, (_, i) => `tag${i}`),
    });
    expect(parsePlan(many)?.hashtags).toHaveLength(LIMITS.hashtags);
  });

  it("rejects a reply with no image prompt", () => {
    const missing = JSON.stringify({ ...JSON.parse(VALID), imagePrompt: "" });
    expect(parsePlan(missing)).toBeNull();
  });

  it("rejects a reply with no caption anywhere", () => {
    const silent = JSON.stringify({
      ...JSON.parse(VALID),
      captions: { facebook: "", linkedin: "", instagram: "" },
    });
    expect(parsePlan(silent)).toBeNull();
  });

  it("rejects prose and malformed JSON instead of guessing", () => {
    expect(parsePlan("I would make a nice picture of a desk.")).toBeNull();
    expect(parsePlan("{\"concept\": ")).toBeNull();
  });

  it("clamps oversized strings", () => {
    const huge = JSON.stringify({
      ...JSON.parse(VALID),
      onImageText: "x".repeat(LIMITS.onImageText + 200),
    });
    expect(parsePlan(huge)?.onImageText).toHaveLength(LIMITS.onImageText);
  });
});

describe("buildPlanPrompt", () => {
  it("carries the brief and tone and forbids invented numbers", () => {
    const prompt = buildPlanPrompt("New bilingual phone line", "direct");
    expect(prompt).toContain("New bilingual phone line");
    expect(prompt).toContain("direct");
    expect(prompt).toMatch(/never invent statistics/i);
  });

  it("reserves the same corner the composer places the mark in", () => {
    // A plan that reserves the top-right while the composer writes lower-left
    // gives the model two contradictory instructions.
    expect(buildPlanPrompt("x", "warm")).toMatch(/lower-left corner/i);
    expect(buildImagePrompt({ imagePrompt: "x", onImageText: "" }, "feed")).toMatch(
      /lower-left corner/i,
    );
  });
});

describe("buildImagePrompt", () => {
  it("quotes the on-image words exactly and forbids others", () => {
    const prompt = buildImagePrompt(
      { imagePrompt: "A desk", onImageText: "No missed calls" },
      "feed",
    );
    expect(prompt).toContain('"No missed calls"');
    expect(prompt).toMatch(/every other piece of text must be omitted/i);
  });

  it("asks for no text when there are no on-image words", () => {
    const prompt = buildImagePrompt(
      { imagePrompt: "A desk", onImageText: "" },
      "story",
    );
    expect(prompt).toMatch(/contains no words/i);
  });

  it("pins the aspect ratio the API accepts", () => {
    for (const id of FORMAT_IDS) {
      const prompt = buildImagePrompt({ imagePrompt: "x", onImageText: "" }, id);
      expect(prompt).toContain(FORMATS[id].aspectRatio);
      expect(prompt).toContain(`${FORMATS[id].width}`);
      expect(FORMATS[id].aspectRatio).toMatch(/^\d+:\d+$/);
    }
  });

  it("tells the model the mark is attached and must be reproduced as-is", () => {
    const prompt = buildImagePrompt({ imagePrompt: "x", onImageText: "" }, "feed");
    expect(prompt).toMatch(/reference image of the CreedaVA mark is attached/i);
    expect(prompt).toMatch(/do not redraw it/i);
  });

  it("forbids typesetting the brand name, which is where lettering fails", () => {
    const prompt = buildImagePrompt({ imagePrompt: "x", onImageText: "" }, "feed");
    expect(prompt).toMatch(/do not typeset the brand name beside it/i);
  });

  it("forbids contact details, which would go stale inside an image", () => {
    const prompt = buildImagePrompt({ imagePrompt: "x", onImageText: "" }, "feed");
    expect(prompt).toMatch(/phone numbers, email addresses, URLs/i);
  });
});

describe("guards", () => {
  it("accepts only known formats, tones and platforms", () => {
    expect(isFormat("story")).toBe(true);
    expect(isFormat("1080x1080")).toBe(false);
    expect(isTone("playful")).toBe(true);
    expect(isTone("sassy")).toBe(false);
    expect(isPlatform("linkedin")).toBe(true);
    expect(isPlatform("tiktok")).toBe(false);
  });

  it("rejects inherited object keys", () => {
    for (const key of ["toString", "constructor"]) {
      expect(isFormat(key)).toBe(false);
      expect(isTone(key)).toBe(false);
      expect(isPlatform(key)).toBe(false);
    }
  });

  it("offers a caption tab for every platform the prompt asks about", () => {
    expect(PLATFORMS.map((platform) => platform.id)).toEqual([
      "facebook",
      "linkedin",
      "instagram",
    ]);
  });
});

describe("creativeFilename", () => {
  it("names the file by format, without claiming a pixel size", () => {
    expect(creativeFilename("feed", 0)).toBe("creedava-feed-1.png");
    expect(creativeFilename("landscape", 1)).toBe("creedava-landscape-2.png");
  });
});
