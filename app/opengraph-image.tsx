import { ImageResponse } from "next/og";

export const alt = "CreedaVA — Virtual Assistant Services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default OG image for the site.
 * Next.js auto-serves this at /opengraph-image and /twitter-image
 * when no page-specific image is set.
 */
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #005148 0%, #002D72 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "white",
              margin: 0,
              letterSpacing: "0",
            }}
          >
            CreedaVA
          </h1>
          <div
            style={{
              width: "80px",
              height: "4px",
              background: "rgba(255,255,255,0.4)",
              borderRadius: "2px",
            }}
          />
          <p
            style={{
              fontSize: "32px",
              fontWeight: 300,
              color: "rgba(255,255,255,0.9)",
              margin: 0,
              textAlign: "center",
              maxWidth: "700px",
            }}
          >
            Professional Virtual Assistant Services
          </p>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.6)",
              margin: 0,
            }}
          >
            creedava.com
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
