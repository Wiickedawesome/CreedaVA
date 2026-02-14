import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about CreedaVA's virtual assistant services, pricing, onboarding, and more.",
};

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is a virtual assistant?",
        a: "A virtual assistant (VA) is a trained remote professional who provides administrative, technical, or specialized support to businesses. They work from a remote location and handle tasks ranging from email management to customer service, bookkeeping, and more.",
      },
      {
        q: "How is CreedaVA different from other VA companies?",
        a: "CreedaVA provides bilingual (English/Spanish) virtual assistants who are carefully matched to your business needs. We offer dedicated support, ongoing quality management, and flexible plans — whether you need a few hours a week or a full-time team.",
      },
      {
        q: "What industries do you serve?",
        a: "We work with businesses across many industries including real estate, insurance, e-commerce, healthcare, legal, finance, and more. Our VAs are trained to adapt to your specific industry requirements.",
      },
    ],
  },
  {
    category: "Services",
    questions: [
      {
        q: "What tasks can a virtual assistant handle?",
        a: "Our VAs can handle administrative support, customer service, social media management, data entry and research, bookkeeping, real estate support, insurance processing, and web/digital tasks. We can also train VAs on custom workflows specific to your business.",
      },
      {
        q: "Can I get a VA for a specific project?",
        a: "Yes! We offer flexible arrangements — from ongoing support to project-based work. Whether you need help with a one-time data migration or a recurring weekly schedule, we can accommodate your needs.",
      },
      {
        q: "Do you offer bilingual services?",
        a: "Absolutely. Our team includes bilingual virtual assistants fluent in English and Spanish, making us a great fit for businesses serving diverse markets.",
      },
    ],
  },
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I get started?",
        a: "It's simple: schedule a free consultation through our Contact page. We'll discuss your needs, match you with the right VA, and get you onboarded — usually within a few business days.",
      },
      {
        q: "Is there a minimum commitment?",
        a: "We offer flexible plans with no long-term contracts required. You can scale up or down based on your needs. We recommend starting with at least 20 hours per month to see meaningful results.",
      },
      {
        q: "How long does onboarding take?",
        a: "Most clients are fully onboarded within 3–5 business days. This includes matching you with a VA, providing brand-specific training, and setting up communication channels.",
      },
    ],
  },
  {
    category: "Pricing & Billing",
    questions: [
      {
        q: "How much do your services cost?",
        a: "Our pricing depends on the plan and hours you need. Visit our Pricing page for detailed plan options, or contact us for a custom quote tailored to your requirements.",
      },
      {
        q: "Are there any setup fees?",
        a: "No. There are no hidden fees or setup charges. You only pay for the plan you choose.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept major credit cards, bank transfers, and can set up recurring billing for your convenience.",
      },
    ],
  },
  {
    category: "Quality & Security",
    questions: [
      {
        q: "How do you ensure quality?",
        a: "Every VA goes through a rigorous vetting process. We provide ongoing training, regular performance reviews, and a dedicated account manager to ensure consistent quality. If you're ever unsatisfied, we'll find a replacement at no extra cost.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. All our VAs sign NDAs and follow strict data security protocols. We use encrypted communication channels and can comply with your organization's specific security requirements.",
      },
      {
        q: "What happens if my VA is unavailable?",
        a: "We have backup systems in place. If your VA is unavailable due to illness or time off, we'll provide a trained replacement to ensure continuity of service.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              Everything you need to know about our virtual assistant services.
              Can&apos;t find what you&apos;re looking for?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Contact us
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
            {faqs.map((category) => (
              <div key={category.category}>
                <h2 className="text-2xl font-bold text-gray-100 mb-8 pb-3 border-b border-border">
                  {category.category}
                </h2>
                <div className="space-y-8">
                  {category.questions.map((item) => (
                    <div key={item.q}>
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
              Still Have Questions?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
              Our team is ready to help. Reach out and we&apos;ll get back to
              you within 24 hours.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-medium rounded-[var(--radius-md)] hover:bg-gray-10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
