"use client";

import { Container } from "@/components/ui";
import { NewsList } from "./news-list";
import { useTranslation } from "@/lib/i18n";

export function NewsContent() {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-linear-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              {t.news.heroTitle}
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              {t.news.heroDesc}
            </p>
          </div>
        </Container>
      </section>

      {/* Posts Grid */}
      <section className="py-20 lg:py-28">
        <Container>
          <NewsList />
        </Container>
      </section>

      {/* Stay Connected */}
      <section className="py-16 lg:py-20">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-100 mb-3">
              {t.news.stayConnected}
            </h2>
            <p className="text-gray-60 mb-6">
              {t.news.stayConnectedDesc}
            </p>
            <a
              href="https://www.linkedin.com/company/108356527"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-linkedin text-white font-medium rounded-md hover:bg-linkedin-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              {t.footer.followLinkedIn}
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
