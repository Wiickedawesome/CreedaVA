import { ImageResponse } from "next/og";
import { BRAND, FORMATS, type CreativeFormat, type Design } from "./creative";
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
 */

/** Type sizes at a 1080px canvas. Everything else is this times `scale`. */
const BASE = {
  headline: 86,
  subhead: 31,
  eyebrow: 20,
  cta: 25,
  footnote: 21,
  mark: 68,
  stat: 168,
  item: 32,
  index: 24,
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
 * Shrink long copy instead of letting it overflow.
 *
 * The spec caps a headline at 90 characters, which at full size would run off
 * a 630px-tall canvas. Two steps are enough; a third would make the type too
 * small to read at feed size.
 */
function fit(value: string, max: number): number {
  if (value.length > max * 0.85) return 0.68;
  if (value.length > max * 0.55) return 0.82;
  return 1;
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

function Lockup({
  design,
  scale,
  markColor,
  textColor,
}: {
  design: Design;
  scale: number;
  markColor: string;
  textColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: px(20 * scale),
      }}
    >
      <Mark scale={scale} color={markColor} />
      <Eyebrow text={design.eyebrow} scale={scale} color={textColor} />
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
  const pad = px(72 * scale);
  const size = fit(design.headline, 34);

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
            "linear-gradient(180deg, rgba(11,33,53,0.18) 0%, rgba(11,33,53,0.58) 52%, rgba(11,33,53,0.95) 100%)",
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
        <Lockup
          design={design}
          scale={scale}
          markColor={BRAND.paper}
          textColor={BRAND.paper}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: px(22 * scale) }}>
          <div
            style={{
              display: "flex",
              fontSize: px(BASE.headline * scale * size),
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: px(-0.03 * BASE.headline * scale * size),
              color: BRAND.paper,
              maxWidth: "94%",
            }}
          >
            {design.headline}
          </div>

          {design.subhead ? (
            <div
              style={{
                display: "flex",
                fontSize: px(BASE.subhead * scale),
                fontWeight: 500,
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
  const pad = px(64 * scale);
  const size = fit(design.headline, 34);

  const panel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: BRAND.green,
        padding: pad,
        width: stacked ? "100%" : px(width * 0.46),
        height: stacked ? px(height * 0.5) : "100%",
      }}
    >
      <Mark scale={scale} color={BRAND.paper} />

      <div style={{ display: "flex", flexDirection: "column", gap: px(18 * scale) }}>
        <Eyebrow text={design.eyebrow} scale={scale} color={BRAND.paper} />
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.headline * scale * size * 0.86),
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: px(-0.025 * BASE.headline * scale),
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
            fontWeight: 500,
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
  const photoWidth = stacked ? width : width - px(width * 0.46);
  const photoHeight = stacked ? height - px(height * 0.5) : height;

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

/** One large figure, made unmissable. */
function Stat({
  design,
  scale,
}: {
  design: Design;
  scale: number;
}) {
  const pad = px(78 * scale);
  const size = fit(design.stat, 12);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        background: BRAND.paper,
        padding: pad,
      }}
    >
      <Lockup
        design={design}
        scale={scale}
        markColor={BRAND.green}
        textColor={BRAND.mute}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: px(18 * scale) }}>
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.stat * scale * size),
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: px(-0.045 * BASE.stat * scale * size),
            color: BRAND.green,
          }}
        >
          {design.stat}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.headline * scale * 0.46),
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: px(-0.02 * BASE.headline * scale),
            color: BRAND.ink,
            maxWidth: "88%",
          }}
        >
          {design.headline}
        </div>
        {design.subhead ? (
          <div
            style={{
              display: "flex",
              fontSize: px(BASE.subhead * scale),
              fontWeight: 500,
              lineHeight: 1.35,
              color: BRAND.mute,
              maxWidth: "80%",
            }}
          >
            {design.subhead}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Cta text={design.cta} scale={scale} background={BRAND.green} color={BRAND.paper} />
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.footnote * scale),
            fontWeight: 500,
            color: BRAND.mute,
          }}
        >
          creedava.com
        </div>
      </div>
    </div>
  );
}

