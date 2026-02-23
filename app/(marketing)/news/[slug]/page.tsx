import type { Metadata } from "next";
import { BlogPostContent } from "./blog-post-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Derive a reasonable title from the slug (actual post data loads client-side)
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
  return <BlogPostContent slug={slug} />;
}
