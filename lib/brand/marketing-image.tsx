import { ImageResponse } from "next/og";
import { brandMarkDataUrl } from "./mark";
import {
  BRAND_COLORS,
  FORMATS,
  type MarketingCopy,
  type MarketingFormat,
  type TemplateId,
} from "./marketing-templates";

/**
 * Marketing graphics, drawn as markup.
 *
 * Every size is derived from the canvas, so one composition works at 1080² and
 * 1200×630 without a second layout. Satori has no cascade and no stylesheet, so
 * the scale is passed down explicitly rather than inherited.
 */

/** Type sizes at a 1080px canvas. Everything else is this multiplied by `scale`. */
const BASE = {
  headline: 84,
  supporting: 30,
  eyebrow: 21,
  cta: 28,
  footnote: 22,
  mark: 76,
} as const;

/**
 * One type scale for every canvas.
 *
 * Width alone overflows a wide, short card: 1200×630 would get the square's
 * headline and run off the bottom. Taking the smaller of the two dimensions
 * (with height weighted, since text grows downward) keeps the wide card
 * comfortable without shrinking the tall ones, whose width is unchanged.
 */
function typeScale(width: number, height: number): number {
  return Math.min(width, height * 1.15) / 1080;
}

function padding(scale: number): number {
  return Math.round(78 * scale);
}

/** Mark plus wordmark, the same pair the navbar draws. */
function Lockup({
  scale,
  markColor,
  creedColor,
  vaColor,
  descriptor,
  descriptorColor,
}: {
  scale: number;
  markColor: string;
  creedColor: string;
  vaColor: string;
  descriptor?: string;
  descriptorColor?: string;
}) {
  const mark = brandMarkDataUrl(markColor);
  const size = Math.round(BASE.mark * scale);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.34) }}>
      {mark ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/image is unsupported in ImageResponse
        <img src={mark} alt="" width={size} height={Math.round(size * 1.13)} />
      ) : null}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: Math.round(38 * scale),
            fontWeight: 800,
            letterSpacing: Math.round(-0.02 * 38 * scale),
            lineHeight: 1.1,
          }}
        >
          <span style={{ color: creedColor }}>Creeda</span>
          <span style={{ color: vaColor }}>VA</span>
        </div>
        {descriptor ? (
          <div
            style={{
              display: "flex",
              marginTop: Math.round(8 * scale),
              fontSize: Math.round(15 * scale),
              fontWeight: 600,
              letterSpacing: Math.round(15 * scale * 0.2),
              textTransform: "uppercase",
              color: descriptorColor ?? BRAND_COLORS.mute,
            }}
          >
            {descriptor}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Headline({
  text,
  scale,
  color,
  maxWidth,
}: {
  text: string;
  scale: number;
  color: string;
  maxWidth?: number | string;
}) {
  if (!text) return null;
  return (
    <div
      style={{
        display: "flex",
        fontSize: Math.round(BASE.headline * scale),
        fontWeight: 800,
        lineHeight: 1.07,
        letterSpacing: Math.round(-0.03 * BASE.headline * scale),
        color,
        maxWidth,
      }}
    >
      {text}
    </div>
  );
}

function Supporting({
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
        fontSize: Math.round(BASE.supporting * scale),
        fontWeight: 500,
        lineHeight: 1.35,
        color,
      }}
    >
      {text}
    </div>
  );
}

/** Footer line: a green call to action left, the domain right. */
function Footer({
  cta,
  footnote,
  scale,
  ctaColor,
  footnoteColor,
  ruleColor,
}: {
  cta: string;
  footnote: string;
  scale: number;
  ctaColor: string;
  footnoteColor: string;
  ruleColor: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{ display: "flex", height: Math.max(1, Math.round(scale)), background: ruleColor }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: Math.round(24 * scale),
          gap: Math.round(20 * scale),
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: Math.round(BASE.cta * scale),
            fontWeight: 700,
            color: ctaColor,
            letterSpacing: Math.round(-0.01 * BASE.cta * scale),
          }}
        >
          {cta}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: Math.round(BASE.footnote * scale),
            fontWeight: 500,
            color: footnoteColor,
          }}
        >
          {footnote}
        </div>
      </div>
    </div>
  );
}

