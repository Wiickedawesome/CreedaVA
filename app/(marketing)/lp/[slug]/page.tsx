import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { fetchAll } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import type { LandingPage } from "@/lib/types/content";
import LpContactForm from "./lp-contact-form";

interface Props {
  params: Promise<{ slug: string }>;
}

const getPage = cache(async (slug: string): Promise<(LandingPage & { id: string }) | null> => {
  const pages = await fetchAll<LandingPage>(
    "landing-pages",
    where("slug", "==", slug),
    where("status", "==", "published"),
  );
  return pages[0] || null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: "Page Not Found" };
  return {
    title: page.title,
    description: page.subheadline,
    openGraph: {
      title: page.headline,
      description: page.subheadline,
      url: `https://creedava.com/lp/${page.slug}`,
      type: "website",
    },
  };
}

export default async function LandingPageRoute({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

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