/** Headline plus numbered points. */
function List({
  design,
  scale,
}: {
  design: Design;
  scale: number;
}) {
  const pad = px(78 * scale);
  const size = fit(design.headline, 34);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        background: BRAND.paper,
        padding: pad,
      }}
    >
      <Lockup
        design={design}
        scale={scale}
        markColor={BRAND.green}
        textColor={BRAND.mute}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: px(34 * scale) }}>
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.headline * scale * size * 0.8),
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: px(-0.03 * BASE.headline * scale),
            color: BRAND.ink,
            maxWidth: "94%",
          }}
        >
          {design.headline}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: px(20 * scale) }}>
          {design.items.map((item, index) => (
            <div
              key={`${index}-${item}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: px(18 * scale),
                borderTop: `${Math.max(1, px(scale))}px solid ${BRAND.rule}`,
                paddingTop: px(16 * scale),
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: px(BASE.index * scale),
                  fontWeight: 800,
                  color: BRAND.green,
                  lineHeight: 1.3,
                  minWidth: px(34 * scale),
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: px(BASE.item * scale),
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: BRAND.ink,
                }}
              >
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Cta text={design.cta} scale={scale} background={BRAND.green} color={BRAND.paper} />
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.footnote * scale),
            fontWeight: 500,
            color: BRAND.mute,
          }}
        >
          creedava.com
        </div>
      </div>
    </div>
  );
}

/** A single statement, set large. No photo by definition. */
function Quote({
  design,
  scale,
}: {
  design: Design;
  scale: number;
}) {
  const pad = px(82 * scale);
  const size = fit(design.headline, 30);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        background: BRAND.paper,
        padding: pad,
      }}
    >
      <Lockup
        design={design}
        scale={scale}
        markColor={BRAND.green}
        textColor={BRAND.mute}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: px(26 * scale) }}>
        <div
          style={{
            display: "flex",
            width: px(96 * scale),
            height: px(5 * scale),
            background: BRAND.green,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.headline * scale * size),
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: px(-0.032 * BASE.headline * scale * size),
            color: BRAND.ink,
            maxWidth: "95%",
          }}
        >
          {design.headline}
        </div>
        {design.subhead ? (
          <div
            style={{
              display: "flex",
              fontSize: px(BASE.subhead * scale),
              fontWeight: 500,
              lineHeight: 1.4,
              color: BRAND.mute,
              maxWidth: "80%",
            }}
          >
            {design.subhead}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `${Math.max(1, px(scale))}px solid ${BRAND.rule}`,
          paddingTop: px(22 * scale),
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.cta * scale),
            fontWeight: 700,
            color: BRAND.green,
          }}
        >
          {design.cta}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: px(BASE.footnote * scale),
            fontWeight: 500,
            color: BRAND.mute,
          }}
        >
          creedava.com
        </div>
      </div>
    </div>
  );
}

/**
 * Draw one creative.
 *
 * `photo` is a data URL, already fetched and cropped by the route, or null for
 * a type-only composition.
 */
export function creativeImage(
  design: Design,
  format: CreativeFormat,
  photo: string | null,
): ImageResponse {
  const { width, height } = FORMATS[format];
  const scale = typeScale(width, height);

  const body = (() => {
    switch (design.layout) {
      case "hero":
        return (
          <Hero
            design={design}
            photo={photo}
            width={width}
            height={height}
            scale={scale}
          />
        );
      case "split":
        return (
          <Split
            design={design}
            photo={photo}
            width={width}
            height={height}
            scale={scale}
          />
        );
      case "stat":
        return <Stat design={design} scale={scale} />;
      case "list":
        return <List design={design} scale={scale} />;
      default:
        return <Quote design={design} scale={scale} />;
    }
  })();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: BRAND.paper,
          fontFamily: "sans-serif",
        }}
      >
        {body}
      </div>
    ),
    { width, height },
  );
}
