"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import {
  getTranslatedTitle,
  getTranslatedExcerpt,
} from "@/lib/firebase/translate";
import type { BlogPost } from "@/lib/types/content";

interface NewsListProps {
  posts: (BlogPost & { id: string })[];
}

export function NewsList({ posts }: NewsListProps) {
  const { t, locale } = useTranslation();

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-gray-30 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
        </svg>
        <p className="text-gray-50 text-sm">{t.news.noPostsYet}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => {
        const readTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));
        const category = post.tags[0] || "General";
        const date = post.publishedAt
          ? new Date(post.publishedAt).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";

        return (
          <Link
            key={post.id}
            href={`/news/${post.slug}`}
            className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow block"
          >
            {post.featuredImage ? (
              <div className="relative h-48 w-full bg-gray-10">
                <Image
                  src={post.featuredImage}
                  alt={getTranslatedTitle(post, locale)}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="bg-linear-to-br from-primary/5 to-accent/5 h-48 flex items-center justify-center">
                <span className="text-4xl text-primary/20 font-bold">
                  {category.charAt(0)}
                </span>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {category}
                </span>
                <span className="text-xs text-gray-50">{readTime} {t.news.minRead}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-100 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {getTranslatedTitle(post, locale)}
              </h3>
              <p className="text-sm text-gray-60 leading-relaxed line-clamp-3 mb-4">
                {getTranslatedExcerpt(post, locale)}
              </p>
              <p className="text-xs text-gray-50">{date}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
