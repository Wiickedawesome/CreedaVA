import type { MetadataRoute } from "next";

/**
 * PWA manifest.
 *
 * Icons point at the current SVG mark. The previous entries were
 * `/logo.webp` and `/creedava-logo-B-axbjNY.webp` — the pre-redesign logo, with
 * a content hash in the filename. `background_color` was pure white; the site
 * ground is cream (`--mk-paper`), so an installed app flashed the wrong colour
 * before first paint.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CreedaVA — Virtual Assistant Services",
    short_name: "CreedaVA",
    description:
      "Professional virtual assistant services for businesses. Save time, reduce costs, and scale your operations.",
    start_url: "/",
    display: "standalone",
    // --mk-paper / --mk-brand. Keep these in sync with app/globals.css.
    background_color: "#F7F7F2",
    theme_color: "#005148",
    icons: [
      {
        src: "/creedava-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        // Maskable icons are cropped to a circle on Android; the mark is
        // centred with its own padding, so it survives the safe zone.
        src: "/creedava-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
