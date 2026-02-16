import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { fetchAll, where } from "@/lib/firebase/firestore";
import type { BlogPost } from "@/lib/types/content";
import { BlogPostContent } from "./blog-post-content";

// Use server cache for the fetch request
const getPost = cache(async (slug: string) => {
  try {
    const posts = await fetchAll<BlogPost>(
      "blog",
      where("slug", "==", slug),
      where("status", "==", "published"),
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
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `https://creedava.com/news/${post.slug}`,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // Cast because fetchAll returns (T & { id: string })[] but BlogPostContent expects explicitly typed id
  return <BlogPostContent initialPost={post as (BlogPost & { id: string })} slug={slug} />;
}
