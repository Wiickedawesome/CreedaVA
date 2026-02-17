import type { MetadataRoute } from "next";
import { fetchAll, where, orderBy } from "@/lib/firebase/firestore";
import type { BlogPost, LandingPage } from "@/lib/types/content";

const BASE = "https://creedava.com";

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

  // ─── Dynamic: Published blog posts ─────────────────
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchAll<BlogPost>(
      "blog",
      where("status", "==", "published"),
      orderBy("publishedAt", "desc"),
    );
    blogEntries = posts.map((post) => ({
      url: `${BASE}/news/${post.slug}`,
      lastModified: post.publishedAt
        ? new Date(post.publishedAt)
        : post.updatedAt?.toDate?.()
          ? post.updatedAt.toDate()
          : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // Firestore may be unavailable at build time — skip dynamic entries
  }

  // ─── Dynamic: Published landing pages ──────────────
  let landingEntries: MetadataRoute.Sitemap = [];
  try {
    const pages = await fetchAll<LandingPage>(
      "landing-pages",
      where("status", "==", "published"),
    );
    landingEntries = pages.map((page) => ({
      url: `${BASE}/lp/${page.slug}`,
      lastModified: page.updatedAt?.toDate?.()
        ? page.updatedAt.toDate()
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Firestore may be unavailable at build time
  }

  return [...staticPages, ...blogEntries, ...landingEntries];
}
