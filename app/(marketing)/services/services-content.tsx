import Link from "next/link";
import { Container } from "@/components/ui";
import { PACKAGES_ANCHOR, SERVICE_ANCHORS } from "@/lib/constants/services";
import type { Dictionary } from "@/lib/i18n";

const serviceIcons = [
  <svg key="admin" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  <svg key="exec" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M3 7h18a1 1 0 011 1v11a2 2 0 01-2 2H4a2 2 0 01-2-2V8a1 1 0 011-1zm6 0v2a1 1 0 001 1h4a1 1 0 001-1V7" /></svg>,
  <svg key="hr" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
  <svg key="legal" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18M12 6L6.5 8.5 3 15h7L6.5 8.5M12 6l5.5 2.5L21 15h-7l3.5-6.5M8 21h8" /></svg>,
  <svg key="cust" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  <svg key="social" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>,
  <svg key="data" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  <svg key="book" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="web" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  <svg key="re" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" /></svg>,
  <svg key="ins" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  <svg key="ai" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
];

export function ServicesContent({ t }: { t: Dictionary }) {

  return (
    <>
      {/* Service Packages */}
      <section id={PACKAGES_ANCHOR} className="py-20 lg:py-28 bg-gray-10 scroll-mt-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-4">
              {t.services.packages.title}
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              {t.services.packages.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {t.services.packages.items.map((pkg, i) => {
              const popular = i === 1;
              return (
                <div
                  key={pkg.id}
                  id={`package-${pkg.id}`}
                  className={`relative rounded-2xl p-8 scroll-mt-24 ${
                    popular
                      ? "bg-primary text-white ring-4 ring-primary/20 md:scale-105"
                      : "bg-white border border-border"
                  }`}
                >
                  {"badge" in pkg && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-sm font-medium rounded-full">
                      {pkg.badge}
                    </span>
                  )}

                  <div className="mb-8">
                    <h3
                      className={`text-xl font-bold mb-1 ${
                        popular ? "text-white" : "text-gray-100"
                      }`}
                    >
                      {pkg.name}
                    </h3>
                    <p
                      className={`text-sm font-semibold mb-2 ${
                        popular ? "text-white/90" : "text-gray-100"
                      }`}
                    >
                      {pkg.hours}
                    </p>
                    <p
                      className={`text-sm ${
                        popular ? "text-white/70" : "text-gray-60"
                      }`}
                    >
                      {pkg.desc}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
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
                    data-analytics-cta={`package_${pkg.id}_quote`}
                    className={`block w-full text-center py-3 rounded-md font-medium transition-colors ${
                      popular
                        ? "bg-white text-primary hover:bg-gray-10"
                        : "bg-primary text-white hover:bg-primary-hover"
                    }`}
                  >
                    {t.services.packages.ctaButton}
                  </Link>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Services Heading */}
      <section className="py-20 lg:py-28 bg-linear-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              {t.services.heroTitle}
            </h2>
            <p className="text-lg text-gray-60 leading-relaxed">
              {t.services.heroDesc}
            </p>
          </div>
        </Container>
      </section>

      {/* Services Tile Grid */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.services.categories.map((service, i) => (
              <div
                key={SERVICE_ANCHORS[i]}
                id={SERVICE_ANCHORS[i]}
                className="group bg-white border border-border rounded-2xl p-8 scroll-mt-24 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  {serviceIcons[i]}
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-60 text-sm leading-relaxed mb-5">
                  {service.desc}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-70 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center bg-primary rounded-3xl p-12 lg:p-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              {t.services.ctaTitle}
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
              {t.services.ctaDesc}
            </p>
            <Link
              href="/contact"
              data-analytics-cta="services_bottom_contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-medium rounded-md hover:bg-gray-10 transition-colors"
            >
              {t.services.ctaButton}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
