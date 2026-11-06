"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { getTranslatedTitle, getTranslatedExcerpt } from "@/lib/firebase/translate";
import { Bloom, Pill } from "@/components/marketing/primitives";
import type { ReactNode } from "react";
import type { BlogPost } from "@/lib/types/content";

/**
 * The post index: one featured article, then the rest as editorial rows.
 *
 * Not a uniform card grid, for two reasons. Home already owns the three-across
 * card grid and this page should not be a second copy of it; and with only two
 * published posts a three-column grid leaves a visibly broken row. A featured
 * article plus a rule-separated index reads as deliberate at any count — two
 * posts, six, or twenty.
 *
 * Rows are links in their entirety, so the whole line is a target rather than
 * just the headline.
 */

type Post = BlogPost & { id: string };

const WORDS_PER_MINUTE = 200;

/** Rounded-up reading time, floored at one minute. */
function readingMinutes(post: Post): number {
  const words = post.content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ArrowIcon(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Image, or a designed stand-in — never a broken frame. */
function CoverImage({
  post,
  priority = false,
  sizes,
}: {
  post: Post;
  priority?: boolean;
  sizes: string;
}): ReactNode {
  if (post.featuredImage) {
    return (
      <Image
        src={post.featuredImage}
        alt=""
        fill
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes={sizes}
      />
    );
  }

  // Typographic cover: the category initial on the brand ground. A plain tinted
  // block reads as a missing asset at this size, so the panel gets depth (glow +
  // hairline rule) and real contrast against the white card beside it.
  const initial = (post.tags[0] ?? "C").charAt(0).toUpperCase();

  return (
    <span aria-hidden="true" className="absolute inset-0 overflow-hidden bg-mk-brand-deep">
      <Bloom className="-left-16 -top-16 h-56 w-56 rounded-full bg-mk-accent/25 blur-[70px]" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="font-display text-[clamp(5rem,11vw,8.5rem)] font-extrabold leading-none tracking-[-0.05em] text-mk-accent/45">
          {initial}
        </span>
      </span>
      <span className="absolute inset-x-8 bottom-7 h-px bg-white/15" />
    </span>
  );
}

function FeaturedPost({ post, locale }: { post: Post; locale: string }): ReactNode {
  const { t } = useTranslation();
  const title = getTranslatedTitle(post, locale);
  const excerpt = getTranslatedExcerpt(post, locale);
  const category = post.tags[0] ?? "General";

  return (
    <Link
      href={`/news/${post.slug}`}
      className="group grid overflow-hidden rounded-(--mk-radius-lg) border border-mk-line bg-mk-white transition duration-200 hover:border-mk-brand/25 hover:shadow-(--mk-shadow-card) lg:grid-cols-[1.05fr_1fr]"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-mk-accent-soft lg:aspect-auto lg:min-h-88">
        <CoverImage post={post} priority sizes="(max-width: 1024px) 100vw, 55vw" />
      </div>

      <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <Pill>{category}</Pill>
          <span className="text-[0.78rem] text-mk-ink-mute">
            {readingMinutes(post)} {t.news.minRead}
          </span>
        </div>

        <h2 className="mt-5 font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-mk-ink transition-colors duration-200 group-hover:text-mk-brand">
          {title}
        </h2>

        <p className="mt-4 line-clamp-3 text-[0.95rem] leading-[1.65] text-mk-ink-soft">{excerpt}</p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-mk-line pt-5">
          <span className="text-[0.8rem] text-mk-ink-mute">
            {formatDate(post.publishedAt, locale)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-mk-brand">
            {t.news.readArticle}
            <ArrowIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostRow({ post, locale }: { post: Post; locale: string }): ReactNode {
  const { t } = useTranslation();
  const title = getTranslatedTitle(post, locale);
  const excerpt = getTranslatedExcerpt(post, locale);

  return (
    <li className="border-t border-mk-line">
      <Link
        href={`/news/${post.slug}`}
        className="group grid gap-2 py-7 sm:grid-cols-[8.5rem_1fr_auto] sm:items-start sm:gap-6 lg:py-8"
      >
        <span className="text-[0.78rem] tabular-nums text-mk-ink-mute">
          {formatDate(post.publishedAt, locale)}
        </span>

        <span className="block">
          <span className="block font-display text-[1.05rem] font-extrabold leading-snug tracking-[-0.01em] text-mk-ink transition-colors duration-200 group-hover:text-mk-brand">
            {title}
          </span>
          <span className="mt-1.5 block max-w-[62ch] line-clamp-2 text-[0.88rem] leading-[1.6] text-mk-ink-soft">
            {excerpt}
          </span>
        </span>

        <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-mk-brand sm:pt-1">
          {readingMinutes(post)} {t.news.minRead}
          <ArrowIcon />
        </span>
      </Link>
    </li>
  );
}

export function NewsList({ posts }: { posts: Post[] }): ReactNode {
  const { t, locale } = useTranslation();

  if (posts.length === 0) {
    return (
      <div className="rounded-(--mk-radius-lg) border border-dashed border-mk-line-strong bg-mk-paper/60 px-6 py-16 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-mk-accent-soft text-mk-brand">
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20"
            />
          </svg>
        </span>
        <p className="mt-4 text-[0.92rem] text-mk-ink-soft">{t.news.noPostsYet}</p>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <div>
      <FeaturedPost post={featured} locale={locale} />

      {rest.length > 0 ? (
        <>
          <h2 className="mt-14 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-mk-brand">
            {t.news.morePosts}
          </h2>
          <ul className="mt-4">
            {rest.map((post) => (
              <PostRow key={post.id} post={post} locale={locale} />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
