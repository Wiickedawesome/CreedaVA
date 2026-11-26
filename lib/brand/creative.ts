/**
 * Social creative — the brief goes in, a design spec and captions come out.
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
 * Also why the admin does not pick a layout: the model chooses from the brief,
 * so it is free to pick the one the post needs.
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

/** Composition families the renderer can draw. */
export type LayoutId = "hero" | "split" | "stat" | "list" | "quote";

export const LAYOUTS: Record<LayoutId, string> = {
  hero: "full-bleed photo, headline across the bottom over a scrim",
  split: "solid brand panel beside a photo, headline on the panel",
  stat: "one large figure, made unmissable",
  list: "headline plus three numbered points",
  quote: "a single statement set large, no photo",
};

export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];

export function isLayout(value: string): value is LayoutId {
  return Object.hasOwn(LAYOUTS, value);
}

/** Where the photo in the composition comes from. */
export type PhotoSource = "library" | "custom" | "none";

export interface Design {
  layout: LayoutId;
  /** Small label above the headline. */
  eyebrow: string;
  headline: string;
  subhead: string;
  /** The figure, for the `stat` layout. */
  stat: string;
  /** Numbered points, for the `list` layout. */
  items: string[];
  cta: string;
  /**
   * `library` uses a curated Unsplash photo id (no API key, no rate limit),
   * `custom` draws one with the image model, `none` is type alone.
   */
  photoSource: PhotoSource;
  /** Curated photo id when `photoSource` is `library`. */
  photoId: string;
  /** What the image model should draw when `photoSource` is `custom`. */
  photoBrief: string;
}

export type Platform = "facebook" | "linkedin" | "instagram";

export const PLATFORMS: readonly { id: Platform; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
];

export function isPlatform(value: string): value is Platform {
  return PLATFORMS.some((platform) => platform.id === value);
}

export type Tone = "warm" | "direct" | "professional" | "playful";

export const TONES: readonly { id: Tone; label: string }[] = [
  { id: "warm", label: "Warm" },
  { id: "direct", label: "Direct" },
  { id: "professional", label: "Professional" },
  { id: "playful", label: "Playful" },
];

export function isTone(value: string): value is Tone {
  return TONES.some((tone) => tone.id === value);
}

export interface Captions {
  facebook: string;
  linkedin: string;
  instagram: string;
}

export interface CreativePlan {
  /** One sentence naming the idea, so a set of runs stays distinguishable. */
  concept: string;
  design: Design;
  captions: Captions;
  hashtags: string[];
}

