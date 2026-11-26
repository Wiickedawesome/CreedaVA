import { ImageResponse } from "next/og";
import {
  FORMATS,
  PALETTES,
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
 * Five frames and seven palettes, rather than one house style. An earlier
 * version drew every post in brand green with the same bottom-left block, which
 * is why a set of them looked like one template with the words swapped.
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
  mark: 42,
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

/**
 * The words, set the same way in every frame.
 *
 * `size` is a multiple of the base headline size, computed by whoever knows how
 * much room the frame actually leaves. Alignment and colour come from the
 * palette, so the same block looks right on a cream ground and on a photo.
 */
function Words({
  design,
  scale,
  size,
  color,
  accent,
  maxWidth,
  plate,
}: {
  design: Design;
  scale: number;
  size: number;
  color: string;
  accent: string;
  maxWidth: number;
  /** Solid field colour behind the words, for type over a photograph. */
  plate?: string;
}) {
  const center = design.align === "center";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: px(20 * scale),
        maxWidth,
        alignItems: center ? "center" : "flex-start",
        textAlign: center ? "center" : "left",
        ...(plate
          ? {
              background: plate,
              paddingBlock: px(34 * scale),
              paddingInline: px(36 * scale),
            }
          : {}),
      }}
    >
      {design.eyebrow ? (
        <div style={{ display: "flex", alignItems: "center", gap: px(14 * scale) }}>
          <div
            style={{
              display: "flex",
              width: px(28 * scale),
              height: px(3 * scale),
              background: accent,
            }}
          />
          <Eyebrow text={design.eyebrow} scale={scale} color={accent} />
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          fontSize: px(BASE.headline * scale * size),
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: px(-0.035 * BASE.headline * scale * size),
          color,
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
            color,
            opacity: 0.82,
          }}
        >
          {design.subhead}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Scrim for type sitting over a photo.
 *
 * Deliberately omits a flat wash. An earlier version laid a 62% wash of the
 * field colour over the whole frame, which guaranteed contrast but flattened the
 * photograph — a Thanksgiving render came out with a luminance spread of 37/255,
 * so it read as a coloured block rather than a photo.
 *
 * Instead the ramp alone carries the contrast, and `Words` gets a plate behind
 * it when the ramp cannot do the job on its own.
 */
function Scrim({
  field,
  anchor,
}: {
  field: string;
  anchor: Design["anchor"];
}) {
  const ramp =
    anchor === "top"
      ? `linear-gradient(0deg, ${field}00 0%, ${field}B4 58%, ${field}FC 100%)`
      : anchor === "middle"
        ? `linear-gradient(180deg, ${field}00 0%, ${field}B4 22%, ${field}B4 78%, ${field}00 100%)`
        : `linear-gradient(180deg, ${field}00 0%, ${field}A8 46%, ${field}FC 100%)`;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        display: "flex",
        width: "100%",
        height: "100%",
        background: ramp,
      }}
    />
  );
}

/** Photo fills the frame; type sits over a gradient scrim, anchored anywhere. */
function Overlay({
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
  const { field, type, accent } = PALETTES[design.palette];
  const pad = px(76 * scale);
  const markAtTop = design.anchor !== "top";
  const size = headlineScale(
    design.headline,
    width - pad * 2,
    height * 0.44,
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
        background: field,
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

      <Scrim field={field} anchor={design.anchor} />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: markAtTop ? "space-between" : "flex-end",
          alignItems: design.align === "center" ? "center" : "flex-start",
          width: "100%",
          height: "100%",
          padding: pad,
        }}
      >
        {markAtTop ? <Mark scale={scale} color={type} /> : null}

        <Words
          design={design}
          scale={scale}
          size={size}
          color={type}
          accent={accent}
          maxWidth={width - pad * 2}
          // The middle anchor has no canvas edge for the ramp to build against,
          // so a gradient there leaves the type on raw photo. A plate is the
          // only way to keep both the photo visible and the words readable.
          plate={design.anchor === "middle" ? field : undefined}
        />

        {markAtTop ? null : (
          <div style={{ display: "flex", marginTop: px(34 * scale) }}>
            <Mark scale={scale} color={type} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Photo under a flat colour wash.
 *
 * A solid tint instead of a gradient, so the frame reads as one colour block —
 * the look the reference set uses when it wants a poster rather than a photo.
 */
function Duotone({
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
  const { field, type, accent } = PALETTES[design.palette];
  const pad = px(76 * scale);
  const markAtTop = design.anchor !== "top";
  const size = headlineScale(
    design.headline,
    width - pad * 2,
    height * 0.44,
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
        background: field,
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
          background: field,
          // Heavy on purpose. At 0.78 the photo showed through enough to muddy
          // the ground, and light palettes measured 3.1-3.4:1 against their own
          // type. The point of this frame is a flat colour block anyway, so the
          // photo is texture, not subject.
          opacity: 0.9,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: markAtTop ? "space-between" : "flex-end",
          alignItems: design.align === "center" ? "center" : "flex-start",
          width: "100%",
          height: "100%",
          padding: pad,
        }}
      >
        {markAtTop ? <Mark scale={scale} color={type} /> : null}

        <Words
          design={design}
          scale={scale}
          size={size}
          color={type}
          accent={accent}
          maxWidth={width - pad * 2}
        />

        {markAtTop ? null : (
          <div style={{ display: "flex", marginTop: px(34 * scale) }}>
            <Mark scale={scale} color={type} />
          </div>
        )}
      </div>
    </div>
  );
}

/** A hard fifty-fifty division: photo on one side, a solid colour field on the other. */
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
  const { field, type, accent } = PALETTES[design.palette];
  const stacked = height > width;
  const pad = px(56 * scale);
  const panelWidth = stacked ? width : px(width * 0.5);
  const panelHeight = stacked ? px(height * 0.5) : height;
  const size = headlineScale(
    design.headline,
    panelWidth - pad * 2,
    panelHeight * 0.5,
    BASE.headline * scale * 0.86,
    1,
  );

  // The photo gets an explicit pixel box rather than `flex: 1`. Satori computes
  // a flex-sized image's dimensions lazily and crashes on the undefined width;
  // a fixed box sidesteps that entirely.
  const photoWidth = stacked ? width : width - panelWidth;
  const photoHeight = stacked ? height - panelHeight : height;

  const panel = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: design.align === "center" ? "center" : "flex-start",
        background: field,
        padding: pad,
        width: stacked ? "100%" : panelWidth,
        height: stacked ? panelHeight : "100%",
      }}
    >
      <Mark scale={scale} color={type} />

      <Words
        design={design}
        scale={scale}
        size={size}
        color={type}
        accent={accent}
        maxWidth={panelWidth - pad * 2}
      />
    </div>
  );

  const photoArea = (
    <div
      style={{
        display: "flex",
        width: photoWidth,
        height: photoHeight,
        background: field,
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
        background: field,
      }}
    >
      {panel}
      {photoArea}
    </div>
  );
}

