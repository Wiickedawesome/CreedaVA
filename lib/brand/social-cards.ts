/**
 * Copy for the social cards, one entry per page that gets its own.
 *
 * Data only — no `next/og`, no React. `lib/firebase/seo.ts` imports this to
 * build `og:image` URLs on the server, so it must not drag the image renderer
 * into every metadata response. The renderer lives in `social-card.tsx`; the
 * route that serves these lives in `app/share/[[...path]]/route.tsx`.
 */

export const SITE_ORIGIN = "https://creedava.com";

/** Route that renders a card. `?path` style URLs are avoided so the URL reads clean. */
const CARD_ROUTE = "/share";

export interface SocialCardCopy {
  /** `og:image:alt` — describe the image for people who cannot see it. */
  alt: string;
  /** The share headline. Keep it under ~70 characters so it stays two lines. */
  headline: string;
  /** One green line of proof under the rule. */
  footnote: string;
  /** Label under the wordmark. Defaults to the brand descriptor. */
  eyebrow?: string;
}

/**
 * Keyed by the marketing route the card belongs to.
 *
 * Only main pages are listed. Anything else (privacy, terms, forum threads,
 * landing pages) shares the default card, because a unique card for a page
 * nobody shares is just another asset to keep in sync.
 */
export const SOCIAL_CARDS: Record<string, SocialCardCopy> = {
  "/": {
    alt: "CreedaVA — Bilingual Virtual Assistants for Your Business",
    headline: "A dedicated bilingual assistant, working inside your tools.",
    footnote: "One flat monthly fee · English & Spanish · 5–7 day onboarding",
  },
  "/services": {
    alt: "CreedaVA Services — twelve virtual assistant roles",
    headline: "Built around your sector, not a task list.",
    footnote: "12 roles · English & Spanish · 5–7 day onboarding",
    eyebrow: "Services",
  },
  "/pricing": {
    alt: "CreedaVA Pricing — one flat monthly fee",
    headline: "The help you need, at a price you can plan for.",
    footnote: "One flat monthly fee · No hourly billing",
    eyebrow: "Pricing",
  },
  "/about": {
    alt: "About CreedaVA — one country, two languages",
    headline: "One country. Two languages. Your whole back office.",
    footnote: "Belize-based · English & Spanish",
    eyebrow: "About",
  },
  "/news": {
    alt: "CreedaVA News & Insights",
    headline: "News and insights on delegation and operations.",
    footnote: "Written by the CreedaVA team",
    eyebrow: "News",
  },
  "/contact": {
    alt: "Contact CreedaVA",
    headline: "Get in touch.",
    footnote: "We reply within 24 hours · Monday–Friday, 9–6 EST",
    eyebrow: "Contact",
  },
  "/faq": {
    alt: "CreedaVA FAQ — questions people ask before starting",
    headline: "The things people ask before starting.",
    footnote: "Pricing · Onboarding · Security · Bilingual support",
    eyebrow: "FAQ",
  },
  "/join": {
    alt: "Book a free consultation with CreedaVA",
    headline: "Book a free 30-minute consultation.",
    footnote: "No commitment · Tell us what to hand off first",
    eyebrow: "Get started",
  },
};

/** The card every unregistered page falls back to. */
export const DEFAULT_CARD_PATH = "/";

export function socialCardFor(path: string): SocialCardCopy {
  return SOCIAL_CARDS[path] ?? SOCIAL_CARDS[DEFAULT_CARD_PATH];
}

/**
 * Absolute `og:image` URL for a route.
 *
 * A registered page points at its own card; everything else points at the
 * default. The URL is stable across builds — unlike the file-convention
 * `opengraph-image` route, which Next emits with a build hash appended.
 */
export function socialCardUrl(path: string): string {
  if (!(path in SOCIAL_CARDS)) return `${SITE_ORIGIN}${CARD_ROUTE}`;
  return path === DEFAULT_CARD_PATH
    ? `${SITE_ORIGIN}${CARD_ROUTE}`
    : `${SITE_ORIGIN}${CARD_ROUTE}${path}`;
}
