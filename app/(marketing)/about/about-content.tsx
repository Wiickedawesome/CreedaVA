"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

/** Lazy-load WorldMap — 226 lines of SVG paths, only visible below the fold */
const WorldMap = dynamic(
  () => import("@/components/ui/world-map").then((m) => m.WorldMap),
  {
    loading: () => (
      <div className="w-full aspect-2/1 bg-gray-10 rounded-xl animate-pulse" />
    ),
    ssr: false,
  },
);

const valueIcons = [
  <svg key="exc" aria-hidden="true" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 11.25h-1.5A3.375 3.375 0 007.875 14.25v4.5m4.125-12a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM12 6.75l2.25-2.25M12 6.75L9.75 4.5" /></svg>,
  <svg key="rel" aria-hidden="true" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>,
  <svg key="trn" aria-hidden="true" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  <svg key="grw" aria-hidden="true" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" /></svg>,
];

export function AboutContent() {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-linear-to-b from-gray-10 to-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
                {t.about.heroTitle} <span className="text-primary">{t.about.heroTitleHighlight}</span>
              </h1>
              <p className="text-lg text-gray-60 leading-relaxed mb-6">
                {t.about.heroP1}
              </p>
              <p className="text-gray-60 leading-relaxed">
                {t.about.heroP2}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <WorldMap className="w-full h-auto" />
            </div>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-6">
              {t.about.missionTitle}
            </h2>
            <p className="text-xl text-gray-60 leading-relaxed max-w-2xl mx-auto">
              {t.about.missionDesc}
            </p>
          </div>
        </Container>
      </section>

      {/* Vision */}
      <section className="py-20 lg:py-28 bg-footer-bg">
        <Container size="md">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/10 text-white flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {t.about.visionTitle}
            </h2>
            <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              {t.about.visionDesc}
            </p>
          </div>
        </Container>
      </section>

      {/* Our Approach */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-6">
              {t.about.approachTitle}
            </h2>
            <p className="text-xl text-gray-60 leading-relaxed max-w-2xl mx-auto">
              {t.about.approachDesc}
            </p>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28 bg-gray-10">
        <Container>
          <div className="text-center mb-16">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-4">
              {t.about.valuesTitle}
            </h2>
            <p className="text-lg text-gray-60">
              {t.about.valuesDesc}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.about.values.map((value, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl border border-border text-center hover:shadow-lg transition-shadow"
              >
                <div className="mb-4 flex justify-center">{valueIcons[i]}</div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-60 text-sm leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center bg-primary rounded-3xl p-12 lg:p-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t.about.ctaTitle}
            </h2>
            <p className="text-lg text-white/80 mb-8">
              {t.about.ctaDesc}
            </p>
            <Link
              href="/contact"
              data-analytics-cta="about_bottom_contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-medium rounded-md hover:bg-gray-10 transition-colors"
            >
              {t.about.ctaButton}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
