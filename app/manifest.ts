import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CreedaVA — Virtual Assistant Services",
    short_name: "CreedaVA",
    description:
      "Professional virtual assistant services for businesses. Save time, reduce costs, and scale your operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#005148",
    icons: [
      {
        src: "/logo.webp",
        sizes: "any",
        type: "image/webp",
        purpose: "any",
      },
      {
        src: "/creedava-logo-B-axbjNY.webp",
        sizes: "any",
        type: "image/webp",
        purpose: "maskable",
      },
    ],
  };
}