/** Cream ground, brand type — the house composition. */
function Statement({ copy, scale }: { copy: MarketingCopy; scale: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Lockup
        scale={scale}
        markColor={BRAND_COLORS.brand}
        creedColor={BRAND_COLORS.brand}
        vaColor={BRAND_COLORS.ink}
        descriptor={copy.eyebrow}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: Math.round(26 * scale),
          paddingBlock: Math.round(30 * scale),
        }}
      >
        <Headline text={copy.headline} scale={scale} color={BRAND_COLORS.ink} maxWidth="94%" />
        <Supporting text={copy.supporting} scale={scale} color={BRAND_COLORS.mute} />
      </div>

      <Footer
        cta={copy.cta}
        footnote={copy.footnote}
        scale={scale}
        ctaColor={BRAND_COLORS.brand}
        footnoteColor={BRAND_COLORS.mute}
        ruleColor={BRAND_COLORS.rule}
      />
    </div>
  );
}

/**
 * Same ground, but the call to action sits in a solid green band.
 *
 * The mark keeps its green: recolouring it cream and back for one template
 * would make this the odd card in a set. The band supplies the emphasis.
 */
function Offer({ copy, scale }: { copy: MarketingCopy; scale: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Lockup
        scale={scale}
        markColor={BRAND_COLORS.brand}
        creedColor={BRAND_COLORS.brand}
        vaColor={BRAND_COLORS.ink}
        descriptor={copy.eyebrow}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: Math.round(24 * scale),
        }}
      >
        <Headline text={copy.headline} scale={scale} color={BRAND_COLORS.ink} maxWidth="96%" />
        <Supporting text={copy.supporting} scale={scale} color={BRAND_COLORS.mute} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: BRAND_COLORS.brand,
          borderRadius: Math.round(18 * scale),
          padding: `${Math.round(26 * scale)}px ${Math.round(34 * scale)}px`,
          gap: Math.round(20 * scale),
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: Math.round(BASE.cta * scale),
            fontWeight: 700,
            color: BRAND_COLORS.paper,
          }}
        >
          {copy.cta}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: Math.round(BASE.footnote * scale),
            fontWeight: 500,
            color: BRAND_COLORS.paper,
          }}
        >
          {copy.footnote}
        </div>
      </div>
    </div>
  );
}

function List({
  copy,
  scale,
}: {
  copy: MarketingCopy;
  scale: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Lockup
        scale={scale}
        markColor={BRAND_COLORS.brand}
        creedColor={BRAND_COLORS.brand}
        vaColor={BRAND_COLORS.ink}
        descriptor={copy.eyebrow}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: Math.round(38 * scale),
        }}
      >
        <Headline text={copy.headline} scale={scale} color={BRAND_COLORS.ink} maxWidth="94%" />

        <div style={{ display: "flex", flexDirection: "column", gap: Math.round(22 * scale) }}>
          {copy.items.map((item, index) => (
            <div
              key={`${index}-${item}`}
              style={{ display: "flex", alignItems: "flex-start", gap: Math.round(20 * scale) }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: Math.round(26 * scale),
                  fontWeight: 800,
                  color: BRAND_COLORS.brand,
                  lineHeight: 1.2,
                  minWidth: Math.round(34 * scale),
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: Math.round(31 * scale),
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: BRAND_COLORS.ink,
                }}
              >
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          fontSize: Math.round(BASE.footnote * scale),
          fontWeight: 500,
          color: BRAND_COLORS.mute,
        }}
      >
        {copy.footnote}
      </div>
    </div>
  );
}

