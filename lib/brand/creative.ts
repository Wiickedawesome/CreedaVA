/**
 * Social creative — the brief goes in, a design spec and a caption come out.
 *
 * Pure: no React, no SDK, no renderer. The route imports this to build prompts
 * and validate what the model returned; the studio imports it for its pickers.
 *
 * Why a design spec instead of one giant prompt: a diffusion model decides
 * composition and lettering in the same pass, and lettering is the part it
 * cannot do. Ask it for a headline and you get a moody photo with no words, or
 * words spelled wrong. So the model decides the *design* — angle, wording,
 * which composition family, where the photo sits — and a renderer draws it
 * with real type, which keeps the text legible and the range open.
 *
 * Every composition is photo-led. A previous version offered flat type-only
 * layouts and the model reached for them, which produced slide decks on a cream
 * page rather than the photograph-and-big-type posts a social feed rewards.
 */

import { THUMBNAIL_PHOTOS } from "@/lib/constants/blog-images";

/** Colours, matching the design system's marketing tokens. */
export const BRAND = {
  paper: "#F7F7F2",
  ink: "#0B2135",
  green: "#005148",
  mute: "#566B85",
  rule: "#E2E2DE",
} as const;

/**
 * Canvas shapes. Aspect ratio is what determines the output shape; the model
 * picks the resolution for a given ratio, so no pixel size is promised here.
 */
export type CreativeFormat = "feed" | "portrait" | "story" | "landscape";

export interface FormatSpec {
  label: string;
  usage: string;
  /** Colon form — the image API rejects the CSS slash. */
  aspectRatio: string;
  /** Canvas size, and the crop requested for a photo. */
  width: number;
  height: number;
}

export const FORMATS: Record<CreativeFormat, FormatSpec> = {
  feed: {
    label: "Feed",
    usage: "Facebook & LinkedIn",
    aspectRatio: "1:1",
    width: 1080,
    height: 1080,
  },
  portrait: {
    label: "Portrait",
    usage: "Instagram feed",
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
  },
  story: {
    label: "Story",
    usage: "Instagram & Facebook stories",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
  },
  landscape: {
    label: "Landscape",
    usage: "Link preview and X",
    aspectRatio: "16:9",
    width: 1200,
    height: 630,
  },
};

export const FORMAT_IDS = Object.keys(FORMATS) as CreativeFormat[];

export function isFormat(value: string): value is CreativeFormat {
  return Object.hasOwn(FORMATS, value);
}

/** Composition families the renderer can draw. All of them carry a photo. */
export type LayoutId = "overlay" | "duotone" | "split" | "stack" | "inset";

export const LAYOUTS: Record<LayoutId, string> = {
  overlay: "photo fills the frame, type sits over a soft gradient scrim",
  duotone: "photo fills the frame under a strong colour wash, type large on top",
  split: "hard 50/50 division, photo one side and a solid colour field the other",
  stack: "photo fills the frame, a slim solid colour bar across the bottom holds the type",
  inset: "solid colour field with the photo inset as a framed print, type beside or below",
};

export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];

export function isLayout(value: string): value is LayoutId {
  return Object.hasOwn(LAYOUTS, value);
}

/** Where the type sits inside the frame, for the frames that allow movement. */
export type Anchor = "top" | "middle" | "bottom";

export const ANCHORS: readonly Anchor[] = ["top", "middle", "bottom"];

export function isAnchor(value: string): value is Anchor {
  return (ANCHORS as readonly string[]).includes(value);
}

export type Align = "left" | "center";

export function isAlign(value: string): value is Align {
  return value === "left" || value === "center";
}

/**
 * Colour fields the composition can be built on.
 *
 * A marked step away from the old single brand palette: the reference work this
 * is modelled on varies its ground colour per post — near-black, cream, sand,
 * navy, plum — and only one of those happened to be the brand green. Forcing
 * green on every render is what made every render look the same.
 *
 * Every pair is a real, measured combination: `field` came from the dominant
 * cluster of a reference image and `type` is the colour that reads on it.
 */
export interface Palette {
  field: string;
  type: string;
  accent: string;
}

export const PALETTES = {
  noir: { field: "#12151C", type: "#F7F7F2", accent: "#C6DAEA" },
  cream: { field: "#F2EDE7", type: "#1D1E23", accent: "#5F6291" },
  sand: { field: "#F6F0E4", type: "#3A2E24", accent: "#6C5B4F" },
  navy: { field: "#0B2045", type: "#F6FAFE", accent: "#C6DAEA" },
  brand: { field: BRAND.green, type: BRAND.paper, accent: "#8CBAB5" },
  plum: { field: "#2D1A47", type: "#F2EDE7", accent: "#E4C8C5" },
  mint: { field: "#8CBAB5", type: BRAND.ink, accent: BRAND.paper },
} as const satisfies Record<string, Palette>;

export type PaletteId = keyof typeof PALETTES;

export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];

export function isPalette(value: string): value is PaletteId {
  return Object.hasOwn(PALETTES, value);
}