export const LIMITS = {
  brief: 1200,
  concept: 160,
  eyebrow: 34,
  headline: 90,
  subhead: 150,
  stat: 18,
  item: 60,
  items: 4,
  cta: 30,
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
export function buildPlanPrompt(brief: string, tone: Tone): string {
  return `You are the social content director for CreedaVA. You design one social post.

BRIEF
${brief}

TONE
${tone}

${BRAND_RULES}

CHOOSING THE COMPOSITION
Pick the layout the brief actually needs. Do not default to one.
- hero: ${LAYOUTS.hero}
- split: ${LAYOUTS.split}
- stat: ${LAYOUTS.stat}
- list: ${LAYOUTS.list}
- quote: ${LAYOUTS.quote}

CHOOSING THE PHOTO
- "library" — a curated photo fits. Choose one id from the list below.
- "custom" — nothing in the library matches; describe the scene to draw. Use this for mockups, diagrams or a very specific scene.
- "none" — type alone is stronger. Preferred for stat, list and most quote posts.

LIBRARY PHOTO IDS
${PHOTO_MENU}

Return ONLY valid JSON, no markdown fence, matching exactly:
{
  "concept": "one sentence naming the idea",
  "design": {
    "layout": "hero | split | stat | list | quote",
    "eyebrow": "2-4 words, uppercase label, or empty",
    "headline": "the main line, at most 8 words",
    "subhead": "one supporting sentence, or empty",
    "stat": "a figure that appears in the brief, or empty",
    "items": ["first point", "second point", "third point"],
    "cta": "2-4 words, or empty",
    "photoSource": "library | custom | none",
    "photoId": "photo id from the list, or empty",
    "photoBrief": "scene for the image model when photoSource is custom, else empty"
  },
  "captions": {
    "facebook": "2-4 sentences, conversational, no hashtags",
    "linkedin": "2-4 sentences, professional but human, no hashtags",
    "instagram": "1-3 sentences, light, no hashtags"
  },
  "hashtags": ["lowercase", "no leading #", "up to 8"]
}

RULES
- "items" only matters for list, and must then have exactly three entries.
- "stat" only matters for stat, and must be a figure written in the brief. Never invent one; if the brief has no number, choose a different layout.
- Fill the fields the chosen layout uses and leave the rest empty.
- The headline is a statement, not a description of the design.`;
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

function parsePhotoSource(value: unknown): PhotoSource {
  return value === "custom" || value === "none" ? value : "library";
}

/**
 * Turn a design object into one the renderer can draw.
 *
 * Layouts are downgraded rather than trusted: a `stat` with no figure would
 * draw an empty centre, and a `list` with fewer than two points would leave
 * gaps, so both become a `quote`. A photo source that cannot produce a photo
 * becomes `none`, which is type alone rather than a blank slot.
 */
function parseDesign(value: unknown): Design {
  const source =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const items = Array.isArray(source.items)
    ? source.items
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, LIMITS.item))
        .filter(Boolean)
        .slice(0, LIMITS.items)
    : [];

  let layout: LayoutId = isLayout(String(source.layout))
    ? (source.layout as LayoutId)
    : "quote";
  const stat = text(source.stat, LIMITS.stat);

  if (layout === "stat" && !stat) layout = "quote";
  if (layout === "list" && items.length < 2) layout = "quote";

  const photoId = text(source.photoId, 80);
  const photoBrief = text(source.photoBrief, LIMITS.photoBrief);
  let photoSource = parsePhotoSource(source.photoSource);

  if (photoSource === "library" && !PHOTO_IDS.has(photoId)) {
    photoSource = photoBrief ? "custom" : "none";
  }
  if (photoSource === "custom" && !photoBrief) photoSource = "none";
  // `quote` is defined as type alone.
  if (layout === "quote") photoSource = "none";

  return {
    layout,
    eyebrow: text(source.eyebrow, LIMITS.eyebrow),
    headline: text(source.headline, LIMITS.headline),
    subhead: text(source.subhead, LIMITS.subhead),
    stat,
    items,
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
  const design = parseDesign(source.design);
  const rawCaptions =
    typeof source.captions === "object" && source.captions !== null
      ? (source.captions as Record<string, unknown>)
      : {};

  const plan: CreativePlan = {
    concept: text(source.concept, LIMITS.concept),
    design,
    captions: {
      facebook: text(rawCaptions.facebook, LIMITS.caption),
      linkedin: text(rawCaptions.linkedin, LIMITS.caption),
      instagram: text(rawCaptions.instagram, LIMITS.caption),
    },
    hashtags: clampHashtags(source.hashtags),
  };

  // Without a headline there is nothing to draw, and without any caption there
  // is nothing to post. Either way the plan is unusable.
  if (!plan.design.headline) return null;
  if (!Object.values(plan.captions).some(Boolean)) return null;
  return plan;
}

/**
 * Instruction for the image model, used only when `photoSource` is `custom`.
 *
 * The photo is a *slot* inside the composition, so this asks for a plain plate
 * with no lettering — the renderer adds every word.
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
- Leave the middle and lower area relatively uncluttered so overlaid type stays readable.
- Restrained palette leaning toward deep green, ink navy and warm off-white.

EXCLUDE
- No text, letters, numbers, logos, watermarks, interface chrome or captions of any kind.
- No recognisable real person, no celebrity likeness.
- No phone numbers, URLs or QR codes.`;
}

/**
 * Filename for a download, so a folder of exports stays readable.
 *
 * The size is truthful here: the renderer owns the canvas, so a portrait export
 * really is 1080×1350. (A model-drawn image is not, which is why this is only
 * used for rendered creatives.)
 */
export function creativeFilename(format: CreativeFormat, index = 0): string {
  const spec = FORMATS[format];
  return `creedava-${format}-${spec.width}x${spec.height}-${index + 1}.png`;
}
