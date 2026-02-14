import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for CreedaVA virtual assistant services. Choose the plan that fits your business.",
};

const plans = [
  {
    name: "Starter",
    price: "299",
    period: "/month",
    description: "Perfect for solopreneurs and small tasks",
    features: [
      "10 hours per month",
      "1 dedicated VA",
      "Email support",
      "Basic admin tasks",
      "48-hour response time",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: "699",
    period: "/month",
    description: "Best for growing businesses with regular needs",
    features: [
      "25 hours per month",
      "1 dedicated VA",
      "Priority email & chat support",
      "All service categories",
      "24-hour response time",
      "Monthly performance reports",
      "Rollover unused hours",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams requiring full-scale VA support",
    features: [
      "Unlimited hours",
      "Dedicated VA team",
      "24/7 priority support",
      "All service categories",
      "Same-day response",
      "Weekly strategy calls",
      "Custom workflows",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              No hidden fees. No long-term contracts. Choose the plan that
              works for your business and scale as you grow.
            </p>
          </div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? "bg-primary text-white ring-4 ring-primary/20 scale-105"
                    : "bg-white border border-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="mb-8">
                  <h3
                    className={`text-xl font-bold mb-2 ${
                      plan.popular ? "text-white" : "text-gray-100"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm mb-6 ${
                      plan.popular ? "text-white/70" : "text-gray-60"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    {plan.price !== "Custom" && (
                      <span
                        className={`text-sm ${
                          plan.popular ? "text-white/70" : "text-gray-60"
                        }`}
                      >
                        $
                      </span>
                    )}
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span
                      className={`text-sm ${
                        plan.popular ? "text-white/70" : "text-gray-60"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-white" : "text-success"
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
                          plan.popular ? "text-white/90" : "text-gray-70"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className={`block w-full text-center py-3 rounded-[var(--radius-md)] font-medium transition-colors ${
                    plan.popular
                      ? "bg-white text-primary hover:bg-gray-10"
                      : "bg-primary text-white hover:bg-primary-hover"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 bg-gray-10">
        <Container size="md">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-100 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            {[
              {
                q: "Can I switch plans?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
              },
              {
                q: "What if I need more hours?",
                a: "Additional hours can be purchased at any time. We also offer rollover on unused hours for Professional plan subscribers.",
              },
              {
                q: "Is there a contract?",
                a: "No long-term contracts required. All plans are month-to-month and can be cancelled at any time.",
              },
              {
                q: "How do I get matched with a VA?",
                a: "After signing up, we assess your needs and pair you with a VA whose skills and experience match your requirements.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="bg-white p-6 rounded-[var(--radius-lg)] border border-border"
              >
                <h3 className="font-bold text-gray-100 mb-2">{faq.q}</h3>
                <p className="text-gray-60 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
