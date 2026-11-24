import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { SocialCardCopy } from "./social-cards";

/**
 * The 1200×630 social card.
 *
 * Copy lives in `social-cards.ts` (data only, so the server can build
 * `og:image` URLs without pulling in the image renderer); this module is the
 * one place the composition is drawn, so the homepage and every page card read
 * as a single set.
 *
 * Composition mirrors the hero: cream ground, the C mark, an ink headline, a
 * hairline rule, and one green line of proof. The result reads like a
 * screenshot of the site rather than a separate asset.
 */
export const SOCIAL_CARD_SIZE = { width: 1200, height: 630 };
export const SOCIAL_CARD_TYPE = "image/png";

const PAPER = "#F7F7F2";
const INK = "#0B2135";
const BRAND = "#005148";
const MUTE = "#566B85";
const RULE = "#E2E2DE";
const DEFAULT_EYEBROW = "Virtual Assistants";

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
    const flattened = file.replace(/url\(#markGrad\)/g, BRAND);
    return `data:image/svg+xml;base64,${Buffer.from(flattened).toString("base64")}`;
  } catch {
    // Never fail the route over a missing asset: the card still reads.
    return null;
  }
}

export function socialCard({ headline, footnote, eyebrow }: SocialCardCopy): ImageResponse {
  const mark = readMark();

  return new ImageResponse(
    (
      <div
        style={{
          background: PAPER,
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
          {/*
            Plain `<img>` on purpose: `next/image` does not work inside
            `ImageResponse` — there is no router, no optimizer and no request
            to serve `/_next/image` from. The source is a base64 data URL, so
            there is no network fetch to optimize either.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image is unsupported in ImageResponse */}
          {mark ? <img src={mark} alt="" width={88} height={100} /> : null}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                color: INK,
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
                color: MUTE,
              }}
            >
              {eyebrow ?? DEFAULT_EYEBROW}
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
              color: INK,
              maxWidth: 940,
            }}
          >
            {headline}
          </div>

          <div style={{ marginTop: 34, height: 1, width: "100%", background: RULE }} />

          <div
            style={{
              marginTop: 26,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 23, fontWeight: 600, color: BRAND }}>{footnote}</span>
            <span style={{ fontSize: 21, fontWeight: 500, color: MUTE }}>creedava.com</span>
          </div>
        </div>
      </div>
    ),
    { ...SOCIAL_CARD_SIZE },
  );
}
