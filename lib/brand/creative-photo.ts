/**
 * Photo slots for a creative.
 *
 * Two sources, and the difference matters:
 *
 * - `library` pulls from the curated Unsplash ids in `blog-images.ts`. No API
 *   key, no rate limit, no unpredictable results. (Unsplash's *search* endpoint
 *   would need a key, which is why the list exists.)
 * - `custom` draws with the image model, for the scenes no stock library has.
 *
 * Either way the result is a data URL, so the renderer never performs a network
 * fetch while drawing.
 */

import { FORMATS, type CreativeFormat } from "./creative";

const UNSPLASH_BASE = "https://images.unsplash.com";

/** Give up rather than hold a render open; a missing photo degrades to type. */
const FETCH_TIMEOUT_MS = 8000;

/**
 * Unsplash CDN URL cropped to the canvas.
 *
 * `fm=jpg` is explicit: `auto=format` can return WebP, which the renderer's
 * image decoder does not accept.
 */
export function libraryPhotoUrl(
  photoId: string,
  format: CreativeFormat,
): string {
  const spec = FORMATS[format];
  return `${UNSPLASH_BASE}/${photoId}?w=${spec.width}&h=${spec.height}&fit=crop&fm=jpg&q=80`;
}

/**
 * Fetch an image and return it as a data URL, or null.
 *
 * Null is a normal outcome, not an error: the composition still draws without a
 * photo, so a CDN hiccup must not fail the run.
 */
export async function fetchPhotoDataUrl(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.error("[creative] photo fetch failed:", res.status, url);
      return null;
    }

    const mimeType = res.headers.get("content-type") ?? "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      console.error("[creative] photo was not an image:", mimeType);
      return null;
    }

    const bytes = Buffer.from(await res.arrayBuffer());
    // A 404 page or a rate-limit notice can come back as a tiny image.
    if (bytes.length < 5000) {
      console.error("[creative] photo was too small to be real:", bytes.length);
      return null;
    }

    return `data:${mimeType};base64,${bytes.toString("base64")}`;
  } catch (err) {
    console.error("[creative] photo fetch threw:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
