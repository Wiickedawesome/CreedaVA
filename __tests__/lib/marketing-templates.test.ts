import { describe, expect, it } from "vitest";
import {
  EMPTY_COPY,
  FORMATS,
  FORMAT_IDS,
  LIMITS,
  TEMPLATES,
  TEMPLATE_IDS,
  isFormat,
  isTemplateId,
  marketingImageFilename,
  marketingImageUrl,
  type MarketingCopy,
} from "@/lib/brand/marketing-templates";

const FULL_COPY: MarketingCopy = {
  eyebrow: "Virtual assistants",
  headline: "Answer every call without hiring another person",
  supporting: "Trained, insured and online during your office hours.",
  items: ["Calls answered", "Bookings taken", "Follow-ups sent"],
  cta: "Book a call",
  footnote: "creedava.com",
};

describe("marketing templates", () => {
  it("gives every template a sample that fills its own fields", () => {
    for (const id of TEMPLATE_IDS) {
      const spec = TEMPLATES[id];
      expect(spec.fields.length).toBeGreaterThan(0);
      for (const field of spec.fields) {
        const sample = spec.sample[field];
        expect(Array.isArray(sample) ? sample.length > 0 : Boolean(sample)).toBe(
          true,
        );
      }
    }
  });

  it("keeps samples within the published limits", () => {
    for (const id of TEMPLATE_IDS) {
      const sample = TEMPLATES[id].sample;
      expect(sample.eyebrow?.length ?? 0).toBeLessThanOrEqual(LIMITS.eyebrow);
      expect(sample.headline?.length ?? 0).toBeLessThanOrEqual(LIMITS.headline);
      expect(sample.supporting?.length ?? 0).toBeLessThanOrEqual(LIMITS.supporting);
      expect(sample.cta?.length ?? 0).toBeLessThanOrEqual(LIMITS.cta);
      const items = sample.items ?? [];
      expect(items.length).toBeLessThanOrEqual(LIMITS.items);
      for (const item of items) {
        expect(item.length).toBeLessThanOrEqual(LIMITS.item);
      }
    }
  });

  it("exposes one size per canonical pixel dimension", () => {
    expect(FORMATS.square).toMatchObject({ width: 1080, height: 1080 });
    expect(FORMATS.portrait).toMatchObject({ width: 1080, height: 1350 });
    expect(FORMATS.story).toMatchObject({ width: 1080, height: 1920 });
    expect(FORMATS.wide).toMatchObject({ width: 1200, height: 630 });
    expect(FORMAT_IDS).toHaveLength(Object.keys(FORMATS).length);
  });
});

describe("marketingImageUrl", () => {
  it("encodes every supplied field", () => {
    const url = marketingImageUrl("list", "story", FULL_COPY);
    expect(url.startsWith("/api/brand/marketing?")).toBe(true);

    const params = new URL(url, "http://localhost").searchParams;
    expect(params.get("template")).toBe("list");
    expect(params.get("format")).toBe("story");
    expect(params.get("headline")).toBe(FULL_COPY.headline);
    expect(params.get("items")).toBe(FULL_COPY.items.join("\n"));
  });

  it("omits empty fields rather than sending blanks", () => {
    const params = new URL(
      marketingImageUrl("statement", "square", EMPTY_COPY),
      "http://localhost",
    ).searchParams;
    expect(params.get("supporting")).toBeNull();
    expect(params.get("items")).toBeNull();
  });
});

describe("guards", () => {
  it("accepts only known templates and sizes", () => {
    expect(isTemplateId("stat")).toBe(true);
    expect(isTemplateId("nope")).toBe(false);
    expect(isFormat("wide")).toBe(true);
    expect(isFormat("1080x1080")).toBe(false);
  });

  it("rejects inherited object keys", () => {
    // `value in TEMPLATES` would have accepted these and then read a function
    // as if it were a template.
    for (const key of ["toString", "constructor", "hasOwnProperty"]) {
      expect(isTemplateId(key)).toBe(false);
      expect(isFormat(key)).toBe(false);
    }
  });
});

describe("marketingImageFilename", () => {
  it("names the file after the template and its pixel size", () => {
    expect(marketingImageFilename("statement", "square")).toBe(
      "creedava-statement-1080x1080.png",
    );
    expect(marketingImageFilename("list", "wide")).toBe(
      "creedava-list-1200x630.png",
    );
  });
});
