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
    icon: "🏆",
  },
  {
    title: "Reliability",
    description: "Your deadlines are our deadlines. We deliver consistently, on time, every time.",
    icon: "🤝",
  },
  {
    title: "Transparency",
    description: "Clear communication, honest pricing, and no surprises. You always know where you stand.",
    icon: "💎",
  },
  {
    title: "Growth",
    description: "We're committed to helping your business grow while continuously improving our own skills.",
    icon: "🌱",
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
                <div className="text-4xl mb-4">{value.icon}</div>
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
