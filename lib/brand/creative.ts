/**
 * Social creative — the data behind the studio's one workflow.
 *
 * Pure: no React, no SDK. The route imports this to build prompts and to
 * validate a plan; the page imports it for the format and tone pickers.
 *
 * Why there are no layout templates here: a template set can only produce the
 * kinds of image someone thought of in advance. The model composes each piece
 * from the brief instead. Brand safety comes from two places that work on any
 * composition — the palette and rules in the prompt, and the real logo passed
 * as a reference image — not from constraining the layout.
 */

/** Colours, matching the design system's marketing tokens. */
export const BRAND = {
  paper: "#F7F7F2",
  ink: "#0B2135",
  green: "#005148",
  mute: "#566B85",
  rule: "#E2E2DE",
} as const;

/** Sizes, using aspect ratios the image model documents as supported. */
export type CreativeFormat = "feed" | "portrait" | "story" | "landscape";

export interface FormatSpec {
  label: string;
  usage: string;
  /** Colon form — the API rejects the CSS slash. */
  aspectRatio: string;
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

/** What the text model returns, and what the studio shows. */
export interface CreativePlan {
  /** One line naming the idea, so a set of runs stays distinguishable. */
  concept: string;
  /** The full instruction handed to the image model. */
  imagePrompt: string;
  /** Words to appear inside the image. Empty when the image needs none. */
  onImageText: string;
  captions: Captions;
  hashtags: string[];
}

export const LIMITS = {
  brief: 1200,
  concept: 160,
  imagePrompt: 2000,
  onImageText: 90,
  caption: 2200,
  hashtags: 12,
  hashtag: 40,
} as const;

/**
 * Brand rules that hold for every composition.
 *
 * Deliberately style-agnostic: it fixes colours, honesty and logo handling, and
 * says nothing about whether the image is a photo, a diagram, a mockup or a
 * collage. That is the model's decision, per brief.
 */
const BRAND_RULES = `BRAND
- Palette, and nothing outside it: brand green ${BRAND.green}, ink ${BRAND.ink}, paper ${BRAND.paper}, muted slate ${BRAND.mute}, hairline ${BRAND.rule}. Neutrals and skin tones may appear inside photographs.
- CreedaVA is a managed virtual-assistant company in Belize working with small businesses in the United States. Real people, not software. Bilingual English and Spanish.
- Never invent statistics, percentages, review scores, client names, awards, prices or testimonials. If the brief contains no number, the image contains no number.
- Never render a phone number, email address, URL or QR code. Contact details change and a stale one in an image cannot be corrected.
- Do not depict a specific real person or a recognisable individual's likeness.`;

/** Purpose-built around producing JSON the route can trust. */
export function buildPlanPrompt(brief: string, tone: Tone): string {
  return `You are the social content director for CreedaVA.

BRIEF
${brief}

TONE
${tone}

${BRAND_RULES}

Produce one post. Choose the visual form the brief actually needs — an editorial photograph, a diagram or infographic, a product-style mockup of a screen or workspace, a typographic statement, a collage, or something else. Do not default to a diagram.

Return ONLY valid JSON, no markdown fence, matching exactly:
{
  "concept": "one sentence naming the idea",
  "imagePrompt": "a complete, self-contained instruction for an image model",
  "onImageText": "the only words that may appear inside the image, or an empty string",
  "captions": {
    "facebook": "2-4 sentences, conversational, no hashtags",
    "linkedin": "2-4 sentences, professional but human, no hashtags",
    "instagram": "1-3 sentences, light, no hashtags"
  },
  "hashtags": ["lowercase", "#-free", "up to 8", "relevant to the brief"]
}

RULES FOR "imagePrompt"
- Describe subject, setting, composition, lighting, camera or rendering style, and mood. Be concrete.
- State that the image is landscape or portrait as needed by the layout you are describing, but do not choose a pixel size.
- Name the exact text to render, copied from "onImageText". If "onImageText" is empty, say the image contains no text.
- Keep any in-image text to a few large words. Small type is where renders fail.
- Leave clear, uncluttered space in the lower-left corner for the brand mark, and say so in the prompt.

RULES FOR "onImageText"
- At most 8 words. Empty string is correct when the visual speaks alone.

RULES FOR "hashtags"
- Bare words, no leading #, no spaces. Return fewer rather than padding the list.`;
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

/**
 * Turn the model's reply into a plan, or null.
 *
 * Everything is clamped and checked: the reply is model output, so an
 * unexpected shape must fail here rather than inside a render.
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
  const rawCaptions =
    typeof source.captions === "object" && source.captions !== null
      ? (source.captions as Record<string, unknown>)
      : {};

  const plan: CreativePlan = {
    concept: text(source.concept, LIMITS.concept),
    imagePrompt: text(source.imagePrompt, LIMITS.imagePrompt),
    onImageText: text(source.onImageText, LIMITS.onImageText),
    captions: {
      facebook: text(rawCaptions.facebook, LIMITS.caption),
      linkedin: text(rawCaptions.linkedin, LIMITS.caption),
      instagram: text(rawCaptions.instagram, LIMITS.caption),
    },
    hashtags: clampHashtags(source.hashtags),
  };

  // Without an image prompt there is nothing to draw, and without any caption
  // there is nothing to post. Either way the plan is unusable.
  const hasCaption = Object.values(plan.captions).some(Boolean);
  return plan.imagePrompt && hasCaption ? plan : null;
}

/**
 * The instruction the image model receives.
 *
 * The plan's own prompt comes first — that is where the creative direction
 * lives. Everything after it is non-negotiable brand and honesty framing, so a
 * model that writes a beautiful prompt cannot talk itself out of the palette or
 * into inventing a statistic.
 */
export function buildImagePrompt(
  plan: Pick<CreativePlan, "imagePrompt" | "onImageText">,
  format: CreativeFormat,
): string {
  const spec = FORMATS[format];
  const logoSpot =
    format === "story"
      ? "the lower third, well inside the edges so the app's interface never covers it"
      : "the lower-left corner, with clear space around it";

  const words = plan.onImageText
    ? `The only words allowed in the image are exactly: "${plan.onImageText}". Set them large, in a heavy geometric sans, with generous spacing. Every other piece of text must be omitted.`
    : "The image contains no words, letters, numbers or captions of any kind.";

  return `${plan.imagePrompt}

COMPOSITION
- Portrait-orientation ${spec.width} by ${spec.height} pixels, aspect ratio ${spec.aspectRatio}.

COLOUR
- Brand green ${BRAND.green}, ink ${BRAND.ink}, paper ${BRAND.paper}, muted slate ${BRAND.mute}, hairline ${BRAND.rule}. Nothing outside that palette except neutrals and skin tones inside a photograph.

TEXT
- ${words}
- No phone numbers, email addresses, URLs, QR codes, watermarks or invented brand names.

LOGO
- A reference image of the CreedaVA mark is attached. Reproduce that mark exactly as supplied — identical shapes, proportions and colours. Do not redraw it, restyle it, translate it or approximate it.
- Place it small, roughly 7% of the image width, at ${logoSpot}.
- The attached artwork is the mark alone. Do not typeset the brand name beside it; a rendered wordmark is where lettering goes wrong.

HONESTY
- Do not add statistics, percentages, review scores, prices, awards, client names or testimonials that are not present in the instruction above.`;
}

/**
 * Filename for a download, so a folder of exports stays readable.
 *
 * No pixel size in the name: the model picks the resolution for a given aspect
 * ratio, so a name claiming 1080x1920 would be wrong for a 768x1376 file.
 */
export function creativeFilename(format: CreativeFormat, index: number): string {
  return `creedava-${format}-${index + 1}.png`;
}
