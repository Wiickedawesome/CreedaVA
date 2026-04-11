import Link from "next/link";
import { Container } from "@/components/ui";
import type { Dictionary } from "@/lib/i18n";

export function PricingContent({ t }: { t: Dictionary }) {

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-linear-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              {t.pricing.heroTitle}
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              {t.pricing.heroDesc}
            </p>
          </div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {t.pricing.plans.map((plan, i) => {
              const popular = i === 1;
              const priceNum = plan.price.replace(/[^0-9,]/g, "");
              const isCustom = !priceNum;
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl p-8 ${
                    popular
                      ? "bg-primary text-white ring-4 ring-primary/20 md:scale-105"
                      : "bg-white border border-border"
                  }`}
                >
                  {popular && "badge" in plan && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-sm font-medium rounded-full">
                      {(plan as { badge: string }).badge}
                    </span>
                  )}
                  <div className="mb-8">
                    <h3
                      className={`text-xl font-bold mb-1 ${
                        popular ? "text-white" : "text-gray-100"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm font-semibold mb-2 ${
                        popular ? "text-white/90" : "text-gray-100"
                      }`}
                    >
                      {plan.hours}
                    </p>
                    <p
                      className={`text-sm mb-6 ${
                        popular ? "text-white/70" : "text-gray-60"
                      }`}
                    >
                      {plan.desc}
                    </p>
                    <div className="flex items-baseline gap-1">
                      {!isCustom && (
                        <span
                          className={`text-sm ${
                            popular ? "text-white/70" : "text-gray-60"
                          }`}
                        >
                          $
                        </span>
                      )}
                      <span className="text-4xl font-bold">
                        {isCustom ? plan.price : priceNum}
                      </span>
                      {!isCustom && (
                        <span
                          className={`text-sm ${
                            popular ? "text-white/70" : "text-gray-60"
                          }`}
                        >
                          /month
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-3">
                        <svg
                          className={`w-5 h-5 mt-0.5 shrink-0 ${
                            popular ? "text-white" : "text-success"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span
                          className={`text-sm ${
                            popular ? "text-white/90" : "text-gray-70"
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/contact"
                    className={`block w-full text-center py-3 rounded-md font-medium transition-colors ${
                      popular
                        ? "bg-white text-primary hover:bg-gray-10"
                        : "bg-primary text-white hover:bg-primary-hover"
                    }`}
                  >
                    {t.pricing.ctaButton}
                  </Link>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Custom Needs */}
      <section className="py-16 lg:py-24">
        <Container size="md">
          <div className="bg-gray-10 border border-border rounded-3xl p-10 lg:p-14 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-100 mb-4">
              {t.pricing.customTitle}
            </h2>
            <p className="text-lg text-gray-70 max-w-2xl mx-auto mb-8">
              {t.pricing.customDesc}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
            >
              {t.pricing.customButton}
            </Link>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 bg-gray-10">
        <Container size="md">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">
              {t.pricing.faqTitle}
            </h2>
          </div>
          <div className="space-y-6">
            {t.pricing.faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-lg border border-border"
              >
                <h3 className="font-bold text-gray-100 mb-2">{faq.q}</h3>
                <p className="text-gray-60 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/faq"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              {t.pricing.seeMore}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
