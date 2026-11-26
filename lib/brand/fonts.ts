import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The fonts the creative renderer draws with.
 *
 * Satori cannot read `.woff2` — the only format Next produces for `next/font` —
 * so the renderer needs real TTF files of its own. They live in `public/fonts`
 * because that directory is guaranteed to be present at runtime, and only the
 * three weights the compositions actually use are bundled.
 */

export const RENDER_FONT_FAMILY = "Roboto";

/** Only weights that are bundled may be used in `fontWeight`. */
const WEIGHTS = [400, 700, 900] as const;

export interface RenderFont {
  name: string;
  data: Buffer;
  weight: (typeof WEIGHTS)[number];
  style: "normal";
}

async function load(): Promise<RenderFont[]> {
  const dir = path.join(process.cwd(), "public", "fonts");
  return Promise.all(
    WEIGHTS.map(async (weight) => ({
      name: RENDER_FONT_FAMILY,
      data: await readFile(path.join(dir, `Roboto-${weight}.ttf`)),
      weight,
      style: "normal" as const,
    })),
  );
}

let cached: Promise<RenderFont[]> | null = null;

/**
 * Read the bundled fonts once per process.
 *
 * A rejected load clears the cache so a transient filesystem error does not
 * poison every later render.
 */
export function renderFonts(): Promise<RenderFont[]> {
  cached ??= load().catch((err: unknown) => {
    cached = null;
    throw err;
  });
  return cached;
}
