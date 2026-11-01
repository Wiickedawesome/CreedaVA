import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("My New Post")).toBe("my-new-post");
  });

  it("drops punctuation and collapses separators", () => {
    expect(slugify("  CreedaVA: The Right Choice!  ")).toBe("creedava-the-right-choice");
  });

  it("strips accents", () => {
    expect(slugify("Café Señor")).toBe("cafe-senor");
  });

  it("limits length", () => {
    expect(slugify("a".repeat(200))).toHaveLength(80);
  });

  it("returns an empty string when nothing is usable", () => {
    expect(slugify("!!!")).toBe("");
  });
});
