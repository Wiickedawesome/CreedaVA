"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import { getTranslatedTitle, getTranslatedContent } from "@/lib/firebase/translate";
import { demoteBodyH1 } from "@/lib/utils/blog-content";
import type { BlogPost } from "@/lib/types/content";

interface BlogPostContentProps {
  post: (BlogPost & { id: string }) | null;
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  const { t, locale } = useTranslation();

  if (!post) {
    return (
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-100 mb-3">{t.news.postNotFound}</h1>
            <p className="text-gray-60 mb-6">{t.news.postNotFoundDesc}</p>
            <Link href="/news" className="text-primary hover:text-primary-light font-medium transition-colors">
              &larr; {t.news.backToNews}
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  const title = getTranslatedTitle(post, locale);
  // The title above is the page's only <h1>; demote any AI-authored heading.
  const content = demoteBodyH1(getTranslatedContent(post, locale));
  const category = post.tags[0] || "General";
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <article>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-linear-to-b from-gray-10 to-white">
        <Container size="md">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <Link href="/news" className="inline-flex items-center text-primary font-medium hover:underline mb-8">
              &larr; {t.news.backToNews}
            </Link>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                {category}
              </span>
              <span className="text-sm text-gray-60">{date}</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-100 leading-tight mb-6">
              {title}
            </h1>
          </div>
          {post.featuredImage && (
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-video">
              <Image
                src={post.featuredImage}
                alt={title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </Container>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <Container size="md">
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-gray-100 prose-headings:font-bold
              prose-p:text-gray-80 prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-90
              prose-ul:text-gray-80 prose-li:text-gray-80
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Container>
      </section>
    </article>
  );
}
