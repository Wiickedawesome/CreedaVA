import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getPageSEO } from "@/lib/firebase/seo";
import { NewsContent } from "./news-content";
import type { BlogPost } from "@/lib/types/content";

export const revalidate = 300;

export async function generateMetadata() {
  return getPageSEO("/news", {
    title: "News & Insights",
    description: "Stay up to date with the latest news, tips, and insights from CreedaVA.",
  });
}

const getBlogPosts = unstable_cache(
  async (): Promise<(BlogPost & { id: string })[]> => {
    try {
      const snap = await adminDb
        .collection("blog")
        .where("status", "==", "published")
        .orderBy("publishedAt", "desc")
        .get();
      return snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt,
          publishedAt: data.publishedAt?.toDate?.()?.toISOString?.() ?? data.publishedAt,
        };
      }) as (BlogPost & { id: string })[];
    } catch {
      return [];
    }
  },
  ["blog-posts"],
  { revalidate: 300 },
);

export default async function NewsPage() {
  const posts = await getBlogPosts();
  return <NewsContent posts={posts} />;
}
