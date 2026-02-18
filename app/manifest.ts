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
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
