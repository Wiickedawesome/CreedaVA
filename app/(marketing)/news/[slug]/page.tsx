import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { blogPostingJsonLd } from "@/lib/utils/structured-data";
import { BlogPostContent } from "./blog-post-content";
import type { BlogPost } from "@/lib/types/content";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

/** Pre-generate paths for all published blog posts */
export async function generateStaticParams() {
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
  try {
    const snap = await adminDb
      .collection("blog")
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    // Convert Firestore Timestamps to ISO strings for serialization
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt,
      publishedAt: data.publishedAt?.toDate?.()?.toISOString?.() ?? data.publishedAt,
    } as BlogPost & { id: string };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = await getPost(slug);
  if (post) {
    const title = post.title;
    const description = post.metaDescription || post.excerpt || "";
    return {
      title: `${title} | CreedaVA News`,
      description,
      alternates: { canonical: `https://creedava.com/news/${slug}` },
      openGraph: {
        title: `${title} | CreedaVA News`,
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
    title: `${title} | CreedaVA News`,
    alternates: {
      canonical: `https://creedava.com/news/${slug}`,
    },
    openGraph: {
      title: `${title} | CreedaVA News`,
      type: "article",
      url: `https://creedava.com/news/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  let jsonLd: object | null = null;
  if (post) {
    jsonLd = blogPostingJsonLd({
      title: post.title,
      slug,
      excerpt: post.excerpt || post.metaDescription || "",
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt as string | undefined,
      featuredImage: post.featuredImage,
      tags: post.tags,
    });
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogPostContent post={post} />
    </>
  );
}
