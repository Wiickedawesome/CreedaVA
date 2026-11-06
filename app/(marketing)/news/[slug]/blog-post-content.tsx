"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { CtaLink, Pill, Section } from "@/components/marketing/primitives";
import { demoteBodyH1, withHeadingAnchors } from "@/lib/utils/blog-content";
import type { ArticleHeading } from "@/lib/utils/blog-content";
import { normalizeLegacyHtml } from "@/lib/utils/legacy-content";
import {
  getTranslatedContent,
  getTranslatedExcerpt,
  getTranslatedTitle,
} from "@/lib/firebase/translate";
import type { ReactNode } from "react";
import { useState } from "react";
import type { BlogReference, BlogPost } from "@/lib/types/content";

/**
 * Editorial article page.
 *
 * Three things make this different from a blog card with a body under it:
 *
 * 1. The masthead is a two-column spread — copy on the left, cover on the
 *    right — so the page opens across its full width instead of starting as a
 *    narrow ribbon down the middle.
 * 2. The body runs on the wide container with a sticky rail (contents + share)
 *    beside it. Text is capped in `ch` for readability; media and tables are
 *    not, so images fill the column.
 * 3. The page continues past the last paragraph — author, tags, related posts.
 *    An article that just stops is what makes a template feel thin.
 *
 * The body itself is stored HTML. It is normalised in `editorial` mode, which
 * drops the inline layout (`display:grid`, paddings, `text-align:center`) that
 * generated bodies arrive with — that markup is what made a post look like a
 * pasted-in dashboard no matter how wide the column was.
 */

const WORDS_PER_MINUTE = 200;
const NEWS_PATH = "/news";
const SITE_ORIGIN = "https://creedava.com";

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

/** Initials for the byline and author card — no avatar asset exists. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Sticky contents list built from the body's own `h2`/`h3`s.
 *
 * Renders nothing below two headings: a one-item contents list is noise, and
 * most short posts have a single `h2`.
 */
