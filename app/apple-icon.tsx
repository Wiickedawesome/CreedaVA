import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon.
 *
 * `metadata.icons.apple` previously pointed at `/logo.webp` — the pre-redesign
 * logo, and a format iOS ignores for home-screen icons. This generates a real
 * 180×180 PNG from the mark using the green brand ground, which is what iOS
 * expects (transparent icons get composited onto black).
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#005148",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            fontSize: 118,
            fontWeight: 800,
            letterSpacing: "-0.06em",
            color: "#F7F7F2",
            lineHeight: 1,
          }}
        >
          C
        </span>
      </div>
    ),
    { ...size },
  );
}
