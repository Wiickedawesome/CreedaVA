import { describe, expect, it } from "vitest";
import { parseAiJson } from "@/lib/utils/ai-json";

describe("parseAiJson", () => {
  it("parses raw JSON", () => {
    expect(parseAiJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips markdown fences", () => {
    expect(parseAiJson<{ a: number }>('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("ignores prose around the payload", () => {
    expect(parseAiJson<{ a: number }>('Here you go:\n{"a":1}\nHope that helps!')).toEqual({
      a: 1,
    });
  });

  it("parses arrays", () => {
    expect(parseAiJson<string[]>('```json\n["a","b"]\n```')).toEqual(["a", "b"]);
  });

  it("keeps nested braces intact", () => {
    const payload = '{"content":"<p>a</p>","nested":{"b":2}}';
    expect(parseAiJson<{ nested: { b: number } }>(`Result: ${payload}`).nested.b).toBe(2);
  });

  it("throws when there is no JSON", () => {
    expect(() => parseAiJson("I cannot help with that.")).toThrow(/did not contain JSON/);
  });
});
