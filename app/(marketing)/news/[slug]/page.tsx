"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import { fetchAll } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import {
  getTranslatedTitle,
  getTranslatedContent,
  ensureBlogTranslated,
} from "@/lib/firebase/translate";
import type { BlogPost } from "@/lib/types/content";

export default function BlogPostPage() {
  const { t, locale } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<(BlogPost & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function loadPost() {
      try {
        const posts = await fetchAll<BlogPost>(
          "blog",
          where("slug", "==", slug),
          where("status", "==", "published"),
        );
        setPost(posts[0] || null);
      } catch (err) {
        console.error("Post fetch failed:", err);
        try {
          // Fallback: fetch by slug only, check status in memory
          const posts = await fetchAll<BlogPost>(
            "blog",
            where("slug", "==", slug),
          );
          const published = posts.find((p) => p.status === "published");
          setPost(published || null);
        } catch {
          setPost(null);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [slug]);

  // On-demand: translate blog post if missing translations for current locale
  useEffect(() => {
    if (!post || translating) return;
    const sourceLang = post.lang || "en";
    if (sourceLang === locale) return;
    if (post.translations?.[locale]) return;

    setTranslating(true);
    ensureBlogTranslated(post, locale)
      .then((updated) => {
        if (updated.translations?.[locale]) {
          setPost(updated);
        }
      })
      .catch((err) => console.error("Blog translation error:", err))
      .finally(() => setTranslating(false));
  }, [post?.id, locale, translating]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-10 rounded w-24" />
            <div className="h-8 bg-gray-10 rounded w-3/4" />
            <div className="h-4 bg-gray-10 rounded w-1/3" />
            <div className="space-y-3 mt-12">
              <div className="h-4 bg-gray-10 rounded w-full" />
              <div className="h-4 bg-gray-10 rounded w-full" />
              <div className="h-4 bg-gray-10 rounded w-5/6" />
              <div className="h-4 bg-gray-10 rounded w-full" />
              <div className="h-4 bg-gray-10 rounded w-2/3" />
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-100 mb-3">{t.news.postNotFound}</h1>
            <p className="text-gray-50 mb-6">{t.news.postNotFoundDesc}</p>
            <Link href="/news" className="text-primary hover:text-primary-light font-medium transition-colors">
              {t.news.backToNews}
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  const readTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));

  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-linear-to-b from-gray-10 to-white">
        <Container size="md">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-light mb-8 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            {t.news.backToNews}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
            <span className="text-xs text-gray-50">
              {readTime} {t.news.minRead}
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-4 leading-tight">
            {getTranslatedTitle(post, locale)}
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-50">
            {post.author && <span>{locale === "es" ? "Por" : "By"} {post.author}</span>}
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-12 lg:py-20">
        <Container size="md">
          <div
            className="prose prose-lg max-w-none
              prose-headings:text-gray-100 prose-headings:font-bold
              prose-p:text-gray-70 prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-90
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: getTranslatedContent(post, locale) }}
          />
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20">
        <Container size="md">
          <div className="rounded-3xl bg-primary p-12 lg:p-16 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              {t.news.ctaTitle}
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              {t.news.ctaDesc}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-semibold rounded-md hover:bg-gray-10 transition-colors"
            >
              {t.news.ctaButton}
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