function Stat({ copy, scale }: { copy: MarketingCopy; scale: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Lockup
        scale={scale}
        markColor={BRAND_COLORS.brand}
        creedColor={BRAND_COLORS.brand}
        vaColor={BRAND_COLORS.ink}
        descriptor={copy.eyebrow}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: Math.round(18 * scale),
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: Math.round(BASE.headline * 2.1 * scale),
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: Math.round(-0.04 * BASE.headline * 2.1 * scale),
            color: BRAND_COLORS.brand,
          }}
        >
          {copy.headline}
        </div>
        <Supporting text={copy.supporting} scale={scale} color={BRAND_COLORS.ink} />
      </div>

      <Footer
        cta={copy.cta}
        footnote={copy.footnote}
        scale={scale}
        ctaColor={BRAND_COLORS.brand}
        footnoteColor={BRAND_COLORS.mute}
        ruleColor={BRAND_COLORS.rule}
      />
    </div>
  );
}

/**
 * Brand panel and message, side by side — or stacked when the canvas is taller
 * than it is wide, because a 1080-wide panel leaves no room for a headline
 * beside it.
 */
function Split({
  copy,
  scale,
  width,
  height,
}: {
  copy: MarketingCopy;
  scale: number;
  width: number;
  height: number;
}) {
  const stacked = height > width;
  const panelShare = stacked ? 0.38 : 0.42;
  const mark = brandMarkDataUrl(BRAND_COLORS.paper);

  const panel = (
    <div
      style={{
        display: "flex",
        background: BRAND_COLORS.brand,
        flex: stacked ? undefined : `0 0 ${panelShare * 100}%`,
        height: stacked ? Math.round(height * panelShare) : undefined,
        width: stacked ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: Math.round(20 * scale),
        padding: Math.round(28 * scale),
      }}
    >
      {mark ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/image is unsupported in ImageResponse
        <img
          src={mark}
          alt=""
          width={Math.round(BASE.mark * 1.25 * scale)}
          height={Math.round(BASE.mark * 1.41 * scale)}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          fontSize: Math.round(30 * scale),
          fontWeight: 800,
          letterSpacing: Math.round(-0.02 * 30 * scale),
          color: BRAND_COLORS.paper,
        }}
      >
        CreedaVA
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        flex: 1,
        borderRadius: Math.round(24 * scale),
        overflow: "hidden",
      }}
    >
      {panel}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
          padding: Math.round(46 * scale),
          gap: Math.round(24 * scale),
        }}
      >
        <Headline text={copy.headline} scale={scale * 0.82} color={BRAND_COLORS.ink} />
        <div style={{ display: "flex", flexDirection: "column", gap: Math.round(18 * scale) }}>
          <Supporting text={copy.supporting} scale={scale} color={BRAND_COLORS.mute} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `${Math.max(1, Math.round(scale))}px solid ${BRAND_COLORS.rule}`,
              paddingTop: Math.round(20 * scale),
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: Math.round(BASE.cta * scale),
                fontWeight: 700,
                color: BRAND_COLORS.brand,
              }}
            >
              {copy.cta}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: Math.round(BASE.footnote * scale),
                fontWeight: 500,
                color: BRAND_COLORS.mute,
              }}
            >
              {copy.footnote}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Draw one marketing graphic. */
export function marketingImage(
  template: TemplateId,
  format: MarketingFormat,
  copy: MarketingCopy,
): ImageResponse {
  const { width, height } = FORMATS[format];
  const scale = typeScale(width, height);
  const pad = padding(scale);
  // `split` paints its own panel edge to edge, so it gets a thinner frame.
  const inset = template === "split" ? Math.round(pad * 0.55) : pad;

  const body = (() => {
    switch (template) {
      case "offer":
        return <Offer copy={copy} scale={scale} />;
      case "list":
        return <List copy={copy} scale={scale} />;
      case "stat":
        return <Stat copy={copy} scale={scale} />;
      case "split":
        return <Split copy={copy} scale={scale} width={width} height={height} />;
      default:
        return <Statement copy={copy} scale={scale} />;
    }
  })();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: BRAND_COLORS.paper,
          padding: inset,
          fontFamily: "sans-serif",
        }}
      >
        {body}
      </div>
    ),
    { width, height },
  );
}
