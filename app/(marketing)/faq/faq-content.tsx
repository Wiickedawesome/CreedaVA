"use client";

import Link from "next/link";
import { Container } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

export function FaqContent() {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-linear-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              {t.faq.heroTitle}
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              {t.faq.heroDesc}{" "}
              <Link href="/contact" className="text-primary hover:underline">
                {t.faq.heroLink}
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>

      {/* FAQ Content */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="space-y-16">
            {t.faq.categories.map((category, ci) => (
              <div key={ci}>
                <h2 className="text-2xl font-bold text-gray-100 mb-8 pb-3 border-b border-border">
                  {category.name}
                </h2>
                <div className="space-y-8">
                  {category.questions.map((item, qi) => (
                    <div key={qi}>
                      <h3 className="text-lg font-semibold text-gray-100 mb-2">
                        {item.q}
                      </h3>
                      <p className="text-gray-60 leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              {t.faq.ctaTitle}
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
              {t.faq.ctaDesc}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-medium rounded-md hover:bg-gray-10 transition-colors"
            >
              {t.faq.ctaButton}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
