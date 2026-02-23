"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import { fetchAll, where } from "@/lib/firebase/firestore";
import { ensureBlogTranslated, getTranslatedTitle, getTranslatedContent } from "@/lib/firebase/translate";
import type { BlogPost } from "@/lib/types/content";

interface BlogPostContentProps {
  slug: string;
}

export function BlogPostContent({ slug }: BlogPostContentProps) {
  const { t, locale } = useTranslation();
  const [post, setPost] = useState<(BlogPost & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const translatingRef = useRef(false);

  // Fetch the post client-side
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const posts = await fetchAll<BlogPost>(
          "blog",
          where("slug", "==", slug),
          where("status", "==", "published"),
        );
        if (mounted) setPost(posts[0] || null);
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [slug]);

  // On-demand: translate blog post if missing translations for current locale
  useEffect(() => {
    if (!post || translatingRef.current) return;

    const sourceLang = post.lang || "en";
    if (sourceLang === locale) return;
    
    // Check if translation exists
    if (post.translations?.[locale]) return;

    let mounted = true;
    translatingRef.current = true;

    async function translate() {
      try {
        const updated = await ensureBlogTranslated(post!, locale);
        if (mounted && updated.translations?.[locale]) {
          setPost(updated);
        }
      } catch (err) {
        console.error("Blog translation error:", err);
      } finally {
        translatingRef.current = false;
      }
    }

    translate();

    return () => { mounted = false; };
  }, [post, locale]);

  if (loading) {
    return (
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center">
            <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              <div className="h-64 bg-gray-200 rounded-2xl mt-8" />
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
              &larr; {t.news.backToNews}
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  const title = getTranslatedTitle(post, locale);
  const content = getTranslatedContent(post, locale);
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
              <span className="text-sm text-gray-50">{date}</span>
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
              prose-p:text-gray-70 prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-90
              prose-ul:text-gray-70 prose-li:text-gray-70
              prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Container>
      </section>
    </article>
  );
}
