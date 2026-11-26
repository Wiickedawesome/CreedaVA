import fs from "node:fs";
import path from "node:path";

/** Brand green — the mark's gradient is flattened to this. */
export const BRAND_GREEN = "#005148";
/** Paper cream, used when the mark sits on a dark panel. */
export const BRAND_CREAM = "#F7F7F2";

/**
 * The C mark as an inline data URL, drawable inside `ImageResponse`.
 *
 * Read from disk rather than fetched: `ImageResponse` has no request context to
 * resolve a relative URL against, and the public file is only available to the
 * build as a traced asset.
 *
 * The source SVG paints `fill="url(#markGrad)"` with a `#054d71 → #046c68` ramp.
 * On a cream ground that ramp renders pale blue-green — measurably the weakest
 * thing on the card, and a hue the design system does not use. Flattening it to
 * a solid keeps the mark crisp and on-brand. The file on disk is untouched;
 * only this copy is recoloured.
 *
 * Returns null instead of throwing when the asset is missing: a card without a
 * mark still reads, and failing the whole render over decoration is worse.
 */
export function brandMarkDataUrl(color: string = BRAND_GREEN): string | null {
  try {
    const file = fs.readFileSync(
      path.join(process.cwd(), "public", "creedava-mark.svg"),
      "utf8",
    );
    const flattened = file.replace(/url\(#markGrad\)/g, color);
    return `data:image/svg+xml;base64,${Buffer.from(flattened).toString("base64")}`;
  } catch {
    return null;
  }
}
