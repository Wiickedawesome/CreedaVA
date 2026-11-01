/**
 * Parse the JSON payload out of an AI response.
 *
 * Models are told to return raw JSON, but they sometimes wrap it in markdown
 * fences or a sentence of prose. Try a direct parse first, then fall back to
 * the outermost `{...}` / `[...]` slice.
 *
 * Callers should surface the thrown error to the user rather than re-running
 * generation — a second call can't fix a malformed first response.
 */
export function parseAiJson<T = unknown>(raw: string): T {
  const cleaned = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start === -1 || end <= start) {
      throw new Error("AI response did not contain JSON");
    }
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  }
}
