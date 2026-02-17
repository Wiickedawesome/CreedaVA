/**
 * Fetch SEO metadata for a page from Firestore.
 *
 * Collection: "page-seo"
 * Each doc stores { path, title, description, ogTitle, ogDescription, ogImage, keywords, noIndex }.
 * Falls back to provided defaults when no Firestore entry exists.
 */

import { fetchAll, where } from "./firestore";
import type { PageSEO } from "@/lib/types/content";
import type { Metadata } from "next";

const SITE_NAME = "CreedaVA";
const SITE_URL = "https://creedava.com";

export async function getPageSEO(
  path: string,
  defaults: { title: string; description: string },
): Promise<Metadata> {
  try {
    const docs = await fetchAll<PageSEO>(
      "page-seo",
      where("path", "==", path),
    );
    const seo = docs[0];
    if (!seo) return fallback(path, defaults);

    const title = seo.title || defaults.title;
    const description = seo.description || defaults.description;
    const ogTitle = seo.ogTitle || title;
    const ogDescription = seo.ogDescription || description;
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
