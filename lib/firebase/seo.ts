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

    return {
      title: seo.title || defaults.title,
      description: seo.description || defaults.description,
      keywords: seo.keywords,
      ...(seo.noIndex ? { robots: { index: false, follow: false } } : {}),
      openGraph: {
        title: seo.ogTitle || seo.title || defaults.title,
        description: seo.ogDescription || seo.description || defaults.description,
        url: `${SITE_URL}${path}`,
        siteName: SITE_NAME,
        type: "website",
        ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
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
  return {
    title: defaults.title,
    description: defaults.description,
    openGraph: {
      title: defaults.title,
      description: defaults.description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}
