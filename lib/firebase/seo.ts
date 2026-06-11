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

function nonEmpty(value: unknown, fallbackValue: string): string {
  if (typeof value !== "string") return fallbackValue;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallbackValue;
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
    const pageUrl = `${SITE_URL}${path}`;

    return {
      title,
      description,
      keywords: seo.keywords,
      ...(seo.noIndex ? { robots: { index: false, follow: false } } : {}),
      alternates: {
        canonical: pageUrl,
      },
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
  const pageUrl = `${SITE_URL}${path}`;

  return {
    title: defaults.title,
    description: defaults.description,
    alternates: {
      canonical: pageUrl,
    },
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
