"use client";

import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

const statValues = ["500+", "98%", "24/7", "50+"];
const statKeys = [
  "tasksCompleted",
  "clientSatisfaction",
  "availability",
  "happyClients",
] as const;

const stepIcons = [
  <svg key="cal" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>,
  <svg key="ppl" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
  <svg key="grow" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>,
];

export function HomeContent() {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-gray-10 to-white py-20 lg:py-32">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                {t.home.heroBadge}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-100 leading-tight mb-6">
                {t.home.heroTitle}{" "}
                <span className="text-primary">{t.home.heroTitleHighlight}</span>
              </h1>
              <p className="text-lg text-gray-70 leading-relaxed mb-8">
                {t.home.heroDesc}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors text-base"
                >
                  {t.home.heroCtaPrimary}
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary font-medium rounded-md hover:bg-primary hover:text-white transition-colors text-base"
                >
                  {t.home.heroCtaSecondary}
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center mt-12 lg:mt-0">
              <Image
                src="/logo.webp"
                alt="CreedaVA — Professional Virtual Assistants"
                width={380}
                height={380}
                className="w-48 sm:w-64 lg:w-3/4 h-auto object-contain"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-14 bg-[#1B2A4A]">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statKeys.map((key, i) => (
              <div key={key} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-white">
                  {statValues[i]}
                </p>
                <p className="text-sm text-white/70 mt-1">{t.home.stats[key]}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-4">
              {t.home.howItWorks}
            </h2>
            <p className="text-lg text-gray-60">
              {t.home.howItWorksDesc}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {t.home.steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  {stepIcons[i]}
                </div>
                <div className="text-sm font-bold text-primary mb-2">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-60 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors text-base"
            >
              {t.home.getStartedToday}
            </Link>
          </div>
        </Container>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 lg:py-28 bg-gray-10">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-6">
                {t.home.whyChoose}
              </h2>
              <p className="text-lg text-gray-60 mb-8">
                {t.home.whyChooseDesc}
              </p>
              <div className="space-y-6">
                {t.home.whyItems.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-100">{item.title}</h4>
                      <p className="text-sm text-gray-60 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-border">
              <div className="space-y-6">
                {t.home.whySteps.map((ws, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-10 rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">{i + 1}</div>
                    <div>
                      <p className="font-medium text-gray-100">{ws.title}</p>
                      <p className="text-sm text-gray-60">{ws.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center bg-primary rounded-3xl p-12 lg:p-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              {t.home.ctaTitle}
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
              {t.home.ctaDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/join"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-medium rounded-md hover:bg-gray-10 transition-colors"
              >
                {t.home.ctaBookConsultation}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-medium rounded-md hover:bg-white/10 transition-colors"
              >
                {t.home.ctaViewPricing}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