function TableOfContents({ headings }: { headings: ArticleHeading[] }): ReactNode {
  const { t } = useTranslation();
  if (headings.length < 2) return null;

  // A long article can carry 16 headings; a 16-row rail is a wall, not a guide.
  // Past that point the top-level sections are the useful index.
  const MAX_DETAILED_HEADINGS = 10;
  const displayed =
    headings.length > MAX_DETAILED_HEADINGS
      ? headings.filter((heading) => heading.level === 2)
      : headings;

  return (
    <nav aria-label={t.news.inThisArticle} className="border-l border-mk-line pl-5">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-mk-ink-mute">
        {t.news.inThisArticle}
      </p>
      <ol className="mt-3.5 space-y-2.5">
        {displayed.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${heading.id}`}
              className="block text-[0.8rem] leading-snug text-mk-ink-soft transition-colors duration-150 hover:text-mk-brand"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

interface ShareTarget {
  label: string;
  href: string;
}

function shareTargets(url: string, title: string): ShareTarget[] {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return [
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];
}

const SHARE_LINK_CLASSES =
  "inline-flex rounded-full border border-mk-line-strong px-3 py-1.5 text-[0.75rem] font-semibold text-mk-ink-soft transition-colors duration-150 hover:border-mk-brand hover:text-mk-brand";

function ShareRail({ url, title }: { url: string; title: string }): ReactNode {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access is denied in some embedded browsers and over http.
      // Leave the label alone rather than claim a copy that did not happen.
      setCopied(false);
    }
  }

  return (
    <div className="border-t border-mk-line pt-5">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-mk-ink-mute">
        {t.news.share}
      </p>
      <ul className="mt-3.5 flex flex-wrap gap-2">
        {shareTargets(url, title).map((target) => (
          <li key={target.label}>
            <a
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              className={SHARE_LINK_CLASSES}
            >
              {target.label}
            </a>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={copyLink}
            aria-live="polite"
            className={SHARE_LINK_CLASSES}
          >
            {copied ? t.news.linkCopied : t.news.copyLink}
          </button>
        </li>
      </ul>
    </div>
  );
}

/**
 * The sources list.
 *
 * Rendered whenever a post has references, and deliberately visible rather than
 * footnoted: the whole point of the rule this enforces is that a claim a reader
 * cannot check is a claim we should not have made. Inline markers in the body
 * link here as `#source-1`, `#source-2`.
 */
function Sources({ references }: { references: BlogReference[] }): ReactNode {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="article-sources" className="mt-14 border-t border-mk-line pt-8">
      <h2
        id="article-sources"
        className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-mk-ink-mute"
      >
        {t.news.sources}
      </h2>
      <ol className="mt-4 space-y-2.5">
        {references.map((reference, index) => {
          const detail = [reference.source, reference.year].filter(Boolean).join(", ");
          return (
            <li
              key={`${reference.label}-${index}`}
              id={`source-${index + 1}`}
              className="flex gap-3 text-[0.85rem] leading-[1.6] text-mk-ink-soft"
            >
              <span aria-hidden="true" className="shrink-0 tabular-nums text-mk-ink-mute">
                [{index + 1}]
              </span>
              <span className="min-w-0">
                {reference.url ? (
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="font-semibold text-mk-brand underline decoration-1 underline-offset-2 hover:text-mk-brand-bright"
                  >
                    {reference.label}
                  </a>
                ) : (
                  <span className="font-semibold text-mk-ink">{reference.label}</span>
                )}
                {detail ? <span className="text-mk-ink-mute"> — {detail}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AuthorCard({ name, published }: { name: string; published: string }): ReactNode {
  const { t } = useTranslation();

  return (
    <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-mk-line pt-8">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-mk-brand-deep font-display text-[0.95rem] font-extrabold tracking-[-0.02em] text-mk-accent"
      >
        {initials(name)}
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-mk-ink-mute">
          {t.news.byAuthor}
        </p>
        <p className="font-display text-[1.05rem] font-extrabold tracking-[-0.01em] text-mk-ink">
          {name}
        </p>
        {published ? (
          <p className="mt-0.5 text-[0.8rem] text-mk-ink-mute">{published}</p>
        ) : null}
      </div>
      <Link
        href={NEWS_PATH}
        className="ml-auto text-[0.82rem] font-semibold text-mk-brand transition-colors duration-150 hover:text-mk-brand-bright"
      >
        {t.news.morePosts}
      </Link>
    </div>
  );
}

function RelatedCard({ post, locale }: { post: Post; locale: string }): ReactNode {
  const title = getTranslatedTitle(post, locale);
  const excerpt = getTranslatedExcerpt(post, locale);
  const category = post.tags?.[0] ?? "General";

  return (
    <li>
      <Link
        href={`${NEWS_PATH}/${post.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-(--mk-radius-lg) border border-mk-line bg-mk-white transition duration-200 hover:border-mk-brand/30 hover:shadow-(--mk-shadow-card)"
      >
        <span className="relative aspect-16/10 overflow-hidden bg-mk-accent-soft">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-mk-brand-deep">
              <span className="font-display text-[3.5rem] font-extrabold leading-none text-mk-accent/40">
                {category.charAt(0).toUpperCase()}
              </span>
            </span>
          )}
        </span>

        <span className="flex flex-1 flex-col p-6">
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-mk-brand">
            {category}
          </span>
          <span className="mt-2.5 font-display text-[1.05rem] font-extrabold leading-snug tracking-[-0.015em] text-mk-ink transition-colors duration-200 group-hover:text-mk-brand">
            {title}
          </span>
          <span className="mt-2 line-clamp-2 text-[0.85rem] leading-[1.6] text-mk-ink-soft">
            {excerpt}
          </span>
          <span className="mt-auto pt-4 text-[0.76rem] text-mk-ink-mute">
            {formatDate(post.publishedAt, locale)}
          </span>
        </span>
      </Link>
    </li>
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

export function BlogPostContent({
  post,
  related = [],
}: {
  post: Post | null;
  related?: Post[];
}): ReactNode {
  const { t, locale } = useTranslation();

  if (!post) {
    return <PostNotFound />;
  }

  const title = getTranslatedTitle(post, locale);
  const excerpt = getTranslatedExcerpt(post, locale);
  // `editorial` mode also drops the inline layout generated bodies arrive with
  // (centred text, grid card rows, oversized padding) — see lib/utils/legacy-content.
  const normalized = normalizeLegacyHtml(
    demoteBodyH1(getTranslatedContent(post, locale)),
    { mode: "editorial" },
  );
  // Anchors are injected into the HTML string because the body is never mounted
  // as React nodes; the returned list drives the sticky contents rail.
  const { html: content, headings } = withHeadingAnchors(normalized);

  const category = post.tags?.[0] ?? "General";
  const published = formatDate(post.publishedAt, locale);
  const minutes = readingMinutes(post);
  const canonicalUrl = `${SITE_ORIGIN}${NEWS_PATH}/${post.slug}`;

  return (
    <article>
      {/* Masthead — copy and cover side by side on desktop, so the page opens
          across its full width rather than as a column in the middle. */}
      <Section tone="paper" containerSize="xl" className="pt-6 pb-12 sm:pt-8 lg:pb-16">
        <BackLink label={t.news.backToNews} />

        <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-mk-ink-mute">
              <span className="text-mk-brand">{category}</span>
              {published ? (
                <>
                  <MetaDot />
                  <time dateTime={post.publishedAt}>{published}</time>
                </>
              ) : null}
              <MetaDot />
              <span>
                {minutes} {t.news.minRead}
              </span>
            </div>

            <h1 className="mt-5 text-balance font-display text-[clamp(2.3rem,4.9vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.042em] text-mk-ink">
              {title}
            </h1>

            {excerpt ? (
              <p className="mt-6 max-w-[46ch] text-[1.1rem] leading-[1.6] text-mk-ink-soft sm:text-[1.2rem]">
                {excerpt}
              </p>
            ) : null}

            {post.author ? (
              <div className="mt-9 flex items-center gap-3 border-t border-mk-line pt-6">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mk-brand-deep font-display text-[0.8rem] font-extrabold tracking-[-0.02em] text-mk-accent"
                >
                  {initials(post.author)}
                </span>
                <p className="text-[0.85rem] text-mk-ink-mute">
                  {t.news.byAuthor}{" "}
                  <span className="font-semibold text-mk-ink">{post.author}</span>
                </p>
              </div>
            ) : null}
          </div>

          {post.featuredImage ? (
            <figure className="relative aspect-4/3 overflow-hidden rounded-(--mk-radius-lg) bg-mk-accent-soft">
              <Image
                src={post.featuredImage}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40rem"
              />
            </figure>
          ) : null}
        </div>
      </Section>

      {/* Body — wide container with a sticky rail on the left. The text keeps a
          readable measure; the media inside the column does not. The rail
          starts at 900px, not 1024px: a 13-inch laptop window is often ~900
          wide, and hiding the contents list there is what makes the page look
          like a narrow centred column again. */}
      <Section
        tone="white"
        containerSize="xl"
        padding="none"
        className="pb-16 pt-12 sm:pt-14 lg:pb-24"
      >
        <div className="min-[900px]:grid min-[900px]:grid-cols-[13rem_minmax(0,1fr)] min-[900px]:gap-10 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-16">
          <aside className="hidden min-[900px]:block">
            <div className="sticky top-28 space-y-8">
              <TableOfContents headings={headings} />
              <ShareRail url={canonicalUrl} title={title} />
            </div>
          </aside>

          <div className="min-w-0">
            <div
              className="mk-article mk-article--wide"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {post.references?.length ? <Sources references={post.references} /> : null}

            {post.tags?.length ? (
              <ul className="mt-12 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Pill>{tag}</Pill>
                  </li>
                ))}
              </ul>
            ) : null}

            {post.author ? (
              <AuthorCard name={post.author} published={published} />
            ) : null}

            <div className="mt-10 flex flex-col items-start justify-between gap-5 border-t border-mk-line pt-8 sm:flex-row sm:items-center">
              <BackLink label={t.news.backToNews} />
              <CtaLink href="/contact" variant="quiet" analytics="news-post-contact">
                {t.news.ctaButton}
              </CtaLink>
            </div>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section tone="paper" className="border-t border-mk-line">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(1.5rem,2.6vw,2rem)] font-extrabold tracking-tight text-mk-ink">
              {t.news.relatedPosts}
            </h2>
            <Link
              href={NEWS_PATH}
              className="text-[0.85rem] font-semibold text-mk-brand transition-colors duration-150 hover:text-mk-brand-bright"
            >
              {t.news.morePosts}
            </Link>
          </div>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <RelatedCard key={item.id} post={item} locale={locale} />
            ))}
          </ul>
        </Section>
      ) : null}
    </article>
  );
}