/** Where the photo in the composition comes from. */
export type PhotoSource = "library" | "custom";

export interface Design {
  frame: LayoutId;
  palette: PaletteId;
  anchor: Anchor;
  align: Align;
  /** Small label above the headline. */
  eyebrow: string;
  /** The main line. Short: at most {@link LIMITS.headline} characters. */
  headline: string;
  subhead: string;
  /**
   * `library` uses a curated Unsplash photo id (no API key, no rate limit),
   * `custom` draws one with the image model.
   */
  photoSource: PhotoSource;
  /** Curated photo id when `photoSource` is `library`. */
  photoId: string;
  /** What the image model should draw when `photoSource` is `custom`. */
  photoBrief: string;
}

export interface CreativePlan {
  /** One sentence naming the idea, so a set of runs stays distinguishable. */
  concept: string;
  design: Design;
  caption: string;
  hashtags: string[];
}

export const LIMITS = {
  brief: 1200,
  concept: 160,
  eyebrow: 28,
  headline: 42,
  subhead: 90,
  photoBrief: 300,
  caption: 2200,
  hashtags: 12,
  hashtag: 40,
} as const;

/** The photo ids the model may choose from, rendered into the prompt. */
const PHOTO_MENU = THUMBNAIL_PHOTOS.map(
  (photo) => `  ${photo.id} — ${photo.label}`,
).join("\n");

/**
 * Brand rules that hold for every composition.
 *
 * Fixes wording and honesty only. The visual design is chosen in `chooseStyle`,
 * because the model would not vary it.
 */
const BRAND_RULES = `BRAND
- CreedaVA is a managed virtual-assistant company in Belize serving small businesses in the United States. Real people, not software. Bilingual English and Spanish.
- Never invent statistics, percentages, review scores, client names, awards, prices or testimonials. If the brief contains no number, the design contains no number.
- Never put a phone number, email address, URL or QR code in the design. Contact details change and an image cannot be corrected afterwards.`;

/** Purpose-built so the reply is JSON the route can trust. */
export function buildPlanPrompt(brief: string, angle?: string): string {
  return `You are the art director for CreedaVA. You design one social image.

BRIEF
${brief}
${angle ? `\nSTARTING POINT\nThe art director likes ${angle} for this one. Follow it unless the brief clearly wants something else.\n` : ""}
${BRAND_RULES}

WHAT THIS IS
A marketing image: one photograph, a handful of very large words, and a ground
colour. Not a web page, not a slide. No bullet lists, no feature grids, no
paragraphs, no buttons.

CHOOSING THE FRAME AND PALETTE
Those are set by the art director, not by you. Do not describe them. Decide only
the words, the photo and where the type sits.

CHOOSING THE PHOTO
- "library" — a curated photo genuinely fits. Choose one id from the list below.
- "custom" — nothing in the library matches the subject. Describe the scene to photograph.
If the brief is about a season, a place, or anything the library has no photo
of, use custom. Do not force an office photo onto a subject that is not an office.

LIBRARY PHOTO IDS
${PHOTO_MENU}

Return ONLY valid JSON, no markdown fence, matching exactly:
{
  "concept": "one sentence naming the idea",
  "design": {
    "anchor": "top | middle | bottom",
    "align": "left | center",
    "eyebrow": "2-3 words, uppercase label, or empty",
    "headline": "the main line, three to six words",
    "subhead": "one short supporting line, or empty",
    "photoSource": "library | custom",
    "photoId": "photo id from the list when photoSource is library, else empty",
    "photoBrief": "scene for the image model when photoSource is custom, else empty"
  },
  "caption": "2-4 sentences for the post body, no hashtags",
  "hashtags": ["lowercase", "no leading #", "up to 8"]
}

RULES
- The headline is a statement, not a description of the design. Cut it until it hurts: three to six words, never more than ${LIMITS.headline} characters.
- One idea per post. Do not enumerate features.
- The headline must make sense to someone who never reads the caption.
- "anchor" decides where the words sit. "top" and "middle" are as valid as "bottom" — a poster often centres, and an editorial image often leads at the top.
- "align" is a real design choice. Centred reads as a poster; left reads as editorial.`;
}

/** Strip a markdown fence and any prose around the object. */
function extractJson(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return body.slice(start, end + 1);
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function clampHashtags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) =>
      tag
        .replace(/^#+/, "")
        .replace(/\s+/g, "")
        .trim()
        .slice(0, LIMITS.hashtag),
    )
    .filter((tag) => tag.length > 0)
    .slice(0, LIMITS.hashtags);
}

const PHOTO_IDS = new Set(THUMBNAIL_PHOTOS.map((photo) => photo.id));

