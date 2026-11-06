import type { Metadata } from "next";
import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";
import { pageAlternates } from "@/lib/firebase/seo";
import { blogPostingJsonLd } from "@/lib/utils/structured-data";
import { BlogPostContent } from "./blog-post-content";
import type { BlogPost } from "@/lib/types/content";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

/** Pre-generate paths for all published blog posts */
export async function generateStaticParams() {
  if (!canUseAdminDb) return [];

  try {
    const snap = await adminDb
      .collection("blog")
      .where("status", "==", "published")
      .select("slug")
      .get();
    return snap.docs.map((doc) => ({ slug: doc.data().slug as string }));
  } catch {
    return [];
  }
}

async function getPost(slug: string): Promise<(BlogPost & { id: string }) | null> {
  if (!canUseAdminDb) return null;

  try {
    const snap = await adminDb
      .collection("blog")
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();
    if (snap.empty) return null;
    return toPost(snap.docs[0]);
  } catch {
    return null;
  }
}

/** Firestore timestamps are not serialisable across the server/client boundary. */
function toIsoTimestamp(value: unknown): unknown {
  if (!value || typeof value !== "object" || !("toDate" in value)) return value;
  const { toDate } = value as { toDate?: unknown };
  if (typeof toDate !== "function") return value;
  try {
    return (toDate as () => Date).call(value).toISOString();
  } catch {
    return value;
  }
}

function toPost(doc: {
  id: string;
  data: () => Record<string, unknown>;
}): BlogPost & { id: string } {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: toIsoTimestamp(data.createdAt),
    updatedAt: toIsoTimestamp(data.updatedAt),
    publishedAt: toIsoTimestamp(data.publishedAt),
  } as BlogPost & { id: string };
}

const RELATED_LIMIT = 3;
const RELATED_CANDIDATES = 12;

/**
 * Posts to keep reading.
 *
 * Ranked by shared tags first (the strongest available signal — there is no
 * view or click data), then newest, so a post is never followed by an
 * arbitrary three. Fails soft: an empty list simply hides the section, which
 * keeps the article page working when Firestore is unreachable at build time.
 */
async function getRelatedPosts(post: BlogPost & { id: string }): Promise<(BlogPost & { id: string })[]> {
  if (!canUseAdminDb) return [];

  try {
    const snap = await adminDb
      .collection("blog")
      .where("status", "==", "published")
      .limit(RELATED_CANDIDATES)
      .get();

    return snap.docs
      .map(toPost)
      .filter((candidate) => candidate.id !== post.id && Boolean(candidate.slug))
      .map((candidate) => ({
        candidate,
        sharedTags: (candidate.tags ?? []).filter((tag) => (post.tags ?? []).includes(tag)).length,
        published: Date.parse(candidate.publishedAt ?? "") || 0,
      }))
      .sort((a, b) => b.sharedTags - a.sharedTags || b.published - a.published)
      .slice(0, RELATED_LIMIT)
      .map((entry) => entry.candidate);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = await getPost(slug);
  if (post) {
    const title = post.title;
    const description = post.metaDescription || post.excerpt || "";
    return {
      title: `${title} — News`,
      description,
      alternates: pageAlternates(`/news/${slug}`),
      openGraph: {
        title: `${title} — News`,
        description,
        type: "article",
        url: `https://creedava.com/news/${slug}`,
        images: post.featuredImage ? [post.featuredImage] : undefined,
      },
    };
  }

  // Fallback — derive from slug
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${title} — News`,
    alternates: pageAlternates(`/news/${slug}`),
    openGraph: {
      title: `${title} — News`,
      type: "article",
      url: `https://creedava.com/news/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  let jsonLd: object | null = null;
  let related: (BlogPost & { id: string })[] = [];
  if (post) {
    jsonLd = post.jsonLd || blogPostingJsonLd({
      title: post.title,
      slug,
      excerpt: post.excerpt || post.metaDescription || "",
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt as string | undefined,
      featuredImage: post.featuredImage,
      tags: post.tags,
    });
    related = await getRelatedPosts(post);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogPostContent post={post} related={related} />
    </>
  );
}
