import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase-admin";

const BASE = "https://creedava.com";

/** Convert a Firestore Timestamp (or missing value) to a Date */
function toDate(ts: { toDate?: () => Date } | undefined): Date {
  return ts?.toDate?.() ?? new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ─── Static marketing pages ────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/forum`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${BASE}/join`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // ─── Dynamic content from Firestore ────────────────
  let blogPages: MetadataRoute.Sitemap = [];
  let lpPages: MetadataRoute.Sitemap = [];
  let forumPages: MetadataRoute.Sitemap = [];

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
  } catch {
    // No credentials available — return static pages only
  }

  return [...staticPages, ...blogPages, ...lpPages, ...forumPages];
}
