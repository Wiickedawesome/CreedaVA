import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about CreedaVA — our mission, team, and commitment to providing exceptional virtual assistant services.",
};

const values = [
  {
    title: "Excellence",
    description: "We hold ourselves to the highest standards in every task, no matter how small.",
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 11.25h-1.5A3.375 3.375 0 007.875 14.25v4.5m4.125-12a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM12 6.75l2.25-2.25M12 6.75L9.75 4.5" />
      </svg>
    ),
  },
  {
    title: "Reliability",
    description: "Your deadlines are our deadlines. We deliver consistently, on time, every time.",
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
  {
    title: "Transparency",
    description: "Clear communication, honest pricing, and no surprises. You always know where you stand.",
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Growth",
    description: "We're committed to helping your business grow while continuously improving our own skills.",
    icon: (
      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-10 to-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
                About <span className="text-primary">CreedaVA</span>
              </h1>
              <p className="text-lg text-gray-60 leading-relaxed mb-6">
                CreedaVA was founded with a simple mission: to help businesses
                of all sizes access the professional support they need to grow,
                without the overhead of full-time hires.
              </p>
              <p className="text-gray-60 leading-relaxed">
                We connect skilled virtual assistants with businesses worldwide,
                providing reliable, high-quality support across administrative,
                creative, and technical domains.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl aspect-square flex items-center justify-center">
              <div className="text-center p-12">
                <p className="text-6xl font-bold text-primary mb-4">VA</p>
                <p className="text-xl font-medium text-gray-100">Virtual Assistants</p>
                <p className="text-gray-60 mt-2">You Can Count On</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-60 leading-relaxed max-w-2xl mx-auto">
              To empower businesses by providing exceptional virtual assistant
              services that free up time, reduce operational costs, and enable
              founders and teams to focus on strategy and growth.
            </p>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28 bg-gray-10">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-60">
              The principles that guide everything we do.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white p-8 rounded-2xl border border-border text-center hover:shadow-lg transition-shadow"
              >
                <div className="mb-4 flex justify-center">{value.icon}</div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-60 text-sm leading-relaxed">
                  {value.description}
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
              Let&apos;s Work Together
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Ready to take your business to the next level? We&apos;d love to hear
              from you.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-medium rounded-[var(--radius-md)] hover:bg-gray-10 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
