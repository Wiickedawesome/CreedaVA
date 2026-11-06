"use client";

import { useTranslation } from "@/lib/i18n";
import { Section } from "@/components/marketing/primitives";
import { NewsList } from "./news-list";
import type { ReactNode } from "react";
import type { BlogPost } from "@/lib/types/content";

const LINKEDIN_URL = "https://www.linkedin.com/company/108356527";

type Post = BlogPost & { id: string };

/**
 * Page shell for /news. The hero is left-aligned on `paper` to match the rest of
 * the marketing surface, and the list band drops its top padding so the featured
 * card sits close to the lede instead of floating in a second gutter.
 */
function NewsHero({ postCount }: { postCount: number }): ReactNode {
  const { t } = useTranslation();

  return (
    <Section tone="paper" className="pb-0">
      <div className="max-w-3xl">
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-mk-ink">
          {t.news.heroTitle}
        </h1>
        <p className="mt-6 max-w-[54ch] text-[1.02rem] leading-[1.7] text-mk-ink-soft sm:text-[1.08rem]">
          {t.news.heroDesc}
        </p>
        {postCount > 0 ? (
          <p className="mt-6 text-[0.8rem] tabular-nums text-mk-ink-mute">
            {postCount} {t.news.postCountLabel}
          </p>
        ) : null}
      </div>
    </Section>
  );
}

function StayConnected(): ReactNode {
  const { t } = useTranslation();

  return (
    <Section tone="white">
      <div className="flex flex-col items-start justify-between gap-7 rounded-(--mk-radius-lg) border border-mk-line bg-mk-paper px-6 py-8 sm:px-9 sm:py-10 lg:flex-row lg:items-center">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-[1.15rem] font-extrabold leading-[1.25] tracking-[-0.02em] text-mk-ink">
            {t.news.stayConnected}
          </h2>
          <p className="mt-2.5 text-[0.9rem] leading-[1.65] text-mk-ink-soft">
            {t.news.stayConnectedDesc}
          </p>
        </div>

        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics-cta="news-linkedin"
          className="group inline-flex min-h-12 shrink-0 items-center gap-2.5 rounded-full border border-mk-line-strong bg-mk-white px-6 py-3 text-[0.92rem] font-semibold text-mk-ink transition-colors duration-200 hover:border-mk-brand hover:text-mk-brand"
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 013.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zM7.12 20.45H3.55V9h3.57v11.45z" />
          </svg>
          {t.footer.followLinkedIn}
        </a>
      </div>
    </Section>
  );
}

export function NewsContent({ posts }: { posts: Post[] }): ReactNode {
  return (
    <>
      <NewsHero postCount={posts.length} />
      <Section tone="paper" className="pt-10 sm:pt-12 lg:pt-14">
        <NewsList posts={posts} />
      </Section>
      <StayConnected />
    </>
  );
}
