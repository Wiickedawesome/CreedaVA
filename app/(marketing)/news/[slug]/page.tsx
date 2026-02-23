import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { fetchAllServer, serverWhere } from "@/lib/firebase/firestore-server";
import type { BlogPost } from "@/lib/types/content";
import { BlogPostContent } from "./blog-post-content";

// Use server cache for the fetch request (Admin SDK — works server-side)
const getPost = cache(async (slug: string) => {
  try {
    const posts = await fetchAllServer<BlogPost>(
      "blog",
      serverWhere("slug", "==", slug),
      serverWhere("status", "==", "published"),
    );
    return posts[0] || null;
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return null;
  }
});

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `https://creedava.com/news/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `https://creedava.com/news/${post.slug}`,
      images: post.featuredImage
        ? [{ url: post.featuredImage, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostContent initialPost={post as (BlogPost & { id: string })} slug={slug} />;
}