/**
 * Choose the visual style for a brief.
 *
 * Deliberately NOT a model decision. The planner was offered five frames and
 * seven palettes and ignored them: four different briefs all came back
 * `overlay` / `brand`, which is the "same template every time" failure this
 * frame set exists to fix. Models are reliable about words and unreliable about
 * honouring a menu of visual options.
 *
 * The frame and the palette are drawn from independent parts of the hash rather
 * than from `hash % n` twice. Using one modulus for both correlated them: with
 * the frame taken from `hash % 5` and the palette from `hash / 5 % 7`, four
 * briefs landed on only two frames. Two separate mixes decorrelate them.
 *
 * `previous` is honoured when re-rolling the same brief, so "Design another"
 * actually gives a different design instead of the same one again.
 */
export function chooseStyle(
  brief: string,
  previous?: { frame: LayoutId; palette: PaletteId },
): { frame: LayoutId; palette: PaletteId } {
  // FNV-1a, then a fresh random salt so a re-run of the same brief varies.
  let hash = 0x811c9dc5;
  for (let i = 0; i < brief.length; i += 1) {
    hash ^= brief.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash = (hash ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;

  // Two independent avalanches over the same input.
  const mix = (seed: number, salt: number): number => {
    let h = seed ^ salt;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  };

  const frames = LAYOUT_IDS;
  const palettes = PALETTE_IDS;
  let frame = frames[mix(hash, 0x9e3779b9) % frames.length];
  let palette = palettes[mix(hash, 0x85ebca6b) % palettes.length];

  if (previous && frames.length > 1 && frame === previous.frame) {
    frame = frames[(frames.indexOf(frame) + 1) % frames.length];
  }
  if (previous && palettes.length > 1 && palette === previous.palette) {
    palette = palettes[(palettes.indexOf(palette) + 1) % palettes.length];
  }
  return { frame, palette };
}

/**
 * Turn a design object into one the renderer can draw.
 *
 * The only correction made is to the photo: a curated id that is not in the
 * menu cannot be fetched, so that design falls through to a drawn scene. An
 * unknown frame, palette, anchor or alignment falls back to a safe default
 * rather than failing the whole render.
 */
function parseDesign(value: unknown): Design {
  const source =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const photoId = text(source.photoId, 80);
  const photoBrief = text(source.photoBrief, LIMITS.photoBrief);
  const photoSource: PhotoSource =
    source.photoSource === "custom" || !PHOTO_IDS.has(photoId)
      ? "custom"
      : "library";

  const frame = isLayout(String(source.frame))
    ? (source.frame as LayoutId)
    : "overlay";
  const palette = isPalette(String(source.palette))
    ? (source.palette as PaletteId)
    : "brand";
  const anchor = isAnchor(String(source.anchor))
    ? (source.anchor as Anchor)
    : "bottom";
  const align = isAlign(String(source.align))
    ? (source.align as Align)
    : "left";

  return {
    frame,
    palette,
    anchor,
    align,
    eyebrow: text(source.eyebrow, LIMITS.eyebrow),
    headline: text(source.headline, LIMITS.headline),
    subhead: text(source.subhead, LIMITS.subhead),
    photoSource,
    photoId: photoSource === "library" ? photoId : "",
    photoBrief: photoSource === "custom" ? photoBrief : "",
  };
}

/**
 * Turn the model's reply into a plan, or null.
 *
 * Everything is clamped and checked: the reply is model output, so an
 * unexpected shape must fail here rather than inside the renderer.
 */
export function parsePlan(raw: string): CreativePlan | null {
  const json = extractJson(raw);
  if (!json) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const source = parsed as Record<string, unknown>;
  const plan: CreativePlan = {
    concept: text(source.concept, LIMITS.concept),
    design: parseDesign(source.design),
    caption: text(source.caption, LIMITS.caption),
    hashtags: clampHashtags(source.hashtags),
  };

  // Without a headline there is nothing to draw, and without a caption there
  // is nothing to post. Either way the plan is unusable.
  if (!plan.design.headline) return null;
  if (!plan.caption) return null;
  return plan;
}

/**
 * Instruction for the image model, used only when `photoSource` is `custom`.
 *
 * The photo sits behind the composition, so this asks for a plain plate with no
 * lettering — the renderer adds every word.
 */
export function buildPhotoPrompt(
  design: Design,
  format: CreativeFormat,
): string {
  const spec = FORMATS[format];
  return `A photograph for the background of a social media post, ${spec.width} by ${spec.height} pixels, aspect ratio ${spec.aspectRatio}.

SUBJECT
${design.photoBrief}

TREATMENT
- Editorial and calm. Real, believable lighting. Shallow depth of field where it helps.
- Leave the lower third relatively uncluttered so overlaid type stays readable.
- Restrained palette leaning toward deep green, ink navy and warm off-white.

EXCLUDE
- No text, letters, numbers, logos, watermarks, interface chrome or captions of any kind.
- No recognisable real person, no celebrity likeness.
- No phone numbers, URLs or QR codes.`;
}

/**
 * Filename for a download, so a folder of exports stays readable.
 *
 * The size is truthful: the renderer owns the canvas, so a portrait export
 * really is 1080×1350.
 */
export function creativeFilename(format: CreativeFormat, index = 0): string {
  const spec = FORMATS[format];
  return `creedava-${format}-${spec.width}x${spec.height}-${index + 1}.png`;
}
