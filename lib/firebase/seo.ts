/**
 * Fetch SEO metadata for a page from Firestore.
 *
 * Collection: "page-seo"
 * Each doc stores { path, title, description, ogTitle, ogDescription, ogImage, keywords, noIndex }.
 * Falls back to provided defaults when no Firestore entry exists.
 *
 * IMPORTANT: This file is imported by server components (generateMetadata) and
 * must use the Firebase Admin SDK — NOT the client Firebase SDK. The client SDK
 * (lib/firebase/config.ts) only initializes `db` inside `if (typeof window !== "undefined")`,
 * so `db` is always `undefined` on the server. The Admin SDK (lib/firebase-admin.ts)
 * uses Application Default Credentials in hosted server contexts. Local
 * production builds skip Firestore metadata reads when no Admin credentials are
 * available and use the provided defaults.
 */

import { unstable_cache } from "next/cache";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";
import type { PageSEO } from "@/lib/types/content";
import type { Metadata } from "next";

const SITE_NAME = "CreedaVA";
const SITE_URL = "https://creedava.com";

/**
 * Reject values corrupted by the SEO agent before the crawler fix:
 * inline JSON-LD was captured as body text and written into `description`.
 */
function isUsableMetaValue(value: string): boolean {
  return !value.includes('"@context"');
}

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

    const title = nonEmpty(seo.title, defaults.title);
    const description = nonEmpty(seo.description, defaults.description);
    const ogTitle = nonEmpty(seo.ogTitle, title);
    const ogDescription = nonEmpty(seo.ogDescription, description);
    const pageUrl = canonicalUrl(path);

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
        ...(seo.ogImage ? { images: [{ url: seo.ogImage, width: 1200, height: 630, alt: ogTitle }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: ogTitle,
        description: ogDescription,
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
    },
    twitter: {
      card: "summary_large_image",
      title: defaults.title,
      description: defaults.description,
    },
  };
}

/**
 * Cached getPageSEO — revalidates every 60 s per (path, defaults) pair.
 * Avoids a Firestore read on every server render for marketing pages.
 */
export const getPageSEO = unstable_cache(_getPageSEO, ["page-seo"], { revalidate: 60 });
