"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { CtaLink, Pill, Section } from "@/components/marketing/primitives";
import { demoteBodyH1 } from "@/lib/utils/blog-content";
import { normalizeLegacyHtml } from "@/lib/utils/legacy-content";
import {
  getTranslatedContent,
  getTranslatedExcerpt,
  getTranslatedTitle,
} from "@/lib/firebase/translate";
import type { ReactNode } from "react";
import type { BlogPost } from "@/lib/types/content";

/**
 * Article template.
 *
 * The body arrives as HTML from Firestore, so it is styled by the `.mk-article`
 * block in globals.css rather than by utility classes. `@tailwindcss/typography`
 * is not installed here — the previous `prose prose-lg` classes produced no CSS
 * and every published post rendered as raw browser defaults.
 *
 * The body sits on a white "sheet" over the paper surface: it separates reading
 * text from the page furniture and gives the template a shape that is clearly
 * not another card grid.
 */

const WORDS_PER_MINUTE = 200;
const NEWS_PATH = "/news";

type Post = BlogPost & { id: string };

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

function BackLink({ label }: { label: string }): ReactNode {
  return (
    <Link
      href={NEWS_PATH}
      className="group inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-mk-brand transition-colors duration-200 hover:text-mk-brand-bright"
    >
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      {label}
    </Link>
  );
}

function PostNotFound(): ReactNode {
  const { t } = useTranslation();

  return (
    <Section tone="paper">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-[clamp(1.7rem,4vw,2.4rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-mk-ink">
          {t.news.postNotFound}
        </h1>
        <p className="mt-4 text-[0.98rem] leading-[1.7] text-mk-ink-soft">
          {t.news.postNotFoundDesc}
        </p>
        <div className="mt-8">
          <CtaLink href={NEWS_PATH} variant="primary">
            {t.news.backToNews}
          </CtaLink>
        </div>
      </div>
    </Section>
  );
}

export function BlogPostContent({ post }: { post: Post | null }): ReactNode {
  const { t, locale } = useTranslation();

  if (!post) {
    return <PostNotFound />;
  }

  const title = getTranslatedTitle(post, locale);
  const excerpt = getTranslatedExcerpt(post, locale);
  // Strip any legacy inline styling before it reaches the stylesheet: bodies
  // written before the --mk-* redesign carry their own colours and <style>
  // block, and both beat `.mk-article`.
  const content = normalizeLegacyHtml(
    demoteBodyH1(getTranslatedContent(post, locale)),
  );
  const category = post.tags[0] ?? "General";
  const published = formatDate(post.publishedAt, locale);

  return (
    <article>
      <Section tone="paper" className="pb-10 sm:pb-12">
        <div className="mx-auto max-w-3xl">
          <BackLink label={t.news.backToNews} />

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <Pill>{category}</Pill>
            {published ? (
              <span className="text-[0.8rem] text-mk-ink-mute">{published}</span>
            ) : null}
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-mk-line-strong" />
            <span className="text-[0.8rem] text-mk-ink-mute">
              {readingMinutes(post)} {t.news.minRead}
            </span>
          </div>

          <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.4rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-mk-ink">
            {title}
          </h1>

          {excerpt ? (
            <p className="mt-6 max-w-[58ch] text-[1.05rem] leading-[1.7] text-mk-ink-soft">
              {excerpt}
            </p>
          ) : null}

          {post.author ? (
            <p className="mt-6 text-[0.82rem] text-mk-ink-mute">
              {t.news.byAuthor} <span className="font-semibold text-mk-ink">{post.author}</span>
            </p>
          ) : null}
        </div>

        {post.featuredImage ? (
          <figure className="mx-auto mt-10 max-w-4xl">
            <div className="relative aspect-16/9 overflow-hidden rounded-(--mk-radius-lg) bg-mk-accent-soft shadow-(--mk-shadow-card)">
              <Image
                src={post.featuredImage}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 56rem"
              />
            </div>
          </figure>
        ) : null}
      </Section>

      <Section tone="paper" className="pt-0">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-(--mk-radius-lg) bg-mk-white px-6 py-10 shadow-(--mk-shadow-card) sm:px-12 sm:py-14">
            <div className="mk-article" dangerouslySetInnerHTML={{ __html: content }} />
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-5 border-t border-mk-line pt-7 sm:flex-row sm:items-center">
            <BackLink label={t.news.backToNews} />
            <CtaLink href="/contact" variant="quiet" analytics="news-post-contact">
              {t.news.ctaButton}
            </CtaLink>
          </div>
        </div>
      </Section>
    </article>
  );
}
