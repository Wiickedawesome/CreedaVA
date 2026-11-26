import { ImageResponse } from "next/og";
import {
  BRAND,
  FORMATS,
  type CreativeFormat,
  type Design,
} from "./creative";
import { RENDER_FONT_FAMILY, renderFonts } from "./fonts";
import { brandMarkDataUrl } from "./mark";

/**
 * Draws a design spec as a finished creative.
 *
 * The model decides the composition and writes the words; this module sets
 * them. That split is the whole point: type comes out of a real font at a real
 * size, so a headline is always legible, and the model is still free to choose
 * the shape the post needs.
 *
 * Satori constraints, learned the hard way:
 * - every element with more than one child needs an explicit `display: flex`
 * - there is no cascade and no stylesheet, so every size is passed explicitly
 * - `next/image` does not work here; images are plain `<img>` with data URLs
 * - `overflow: hidden` is avoided: the photo is cropped with `objectFit`
 * - it cannot read `.woff2`, so the fonts are bundled as TTF (see `fonts.ts`)
 */

/** Type sizes at a 1080px canvas. Everything else is this times `scale`. */
const BASE = {
  headline: 116,
  subhead: 30,
  eyebrow: 19,
  cta: 24,
  mark: 44,
} as const;

/**
 * One scale for every canvas.
 *
 * Width alone overflows a wide, short card: 1200×630 would get the square's
 * headline and run off the bottom. Height is weighted because text grows
 * downward, so taking the smaller dimension keeps the wide card comfortable
 * without shrinking the tall ones.
 */
function typeScale(width: number, height: number): number {
  return Math.min(width, height * 1.15) / 1080;
}

/**
 * Roboto 900 runs about this much per character at display sizes, which is
 * close enough to predict how many lines a headline will wrap to.
 */
const AVG_ADVANCE = 0.58;

/**
 * Pick the largest size that fills the space without overflowing.
 *
 * An earlier version shrank any headline over about thirty characters to 68%,
 * which is most headlines, so the type came out at 79px on a 1080 canvas
 * instead of 116px. Shrinking is the wrong lever: a long line should wrap to
 * two or three enormous lines, not become one small one. Only shrink when the
 * wrapped block genuinely cannot fit.
 */
function headlineScale(
  text: string,
  availableWidth: number,
  availableHeight: number,
  base: number,
  lineHeight: number,
): number {
  let size = base;
  while (size > base * 0.55) {
    const perLine = Math.max(
      1,
      Math.floor(availableWidth / (size * AVG_ADVANCE)),
    );
    const lines = Math.ceil(text.length / perLine);
    if (lines * size * lineHeight <= availableHeight) break;
    size *= 0.94;
  }
  return size / base;
}

const px = (value: number) => Math.round(value);

function Mark({ scale, color }: { scale: number; color: string }) {
  const mark = brandMarkDataUrl(color);
  if (!mark) return null;
  const width = px(BASE.mark * scale);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- next/image is unsupported in ImageResponse
    <img src={mark} alt="" width={width} height={px(width * 1.13)} />
  );
}

function Eyebrow({
  text,
  scale,
  color,
}: {
  text: string;
  scale: number;
  color: string;
}) {
  if (!text) return null;
  return (
    <div
      style={{
        display: "flex",
        fontSize: px(BASE.eyebrow * scale),
        fontWeight: 700,
        letterSpacing: px(BASE.eyebrow * scale * 0.18),
        textTransform: "uppercase",
        color,
      }}
    >
      {text}
    </div>
  );
}

function Cta({
  text,
  scale,
  background,
  color,
}: {
  text: string;
  scale: number;
  background: string;
  color: string;
}) {
  if (!text) return null;
  return (
    <div
      style={{
        display: "flex",
        background,
        color,
        borderRadius: px(999),
        paddingBlock: px(14 * scale),
        paddingInline: px(30 * scale),
        fontSize: px(BASE.cta * scale),
        fontWeight: 700,
        letterSpacing: px(-0.01 * BASE.cta * scale),
      }}
    >
      {text}
    </div>
  );
}

