/**
 * Marketing graphics — templates, sizes and copy.
 *
 * Data only: no React, no `next/og`. The studio imports this for its pickers,
 * the route handler imports it to validate a request, and neither should pay
 * for the image renderer to do it.
 *
 * Why templates instead of an image model: a diffusion model cannot draw the
 * real logo and cannot set readable text — ask it for "CreedaVA" and it returns
 * garbled lettering. A marketing graphic is typography and layout, so it is
 * rendered as markup. That is also the only way the output stays on-brand: the
 * palette, the mark and the type scale are the same ones the site uses.
 */

/** Colours, matching the design system's marketing tokens. */
export const BRAND_COLORS = {
  paper: "#F7F7F2",
  ink: "#0B2135",
  brand: "#005148",
  mute: "#566B85",
  rule: "#E2E2DE",
} as const;

export type MarketingFormat = "square" | "portrait" | "story" | "wide";

export interface FormatSpec {
  /** Shown in the studio's size picker. */
  label: string;
  /** Where it gets posted. */
  usage: string;
  width: number;
  height: number;
}

export const FORMATS: Record<MarketingFormat, FormatSpec> = {
  square: {
    label: "Square",
    usage: "Instagram & Facebook feed",
    width: 1080,
    height: 1080,
  },
  portrait: {
    label: "Portrait",
    usage: "Instagram feed, best reach",
    width: 1080,
    height: 1350,
  },
  story: {
    label: "Story",
    usage: "Instagram & Facebook stories",
    width: 1080,
    height: 1920,
  },
  wide: {
    label: "Wide",
    usage: "Link preview & LinkedIn",
    width: 1200,
    height: 630,
  },
};

export const FORMAT_IDS = Object.keys(FORMATS) as MarketingFormat[];

/** Copy slots a template can use. */
export type CopyField =
  | "eyebrow"
  | "headline"
  | "supporting"
  | "items"
  | "cta"
  | "footnote";

export type TemplateId = "statement" | "offer" | "list" | "stat" | "split";

export interface TemplateSpec {
  label: string;
  /** One line, shown under the template name. */
  description: string;
  /** Which slots this template draws. Shown in the studio, nothing else. */
  fields: readonly CopyField[];
  /**
   * Overrides for a slot whose meaning changes per template. A stat's
   * "headline" is the number, and calling it a headline would confuse everyone.
   */
  labels?: Partial<Record<CopyField, string>>;
  /** Placeholder text so an empty studio still previews something real. */
  sample: Partial<MarketingCopy>;
}

export interface MarketingCopy {
  eyebrow: string;
  headline: string;
  supporting: string;
  /** One per line. Used by the `list` template. */
  items: string[];
  cta: string;
  footnote: string;
}

export const TEMPLATES: Record<TemplateId, TemplateSpec> = {
  statement: {
    label: "Statement",
    description: "One strong line, your mark, and a call to action.",
    fields: ["eyebrow", "headline", "supporting", "cta", "footnote"],
    sample: {
      eyebrow: "Virtual assistants",
      headline: "A dedicated bilingual assistant, working inside your tools.",
      supporting: "Admin, support and reporting — handled.",
      cta: "Book a call",
      footnote: "creedava.com",
    },
  },
  offer: {
    label: "Offer",
    description: "A promotion with the price or package called out.",
    fields: ["eyebrow", "headline", "supporting", "cta", "footnote"],
    labels: { headline: "The offer" },
    sample: {
      eyebrow: "This month",
      headline: "20 hours of support, one flat fee.",
      supporting: "No contracts. Cancel anytime. Onboarded in 5–7 days.",
      cta: "Get started",
      footnote: "creedava.com",
    },
  },
  list: {
    label: "List",
    description: "Three to five points, each on its own line.",
    fields: ["eyebrow", "headline", "items", "footnote"],
    labels: { items: "Points, one per line" },
    sample: {
      eyebrow: "What to delegate first",
      headline: "Three things to hand over this week",
      items: [
        "Inbox triage and calendar",
        "Customer replies and follow-ups",
        "Weekly reporting and invoicing",
      ],
      footnote: "creedava.com",
    },
  },
  stat: {
    label: "Stat",
    description: "One number, made unmissable.",
    fields: ["eyebrow", "headline", "supporting", "footnote"],
    labels: { headline: "The number", supporting: "What it means" },
    sample: {
      eyebrow: "The cost of doing it yourself",
      headline: "11 hrs",
      supporting: "A week lost to admin one person could carry.",
      footnote: "creedava.com",
    },
  },
  split: {
    label: "Split",
    description: "Brand panel on one side, your message on the other.",
    fields: ["headline", "supporting", "cta", "footnote"],
    sample: {
      headline: "Support that speaks your customer's language.",
      supporting: "English and Spanish, from one team.",
      cta: "Talk to us",
      footnote: "creedava.com",
    },
  },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES) as TemplateId[];

/** Ceilings that keep a request from producing a megabyte of markup. */
export const LIMITS = {
  eyebrow: 40,
  headline: 90,
  supporting: 140,
  item: 60,
  items: 5,
  cta: 28,
  footnote: 40,
} as const;

export const EMPTY_COPY: MarketingCopy = {
  eyebrow: "",
  headline: "",
  supporting: "",
  items: [],
  cta: "",
  footnote: "creedava.com",
};

export function isTemplateId(value: string): value is TemplateId {
  return Object.hasOwn(TEMPLATES, value);
}

export function isFormat(value: string): value is MarketingFormat {
  return Object.hasOwn(FORMATS, value);
}

/** Query string for a rendered image. Same URL the studio previews and downloads. */
export function marketingImageUrl(
  template: TemplateId,
  format: MarketingFormat,
  copy: MarketingCopy,
): string {
  const params = new URLSearchParams({ template, format });
  if (copy.eyebrow) params.set("eyebrow", copy.eyebrow);
  if (copy.headline) params.set("headline", copy.headline);
  if (copy.supporting) params.set("supporting", copy.supporting);
  if (copy.items.length > 0) params.set("items", copy.items.join("\n"));
  if (copy.cta) params.set("cta", copy.cta);
  if (copy.footnote) params.set("footnote", copy.footnote);
  return `/api/brand/marketing?${params.toString()}`;
}

/** Filename for the download, so a folder of exports is still readable. */
export function marketingImageFilename(
  template: TemplateId,
  format: MarketingFormat,
): string {
  return `creedava-${template}-${FORMATS[format].width}x${FORMATS[format].height}.png`;
}
