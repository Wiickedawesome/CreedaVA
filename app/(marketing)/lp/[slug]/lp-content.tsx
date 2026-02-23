"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui";
import { fetchAll, where } from "@/lib/firebase/firestore";
import type { LandingPage } from "@/lib/types/content";
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
            <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
            <div className="h-48 bg-gray-200 rounded-2xl mt-8" />
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
            <h1 className="text-2xl font-bold text-gray-100 mb-3">Page Not Found</h1>
            <p className="text-gray-50">The landing page you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-32 bg-linear-to-b from-gray-10 to-white">
        <Container size="md">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6 leading-tight">
              {page.headline}
            </h1>
            <p className="text-lg lg:text-xl text-gray-60 leading-relaxed mb-10">
              {page.subheadline}
            </p>
            <LpContactForm
              ctaText={page.ctaText || "Get Started"}
              ctaEmail={page.ctaEmail || "contact@creedava.com"}
              pageTitle={page.title}
              pageSlug={page.slug}
            />
          </div>
        </Container>
      </section>

      {/* Body */}
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
            dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
          />
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="rounded-3xl bg-primary p-12 lg:p-16 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              {page.headline}
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              {page.subheadline}
            </p>
            <LpContactForm
              ctaText={page.ctaText || "Get Started"}
              ctaEmail={page.ctaEmail || "contact@creedava.com"}
              pageTitle={page.title}
              pageSlug={page.slug}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
