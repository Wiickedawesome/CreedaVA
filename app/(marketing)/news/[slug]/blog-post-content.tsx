"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { CtaLink, Section } from "@/components/marketing/primitives";
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
 * Editorial article template.
 *
 * A masthead that spans the container, figures that break wider than the text,
 * and an unboxed reading column. The body used to sit in a rounded white sheet
 * with a card shadow on the cream band, which read as a card floating inside a
 * frame — an article is a page, not a module, so the sheet is gone.
 *
 * The body arrives as HTML from Firestore, so it is styled by the `.mk-article`
 * block in globals.css rather than by utility classes; `--wide` adds the figure
 * breakout. `@tailwindcss/typography` is not installed here, and the old
 * `prose prose-lg` classes produced no CSS at all.
 */

const WORDS_PER_MINUTE = 200;
const NEWS_PATH = "/news";

/**
 * Body measure. `ch` tracks the font size, so the line length survives a font
 * change; a `rem` width does not.
 */
const READING_MEASURE = "mx-auto max-w-[68ch]";

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

/** Separator inside the uppercase kicker row. */
function MetaDot(): ReactNode {
  return (
    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-mk-line-strong" />
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
      {/* Masthead — spans the wide container so the page opens like a
          publication rather than a boxed module. */}
      <Section tone="paper" containerSize="lg" className="pb-10 sm:pb-12 lg:pb-14">
        <BackLink label={t.news.backToNews} />

        <div className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-mk-ink-mute">
          <span className="text-mk-brand">{category}</span>
          {published ? (
            <>
              <MetaDot />
              <time dateTime={post.publishedAt}>{published}</time>
            </>
          ) : null}
          <MetaDot />
          <span>
            {readingMinutes(post)} {t.news.minRead}
          </span>
        </div>

        <h1 className="mt-5 text-balance font-display text-[clamp(2.2rem,5.4vw,4.2rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-mk-ink">
          {title}
        </h1>

        {excerpt ? (
          <p className="mt-6 max-w-[52ch] text-[1.08rem] leading-[1.65] text-mk-ink-soft sm:text-[1.18rem]">
            {excerpt}
          </p>
        ) : null}

        {post.author ? (
          <p className="mt-9 border-t border-mk-line pt-5 text-[0.82rem] text-mk-ink-mute">
            {t.news.byAuthor}{" "}
            <span className="font-semibold text-mk-ink">{post.author}</span>
          </p>
        ) : null}
      </Section>

      {post.featuredImage ? (
        <Section tone="paper" containerSize="lg" padding="none" className="pb-12 sm:pb-16">
          <figure>
            <div className="relative aspect-video overflow-hidden rounded-(--mk-radius) bg-mk-accent-soft">
              <Image
                src={post.featuredImage}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 72rem"
              />
            </div>
          </figure>
        </Section>
      ) : null}

      {/* Body — unboxed reading column on its own surface. The foot rule spans
          the full container while the text does not, which is what stops the
          column from reading as a card. */}
      <Section
        tone="white"
        containerSize="md"
        padding="none"
        className="pb-20 pt-12 sm:pb-24 sm:pt-16"
      >
        <div className={READING_MEASURE}>
          <div
            className="mk-article mk-article--wide"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        <footer className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-mk-line pt-8 sm:flex-row sm:items-center">
          <BackLink label={t.news.backToNews} />
          <CtaLink href="/contact" variant="quiet" analytics="news-post-contact">
            {t.news.ctaButton}
          </CtaLink>
        </footer>
      </Section>
    </article>
  );
}
