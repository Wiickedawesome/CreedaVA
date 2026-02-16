"use client";

import { useEffect, useState } from "react";
import { fetchAll } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import {
  getTranslatedTitle,
  getTranslatedExcerpt,
  ensureBlogTranslated,
} from "@/lib/firebase/translate";
import type { BlogPost } from "@/lib/types/content";

export function NewsList() {
  const { t, locale } = useTranslation();
  const [posts, setPosts] = useState<(BlogPost & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    async function loadPosts() {
      try {
        const data = await fetchAll<BlogPost>(
          "blog",
          where("status", "==", "published"),
          orderBy("publishedAt", "desc"),
        );
        setPosts(data);
      } catch (err) {
        console.error("Blog fetch failed (composite index may be missing):", err);
        try {
          const data = await fetchAll<BlogPost>(
            "blog",
            where("status", "==", "published"),
          );
          const sorted = data.sort((a, b) =>
            (b.publishedAt || "").localeCompare(a.publishedAt || ""),
          );
          setPosts(sorted);
        } catch {
          setPosts([]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  // On-demand: translate blog posts missing translations for the current locale
  useEffect(() => {
    if (translating || posts.length === 0) return;
    const untranslated = posts.filter(
      (p) => !p.translations?.[locale] && (p.lang || "en") !== locale,
    );
    if (untranslated.length === 0) return;

    setTranslating(true);
    (async () => {
      const updated: (BlogPost & { id: string })[] = [];
      for (const p of untranslated) {
        const result = await ensureBlogTranslated(p, locale);
        updated.push(result);
      }
      if (updated.length > 0) {
        setPosts((prev) =>
          prev.map((p) => {
            const u = updated.find((x) => x.id === p.id);
            return u || p;
          }),
        );
      }
    })()
      .catch((err) => console.error("Blog list translation error:", err))
      .finally(() => setTranslating(false));
  }, [posts.length, locale, translating]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-white overflow-hidden animate-pulse">
            <div className="bg-gray-10 h-48" />
            <div className="p-6 space-y-3">
              <div className="h-4 bg-gray-10 rounded w-1/3" />
              <div className="h-5 bg-gray-10 rounded w-3/4" />
              <div className="h-4 bg-gray-10 rounded w-full" />
              <div className="h-3 bg-gray-10 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
          <a
            key={post.slug}
            href={`/news/${post.slug}`}
            className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="bg-linear-to-br from-primary/5 to-accent/5 h-48 flex items-center justify-center">
              <span className="text-4xl text-primary/20 font-bold">
                {category.charAt(0)}
              </span>
            </div>
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
          </a>
        );
      })}
    </div>
  );
}
