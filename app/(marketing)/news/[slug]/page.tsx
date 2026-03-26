import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { blogPostingJsonLd } from "@/lib/utils/structured-data";
import { BlogPostContent } from "./blog-post-content";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Try to fetch the real post data for rich metadata
    const snap = await adminDb
      .collection("blog")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!snap.empty) {
      const post = snap.docs[0].data();
      const title = post.title || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
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
  } catch {
    // Fall through to slug-derived fallback
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

  // Fetch post data for JSON-LD (best-effort)
  let jsonLd: object | null = null;
  try {
    const snap = await adminDb
      .collection("blog")
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (!snap.empty) {
      const post = snap.docs[0].data();
      jsonLd = blogPostingJsonLd({
        title: post.title || slug,
        slug,
        excerpt: post.excerpt || post.metaDescription || "",
        publishedAt: post.publishedAt?.toDate?.()?.toISOString?.(),
        updatedAt: post.updatedAt?.toDate?.()?.toISOString?.(),
        featuredImage: post.featuredImage,
        tags: post.tags,
      });
    }
  } catch {
    // JSON-LD is best-effort; page still renders
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogPostContent slug={slug} />
    </>
  );
}
