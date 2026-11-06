import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "CreedaVA — Bilingual Virtual Assistants for Your Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default social card, served at /opengraph-image. `twitter-image.tsx` reuses
 * this component so the two can never drift apart.
 *
 * Rebuilt on the 2026 tokens. The previous version was a `#005148 → #002D72`
 * linear gradient with white type — the one thing the current design language
 * explicitly forbids — and it carried no brand mark, so every LinkedIn or X
 * preview was a generic teal rectangle.
 *
 * Composition mirrors the hero: cream ground, the C mark, an ink headline, a
 * hairline rule, and a single green line of proof. The result reads like a
 * screenshot of the site rather than a separate asset.
 */
function readMark(): string | null {
  try {
    const file = fs.readFileSync(
      path.join(process.cwd(), "public", "creedava-mark.svg"),
      "utf8",
    );
    /*
     * Flatten the mark's own gradient to solid brand green.
     *
     * The SVG paints `fill="url(#markGrad)"` with a `#054d71 → #046c68` ramp.
     * On the cream card that ramp renders pale blue-green — measurably the
     * weakest thing on the image, and a hue the design system does not use. A
     * flat #005148 fill keeps the mark crisp at this size and on-brand. The
     * source file is untouched; only this copy is flattened.
     */
    const flattened = file.replace(/url\(#markGrad\)/g, "#005148");
    return `data:image/svg+xml;base64,${Buffer.from(flattened).toString("base64")}`;
  } catch {
    // Never fail the route over a missing asset: the card still reads.
    return null;
  }
}

export default function SocialCard() {
  const mark = readMark();

  return new ImageResponse(
    (
      <div
        style={{
          background: "#F7F7F2",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {mark ? (
            <img src={mark} alt="" width={88} height={100} />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: "#0B2135",
              }}
            >
              CreedaVA
            </span>
            <span
              style={{
                marginTop: 8,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#566B85",
              }}
            >
              Virtual Assistants
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#0B2135",
              maxWidth: 940,
            }}
          >
            A dedicated bilingual assistant, working inside your tools.
          </div>

          <div
            style={{
              marginTop: 34,
              height: 1,
              width: "100%",
              background: "#E2E2DE",
            }}
          />

          <div
            style={{
              marginTop: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 23, fontWeight: 600, color: "#005148" }}>
              One flat monthly fee · English &amp; Spanish · 5–7 day onboarding
            </span>
            <span style={{ fontSize: 21, fontWeight: 500, color: "#566B85" }}>
              creedava.com
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