/**
 * Photo filling the frame with a slim solid bar of type across one edge.
 *
 * The bar gives the words a flat surface, so this still works over a bright or
 * busy photo where a gradient scrim would leave the headline muddy.
 */
function Stack({
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
  const { field, type, accent } = PALETTES[design.palette];
  const barAtTop = design.anchor === "top";
  const barHeight = px(height * (height > width ? 0.34 : 0.4));
  const photoHeight = height - barHeight;
  const pad = px(60 * scale);
  const size = headlineScale(
    design.headline,
    width - pad * 2,
    barHeight * 0.52,
    BASE.headline * scale,
    1,
  );

  const photoBox = (
    <div
      style={{
        display: "flex",
        width,
        height: photoHeight,
        background: field,
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
  );

  const bar = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: design.align === "center" ? "center" : "flex-start",
        width: "100%",
        height: barHeight,
        background: field,
        padding: pad,
      }}
    >
      <Words
        design={design}
        scale={scale}
        size={size}
        color={type}
        accent={accent}
        maxWidth={width - pad * 2}
      />
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: field,
      }}
    >
      {barAtTop ? bar : photoBox}
      {barAtTop ? photoBox : bar}
    </div>
  );
}

/**
 * Solid colour field with the photo set inside it like a framed print.
 *
 * The only frame where the ground colour is the larger element, which is what
 * makes a light palette read as a poster rather than a photo with a caption.
 */
function Inset({
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
  const { field, type, accent } = PALETTES[design.palette];
  const margin = px(64 * scale);
  const gap = px(48 * scale);
  const typeHeight = px((height - margin * 2 - gap) * 0.42);
  const photoHeight = height - margin * 2 - gap - typeHeight;
  const photoWidth = width - margin * 2;
  const typeFirst = design.anchor === "top";
  const size = headlineScale(
    design.headline,
    photoWidth,
    typeHeight,
    BASE.headline * scale * 0.86,
    1,
  );

  const print = (
    <div
      style={{
        display: "flex",
        width: photoWidth,
        height: photoHeight,
        background: accent,
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/image is unsupported in ImageResponse
        <img
          src={photo}
          alt=""
          width={photoWidth}
          height={photoHeight}
          style={{ width: photoWidth, height: photoHeight, objectFit: "cover" }}
        />
      ) : null}
    </div>
  );

  const words = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: design.align === "center" ? "center" : "flex-start",
        width: photoWidth,
        height: typeHeight,
      }}
    >
      <Words
        design={design}
        scale={scale}
        size={size}
        color={type}
        accent={accent}
        maxWidth={photoWidth}
      />
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap,
        width: "100%",
        height: "100%",
        background: field,
        padding: margin,
      }}
    >
      {typeFirst ? words : print}
      {typeFirst ? print : words}
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
    switch (design.frame) {
      case "duotone":
        return <Duotone {...props} />;
      case "split":
        return <Split {...props} />;
      case "stack":
        return <Stack {...props} />;
      case "inset":
        return <Inset {...props} />;
      default:
        return <Overlay {...props} />;
    }
  })();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: PALETTES[design.palette].field,
          fontFamily: RENDER_FONT_FAMILY,
        }}
      >
        {body}
      </div>
    ),
    { width, height, fonts: await renderFonts() },
  );
}
