import { unstable_cache } from "next/cache";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";
import { getPageSEO } from "@/lib/firebase/seo";
import { NewsContent } from "./news-content";
import type { BlogPost } from "@/lib/types/content";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";

export const revalidate = 300;

const newsCitationParagraphs = [
  "Publishing operations and growth insights with consistent structure helps readers and AI systems extract context more accurately.",
  "High-quality editorial pages should combine practical guidance with citations to trusted research and public data.",
  "CreedaVA's news hub is designed to share actionable recommendations around delegation, customer operations, and business efficiency.",
  "When articles clearly answer recurring operator questions, they become more reusable across search summaries and assistant-generated responses.",
];

const newsCitationQuestions = [
  {
    question: "What topics are most useful for business operations readers?",
    answer:
      "Topics that tie directly to measurable outcomes, such as response speed, process standardization, staffing decisions, and delegation strategy.",
  },
  {
    question: "How can content teams improve citation quality?",
    answer:
      "Reference government data, respected research institutions, and current industry reports that support each recommendation.",
  },
  {
    question: "Why does explicit Q&A formatting help discoverability?",
    answer:
      "Q&A blocks mirror common user search intent and make it easier for AI systems to map concise answers to specific questions.",
  },
];

const newsCitationSources = [
  {
    label: "U.S. Census Bureau: Business and economy resources",
    url: "https://www.census.gov/topics/business-economy.html",
  },
  {
    label: "U.S. Bureau of Labor Statistics: Economic news releases",
    url: "https://www.bls.gov/bls/newsrels.htm",
  },
  {
    label: "Harvard Business Review: Operations and management",
    url: "https://hbr.org/topic/subject/operations-and-supply-chain-management",
  },
];

export async function generateMetadata() {
  return getPageSEO("/news", {
    title: "News & Insights",
    description: "Stay up to date with the latest news, tips, and insights from CreedaVA.",
  });
}

const getBlogPosts = unstable_cache(
  async (): Promise<(BlogPost & { id: string })[]> => {
    if (!canUseAdminDb) return [];

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
  return (
    <>
      <NewsContent posts={posts} />
      <AICitationReadiness
        path="/news"
        title="CreedaVA News and Insights"
        description="Operational insights and evidence-backed guidance for business leaders using virtual assistant support."
        paragraphs={newsCitationParagraphs}
        questions={newsCitationQuestions}
        sources={newsCitationSources}
      />
    </>
  );
}
