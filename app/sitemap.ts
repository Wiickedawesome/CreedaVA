import type { MetadataRoute } from "next";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";

const BASE = "https://creedava.com";

/**
 * Static marketing pages rarely change between deploys. Using a single
 * timestamp (the server start, i.e. the deploy) keeps `lastModified` honest
 * instead of reporting every page as changed on every request.
 */
const BUILD_DATE = new Date();

/** Convert a Firestore Timestamp (or missing value) to a Date */
function toDate(ts: { toDate?: () => Date } | undefined): Date {
  return ts?.toDate?.() ?? new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Static marketing pages ────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/services`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/about`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/news`,
      lastModified: BUILD_DATE,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE}/contact`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/forum`,
      lastModified: BUILD_DATE,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${BASE}/join`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/faq`,
      lastModified: BUILD_DATE,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: BUILD_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: BUILD_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // ─── Dynamic content from Firestore ────────────────
  let blogPages: MetadataRoute.Sitemap = [];
  let lpPages: MetadataRoute.Sitemap = [];
  let forumPages: MetadataRoute.Sitemap = [];

  if (!canUseAdminDb) {
    return staticPages;
  }

  try {
    const [blogSnap, lpSnap, forumSnap] = await Promise.all([
      adminDb
        .collection("blog")
        .where("status", "==", "published")
        .orderBy("updatedAt", "desc")
        .get(),
      adminDb
        .collection("landing-pages")
        .where("status", "==", "published")
        .orderBy("updatedAt", "desc")
        .get(),
      adminDb
        .collection("forum")
        .where("status", "==", "open")
        .orderBy("updatedAt", "desc")
        .get(),
    ]);

    blogPages = blogSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        url: `${BASE}/news/${d.slug}`,
        lastModified: toDate(d.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

    lpPages = lpSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        url: `${BASE}/lp/${d.slug}`,
        lastModified: toDate(d.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      };
    });

    forumPages = forumSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        url: `${BASE}/forum/${doc.id}`,
        lastModified: toDate(d.updatedAt),
        changeFrequency: "daily" as const,
        priority: 0.6,
      };
    });
  } catch (err) {
    // Missing credentials or a failed query — still serve the static pages,
    // but surface the failure instead of silently returning an incomplete sitemap.
    console.error("[sitemap] dynamic content query failed:", err);
  }

  return [...staticPages, ...blogPages, ...lpPages, ...forumPages];
}
