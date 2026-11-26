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
export type LayoutId = "hero" | "band" | "split";

export const LAYOUTS: Record<LayoutId, string> = {
  hero: "full-bleed photo, headline across the bottom over a gradient scrim",
  band: "full-bleed photo with a solid brand band across the bottom holding the headline",
  split: "photo on one side, solid brand panel with the headline on the other",
};

export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];

export function isLayout(value: string): value is LayoutId {
  return Object.hasOwn(LAYOUTS, value);
}

/** Where the photo in the composition comes from. */
export type PhotoSource = "library" | "custom";

export interface Design {
  layout: LayoutId;
  /** Small label above the headline. */
  eyebrow: string;
  /** The main line. Short: at most {@link LIMITS.headline} characters. */
  headline: string;
  subhead: string;
  cta: string;
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
  cta: 24,
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
 * Deliberately style-agnostic: it fixes colours, wording and honesty, and says
 * nothing about the composition. That is the model's decision, per brief.
 */
const BRAND_RULES = `BRAND
- Palette: brand green ${BRAND.green}, ink ${BRAND.ink}, paper ${BRAND.paper}, muted slate ${BRAND.mute}, hairline ${BRAND.rule}. The renderer applies these; do not describe them.
- CreedaVA is a managed virtual-assistant company in Belize serving small businesses in the United States. Real people, not software. Bilingual English and Spanish.
- Never invent statistics, percentages, review scores, client names, awards, prices or testimonials. If the brief contains no number, the design contains no number.
- Never put a phone number, email address, URL or QR code in the design. Contact details change and an image cannot be corrected afterwards.`;

/** Purpose-built so the reply is JSON the route can trust. */
export function buildPlanPrompt(brief: string): string {
  return `You are the social content director for CreedaVA. You design one social post.

BRIEF
${brief}

${BRAND_RULES}

HOW THESE POSTS LOOK
One photograph fills the frame. A few very large words sit on top of it. That is the whole design. No bullet lists, no feature grids, no paragraphs — this is an advertisement, not a web page.

CHOOSING THE COMPOSITION
- hero: ${LAYOUTS.hero}
- band: ${LAYOUTS.band}
- split: ${LAYOUTS.split}

CHOOSING THE PHOTO
Every design has a photo.
- "library" — a curated photo fits. Choose one id from the list below.
- "custom" — nothing in the library matches; describe the scene to draw.

LIBRARY PHOTO IDS
${PHOTO_MENU}

Return ONLY valid JSON, no markdown fence, matching exactly:
{
  "concept": "one sentence naming the idea",
  "design": {
    "layout": "hero | band | split",
    "eyebrow": "2-3 words, uppercase label, or empty",
    "headline": "the main line, three to six words",
    "subhead": "one short supporting line, or empty",
    "cta": "2-3 words, or empty",
    "photoSource": "library | custom",
    "photoId": "photo id from the list when photoSource is library, else empty",
    "photoBrief": "scene for the image model when photoSource is custom, else empty"
  },
  "caption": "2-4 sentences for the post body, no hashtags",
  "hashtags": ["lowercase", "no leading #", "up to 8"]
}

RULES
- The headline is a statement, not a description of the design. Cut it until it hurts: three to six words, never more than ${LIMITS.headline} characters.
- Do not enumerate features. One idea per post.
- The headline must make sense to someone who never reads the caption.`;
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
 * Turn a design object into one the renderer can draw.
 *
 * The only correction made is to the photo: a curated id that is not in the
 * menu cannot be fetched, so that design falls through to a drawn scene. An
 * unknown layout falls back to `hero`, which carries a photo like the others.
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

  return {
    layout: isLayout(String(source.layout))
      ? (source.layout as LayoutId)
      : "hero",
    eyebrow: text(source.eyebrow, LIMITS.eyebrow),
    headline: text(source.headline, LIMITS.headline),
    subhead: text(source.subhead, LIMITS.subhead),
    cta: text(source.cta, LIMITS.cta),
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
