/**
 * Fetch SEO metadata for a page from Firestore.
 *
 * Collection: "page-seo"
 * Each doc stores { path, title, description, ogTitle, ogDescription, ogImage, keywords, noIndex }.
 * Falls back to provided defaults when no Firestore entry exists.
 *
 * IMPORTANT: This file is imported by server components (generateMetadata) and
 * must use the Firebase Admin SDK — NOT the client Firebase SDK. The client SDK
 * (lib/firebase/config.ts) throws a descriptive error if its exports are used
 * outside the browser. The Admin SDK (lib/firebase-admin.ts) uses Application
 * Default Credentials in hosted server contexts. Local production builds skip
 * Firestore metadata reads when no Admin credentials are available and use the
 * provided defaults.
 */

import { unstable_cache } from "next/cache";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";
import { isUsableMetaValue } from "@/lib/utils/meta-guard";
import { stripBrandDuplication } from "@/lib/utils/page-title";
import { socialCardFor, socialCardUrl } from "@/lib/brand/social-cards";
import type { PageSEO } from "@/lib/types/content";
import type { Metadata } from "next";

const SITE_NAME = "CreedaVA";
const SITE_URL = "https://creedava.com";

/**
 * Social card for a route.
 *
 * A page-level `openGraph` object REPLACES the root layout's rather than
 * merging into it, so omitting `images` here silently drops `og:image` from
 * the page — shares on LinkedIn and X render as a bare link. That is why every
 * branch of this file has to supply one.
 *
 * Which card is a property of the route, so it resolves through
 * `socialCardUrl()`: pages in `SOCIAL_CARDS` get their own headline, everything
 * else gets the default. The renderer is `app/share/[[...path]]/route.tsx`.
 */
function pageOgImage(path: string, alt: string) {
  return {
    url: socialCardUrl(path),
    width: 1200,
    height: 630,
    alt,
  } as const;
}

/**
 * Reject values corrupted by the SEO agent's crawler from reaching the live page.
 *
 * The predicate lives in `lib/utils/meta-guard.ts` so the client-side Page
 * Metadata table can share it without bundling the Admin SDK. Re-exported here
 * so existing server-side callers keep their import path.
 *
 * Matching means the page-level `metadata()` constant wins instead.
 */
export { isUsableMetaValue };

function nonEmpty(value: unknown, fallbackValue: string): string {
  if (typeof value !== "string") return fallbackValue;
  const trimmed = value.trim();
  return trimmed.length > 0 && isUsableMetaValue(trimmed) ? trimmed : fallbackValue;
}

/**
 * Canonical + hreflang alternates for a route path.
 *
 * Every marketing page serves EN and ES from the same URL (the locale is a
 * cookie), so only the English URL is crawlable — pointing `es-US` at
 * `?lang=es` would advertise a Spanish page that renders English to crawlers.
 * Add an `es-US` entry only if language-specific URLs are introduced.
 */
export function pageAlternates(path: string): NonNullable<Metadata["alternates"]> {
  const url = canonicalUrl(path);

  return {
    canonical: url,
    languages: {
      "en-US": url,
      "x-default": url,
    },
  };
}

/** Absolute site URL for a route path (the homepage has no trailing slash). */
function canonicalUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

async function _getPageSEO(
  path: string,
  defaults: { title: string; description: string },
): Promise<Metadata> {
  if (!canUseAdminDb) return fallback(path, defaults);

  try {
    const snapshot = await adminDb
      .collection("page-seo")
      .where("path", "==", path)
      .limit(1)
      .get();

    const seo = snapshot.empty ? null : (snapshot.docs[0].data() as PageSEO);
    if (!seo) return fallback(path, defaults);

    const title = stripBrandDuplication(nonEmpty(seo.title, defaults.title));
    const description = nonEmpty(seo.description, defaults.description);
    const ogTitle = nonEmpty(seo.ogTitle, title);
    const ogDescription = nonEmpty(seo.ogDescription, description);
    const pageUrl = canonicalUrl(path);
    const ogImage = seo.ogImage
      ? { url: seo.ogImage, width: 1200, height: 630, alt: ogTitle }
      : pageOgImage(path, ogTitle);

    return {
      title,
      description,
      keywords: seo.keywords,
      ...(seo.noIndex ? { robots: { index: false, follow: false } } : {}),
      alternates: pageAlternates(path),
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: pageUrl,
        siteName: SITE_NAME,
        type: "website",
        images: [ogImage],
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
        images: [ogImage.url],
      },
    };
  } catch {
    return fallback(path, defaults);
  }
}

function fallback(
  path: string,
  defaults: { title: string; description: string },
): Metadata {
  const pageUrl = canonicalUrl(path);
  const ogImage = pageOgImage(path, socialCardFor(path).alt);

  return {
    title: defaults.title,
    description: defaults.description,
    alternates: pageAlternates(path),
    openGraph: {
      title: defaults.title,
      description: defaults.description,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: defaults.title,
      description: defaults.description,
      images: [ogImage.url],
    },
  };
}

/**
 * Cached getPageSEO — revalidates every 60 s per (path, defaults) pair.
 * Avoids a Firestore read on every server render for marketing pages.
 */
export const getPageSEO = unstable_cache(_getPageSEO, ["page-seo"], { revalidate: 60 });