/** Full-bleed photo, headline across the bottom over a scrim. */
function Hero({
  design,
  photo,
  width,
  height,
  scale,
}: {
  design: Design;
  photo: string | null;
  width: number;
  height: number;
  scale: number;
}) {
  const pad = px(76 * scale);
  // The lower half is the type block; the photo keeps the top to itself.
  const size = headlineScale(
    design.headline,
    width - pad * 2,
    height * 0.46,
    BASE.headline * scale,
    1,
  );

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        background: BRAND.ink,
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/image is unsupported in ImageResponse
        <img
          src={photo}
          alt=""
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(180deg, rgba(11,33,53,0.10) 0%, rgba(11,33,53,0.45) 45%, rgba(11,33,53,0.92) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: pad,
        }}
      >
        <Mark scale={scale} color={BRAND.paper} />

        <div style={{ display: "flex", flexDirection: "column", gap: px(20 * scale) }}>
          <Eyebrow
            text={design.eyebrow}
            scale={scale}
            color="rgba(247,247,242,0.72)"
          />

          <div
            style={{
              display: "flex",
              fontSize: px(BASE.headline * scale * size),
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: px(-0.035 * BASE.headline * scale * size),
              color: BRAND.paper,
              maxWidth: "92%",
            }}
          >
            {design.headline}
          </div>

          {design.subhead ? (
            <div
              style={{
                display: "flex",
                fontSize: px(BASE.subhead * scale),
                fontWeight: 400,
                lineHeight: 1.35,
                color: "rgba(247,247,242,0.86)",
                maxWidth: "82%",
              }}
            >
              {design.subhead}
            </div>
          ) : null}

          {design.cta ? (
            <div style={{ display: "flex", marginTop: px(10 * scale) }}>
              <Cta
                text={design.cta}
                scale={scale}
                background={BRAND.paper}
                color={BRAND.ink}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Solid brand panel beside a photo; the panel carries the headline. */
function Split({
  design,
  photo,
  width,
  height,
  scale,
}: {
  design: Design;
  photo: string | null;
  width: number;
  height: number;
  scale: number;
}) {
  const stacked = height > width;
  const pad = px(60 * scale);
  const panelShare = 0.44;
  const panelWidth = stacked ? width : px(width * panelShare);
  const panelHeight = stacked ? px(height * 0.5) : height;
  const size = headlineScale(
    design.headline,
    panelWidth - pad * 2,
    panelHeight * 0.42,
    BASE.headline * scale * 0.86,
    1.08,
  );

  const panel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: BRAND.green,
        padding: pad,
        width: stacked ? "100%" : panelWidth,
        height: stacked ? panelHeight : "100%",
      }}
    >
      <Mark scale={scale} color={BRAND.paper} />

      <div style={{ display: "flex", flexDirection: "column", gap: px(18 * scale) }}>
        <Eyebrow text={design.eyebrow} scale={scale} color={BRAND.paper} />
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.headline * scale * 0.86 * size),
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: px(-0.025 * BASE.headline * scale * 0.86 * size),
            color: BRAND.paper,
          }}
        >
          {design.headline}
        </div>
      </div>

      {design.subhead ? (
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.subhead * scale * 0.86),
            fontWeight: 400,
            lineHeight: 1.35,
            color: "rgba(247,247,242,0.84)",
          }}
        >
          {design.subhead}
        </div>
      ) : (
        <div style={{ display: "flex" }} />
      )}
    </div>
  );

  // The photo gets an explicit pixel box rather than `flex: 1`. Satori computes
  // a flex-sized image's dimensions lazily and crashes on the undefined width;
  // a fixed box sidesteps that entirely.
  const photoWidth = stacked ? width : width - panelWidth;
  const photoHeight = stacked ? height - panelHeight : height;

  const photoArea = (
    <div
      style={{
        display: "flex",
        width: photoWidth,
        height: photoHeight,
        background: BRAND.rule,
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/image is unsupported in ImageResponse
        <img
          src={photo}
          alt=""
          width={photoWidth}
          height={photoHeight}
          style={{
            width: photoWidth,
            height: photoHeight,
            objectFit: "cover",
          }}
        />
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        width: "100%",
        height: "100%",
        background: BRAND.paper,
      }}
    >
      {panel}
      {photoArea}
    </div>
  );
}

/**
 * Full-bleed photo with a solid brand band across the bottom.
 *
 * The band gives the type a flat surface to sit on, so this still works over a
 * bright, busy photo where a scrim alone would leave the headline muddy.
 */
function Band({
  design,
  photo,
  width,
  height,
  scale,
}: {
  design: Design;
  photo: string | null;
  width: number;
  height: number;
  scale: number;
}) {
  const bandHeight = px(height * (height > width ? 0.42 : 0.46));
  const photoHeight = height - bandHeight;
  const pad = px(62 * scale);
  const size = headlineScale(
    design.headline,
    width - pad * 2,
    bandHeight * 0.6,
    BASE.headline * scale,
    1,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: BRAND.ink,
      }}
    >
      <div
        style={{
          display: "flex",
          width,
          height: photoHeight,
          background: BRAND.ink,
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/image is unsupported in ImageResponse
          <img
            src={photo}
            alt=""
            width={width}
            height={photoHeight}
            style={{ width, height: photoHeight, objectFit: "cover" }}
          />
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: px(18 * scale),
          width: "100%",
          height: bandHeight,
          background: BRAND.green,
          padding: pad,
        }}
      >
        <Eyebrow
          text={design.eyebrow}
          scale={scale}
          color="rgba(247,247,242,0.72)"
        />

        <div
          style={{
            display: "flex",
            fontSize: px(BASE.headline * scale * size),
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: px(-0.035 * BASE.headline * scale * size),
            color: BRAND.paper,
          }}
        >
          {design.headline}
        </div>

        {design.cta ? (
          <div style={{ display: "flex", marginTop: px(6 * scale) }}>
            <Cta
              text={design.cta}
              scale={scale}
              background={BRAND.paper}
              color={BRAND.green}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Draw one creative.
 *
 * `photo` is a data URL, already fetched and cropped, or null when the photo
 * slot could not be filled — the composition then draws on ink, which still
 * looks deliberate rather than blank.
 */
export async function creativeImage(
  design: Design,
  format: CreativeFormat,
  photo: string | null,
): Promise<ImageResponse> {
  const { width, height } = FORMATS[format];
  const scale = typeScale(width, height);
  const props = { design, photo, width, height, scale };

  const body = (() => {
    switch (design.layout) {
      case "band":
        return <Band {...props} />;
      case "split":
        return <Split {...props} />;
      default:
        return <Hero {...props} />;
    }
  })();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: BRAND.ink,
          fontFamily: RENDER_FONT_FAMILY,
        }}
      >
        {body}
      </div>
    ),
    { width, height, fonts: await renderFonts() },
  );
}
