import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui";

const stats = [
  { value: "500+", label: "Tasks Completed" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "24/7", label: "Availability" },
  { value: "50+", label: "Happy Clients" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-10 to-white py-20 lg:py-32">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                Professional Virtual Assistants
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-100 leading-tight mb-6">
                Focus on What{" "}
                <span className="text-primary">Matters Most</span>
              </h1>
              <p className="text-lg text-gray-70 leading-relaxed mb-8">
                Delegate your administrative tasks to skilled virtual assistants.
                Save time, reduce costs, and scale your business with CreedaVA&apos;s
                professional support services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-medium rounded-[var(--radius-md)] hover:bg-primary-hover transition-colors text-base"
                >
                  Get Started
                  <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary font-medium rounded-[var(--radius-md)] hover:bg-primary hover:text-white transition-colors text-base"
                >
                  View Services
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <Image
                src="/logo.webp"
                alt="CreedaVA — Professional Virtual Assistants"
                width={380}
                height={380}
                className="w-3/4 h-auto object-contain"
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
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-white/70 mt-1">{stat.label}</p>
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
              How It Works
            </h2>
            <p className="text-lg text-gray-60">
              Get started with your dedicated virtual assistant in just a few
              simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Free Consultation",
                description:
                  "Schedule a discovery call to discuss your needs, goals, and the type of support that would benefit your business most.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Perfect Match",
                description:
                  "We carefully match you with a virtual assistant whose skills, experience, and personality align with your requirements.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Start Growing",
                description:
                  "Your VA hits the ground running. We provide onboarding support and ongoing management to ensure success.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-primary mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-60 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-medium rounded-[var(--radius-md)] hover:bg-primary-hover transition-colors text-base"
            >
              Get Started Today
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
                Why Choose CreedaVA?
              </h2>
              <p className="text-lg text-gray-60 mb-8">
                We combine expertise, reliability, and personalized service to
                help your business thrive.
              </p>
              <div className="space-y-6">
                {[
                  {
                    title: "Experienced Professionals",
                    desc: "Our VAs are vetted experts with years of experience across multiple industries.",
                  },
                  {
                    title: "Flexible & Scalable",
                    desc: "Scale up or down as your business needs change. No long-term commitments required.",
                  },
                  {
                    title: "Cost Effective",
                    desc: "Save up to 70% compared to hiring full-time employees. Pay only for what you need.",
                  },
                  {
                    title: "Data Secure",
                    desc: "Enterprise-grade security and strict NDAs to protect your business information.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center mt-0.5">
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
                <div className="flex items-center gap-4 p-4 bg-gray-10 rounded-[var(--radius-lg)]">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">1</div>
                  <div>
                    <p className="font-medium text-gray-100">Tell us your needs</p>
                    <p className="text-sm text-gray-60">Describe the tasks you need help with</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-10 rounded-[var(--radius-lg)]">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">2</div>
                  <div>
                    <p className="font-medium text-gray-100">Get matched</p>
                    <p className="text-sm text-gray-60">We pair you with the perfect VA</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-10 rounded-[var(--radius-lg)]">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">3</div>
                  <div>
                    <p className="font-medium text-gray-100">Start delegating</p>
                    <p className="text-sm text-gray-60">Focus on growth while we handle the rest</p>
                  </div>
                </div>
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
              Ready to Get Started?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
              Join businesses that trust CreedaVA to handle their operations.
              Book a free consultation today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-medium rounded-[var(--radius-md)] hover:bg-gray-10 transition-colors"
              >
                Book a Consultation
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-medium rounded-[var(--radius-md)] hover:bg-white/10 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
