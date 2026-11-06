"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui";
import { Bloom, Section } from "@/components/marketing/primitives";
import { fetchAll, where } from "@/lib/firebase/firestore";
import type { LandingPage } from "@/lib/types/content";
import { normalizeLegacyHtml } from "@/lib/utils/legacy-content";
import LpContactForm from "./lp-contact-form";

interface Props {
  slug: string;
}

export default function LpContent({ slug }: Props) {
  const [page, setPage] = useState<(LandingPage & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const pages = await fetchAll<LandingPage>(
          "landing-pages",
          where("slug", "==", slug),
          where("status", "==", "published"),
        );
        if (mounted) setPage(pages[0] || null);
      } catch (err) {
        console.error("Failed to fetch landing page:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <section className="py-20 lg:py-32">
        <Container size="md">
          <div className="text-center animate-pulse space-y-4 max-w-2xl mx-auto">
            <div className="h-10 bg-mk-line rounded w-3/4 mx-auto" />
            <div className="h-6 bg-mk-line rounded w-1/2 mx-auto" />
            <div className="mt-8 h-48 rounded-(--mk-radius-lg) bg-mk-line" />
          </div>
        </Container>
      </section>
    );
  }

  if (!page) {
    return (
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-mk-ink mb-3">Page Not Found</h1>
            <p className="text-mk-ink-mute">The landing page you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-linear-to-b from-mk-paper to-mk-white pb-20 pt-24 lg:pb-28 lg:pt-32">
        <Container size="md">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-mk-ink">
              {page.headline}
            </h1>
            <p className="mx-auto mt-6 max-w-[52ch] text-[1.05rem] leading-[1.7] text-mk-ink-soft sm:text-[1.12rem]">
              {page.subheadline}
            </p>
            <div className="mt-10">
              <LpContactForm
                ctaText={page.ctaText || "Get Started"}
                ctaEmail={page.ctaEmail || "contact@creedava.com"}
                pageTitle={page.title}
                pageSlug={page.slug}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Body — `mk-article` rather than `prose`: the typography plugin is not
          installed, so `prose` classes emit no CSS at all and this body would
          render as raw unstyled HTML. Same treatment as the news article. */}
      <Section tone="paper" padding="none" className="pb-16 lg:pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-(--mk-radius-lg) bg-mk-white px-6 py-10 shadow-(--mk-shadow-card) sm:px-12 sm:py-14">
            <div
              className="mk-article"
              dangerouslySetInnerHTML={{ __html: normalizeLegacyHtml(page.bodyHtml) }}
            />
          </div>
        </div>
      </Section>

      {/* Closing CTA — same recipe as the closing panels on /, /pricing and
          /services: brand-deep panel, two accent blooms, paper text. */}
      <Section tone="paper" padding="none" className="pb-20 pt-4 sm:pt-6 lg:pb-28">
        <div className="relative overflow-hidden rounded-(--mk-radius-lg) bg-mk-brand-deep px-6 py-12 text-center sm:px-10 sm:py-14 lg:px-16 lg:py-20">
          <Bloom className="-right-24 -top-24 h-[360px] w-[360px] rounded-full bg-mk-accent/18 blur-[90px]" />
          <Bloom className="-bottom-32 -left-20 h-[320px] w-[320px] rounded-full bg-mk-brand-bright/25 blur-[100px]" />
          <div className="relative">
            <h2 className="font-display text-[clamp(1.7rem,3.4vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-mk-paper">
              {page.headline}
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[1rem] leading-[1.7] text-mk-paper/70">
              {page.subheadline}
            </p>
            <div className="mt-8">
              <LpContactForm
                ctaText={page.ctaText || "Get Started"}
                ctaEmail={page.ctaEmail || "contact@creedava.com"}
                pageTitle={page.title}
                pageSlug={page.slug}
              />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
