import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore CreedaVA's professional virtual assistant services including administrative support, customer service, social media management, and more.",
};

const serviceCategories = [
  {
    id: "administrative",
    title: "Administrative Support",
    description: "Keep your business organized and running efficiently with professional administrative assistance.",
    features: [
      "Email management and inbox zero",
      "Calendar scheduling and coordination",
      "Document preparation and formatting",
      "Data entry and database management",
      "Travel booking and logistics",
      "File organization and cloud management",
    ],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: "customer",
    title: "Customer Service",
    description: "Deliver exceptional customer experiences across all channels with trained support professionals.",
    features: [
      "Email and ticket support",
      "Live chat management",
      "Phone call handling",
      "Customer complaint resolution",
      "FAQ development and updates",
      "Customer satisfaction surveys",
    ],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: "social",
    title: "Social Media Management",
    description: "Grow your online presence with strategic content creation and community engagement.",
    features: [
      "Content creation and scheduling",
      "Community engagement and moderation",
      "Analytics and performance reporting",
      "Ad campaign management",
      "Influencer outreach and coordination",
      "Brand monitoring and reputation management",
    ],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    id: "data",
    title: "Data & Research",
    description: "Make data-driven decisions with comprehensive research and organized data management.",
    features: [
      "Market and competitor research",
      "Data entry and validation",
      "CRM management and updates",
      "Report generation and analysis",
      "Lead generation and qualification",
      "Industry trend monitoring",
    ],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "bookkeeping",
    title: "Bookkeeping",
    description: "Maintain accurate financial records and gain clear insights into your business finances.",
    features: [
      "Invoice creation and management",
      "Expense tracking and categorization",
      "Bank reconciliation",
      "Financial report preparation",
      "Accounts payable/receivable",
      "Tax preparation support",
    ],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "web",
    title: "Web & Digital Support",
    description: "Keep your digital presence polished and performing at its best.",
    features: [
      "Website content updates",
      "SEO optimization and monitoring",
      "Blog writing and publishing",
      "Email marketing campaigns",
      "Landing page creation",
      "Digital asset management",
    ],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "real-estate",
    title: "Real Estate Virtual Assistant",
    description: "Dedicated support for real estate professionals to manage listings, leads, and client communications.",
    features: [
      "Listing coordination and management",
      "Lead follow-up and qualification",
      "MLS data entry and updates",
      "Transaction coordination",
      "Open house scheduling and promotion",
      "Client communication and nurturing",
    ],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
      </svg>
    ),
  },
  {
    id: "insurance",
    title: "Insurance Processing",
    description: "Streamline your insurance operations with dedicated virtual assistants trained in claims, policies, and compliance workflows.",
    features: [
      "Claims intake and processing",
      "Policy verification and data entry",
      "Customer inquiries and follow-ups",
      "Document review and organization",
      "Compliance and audit support",
      "Renewal tracking and notifications",
    ],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "enterprise",
    title: "Enterprise",
    description: "Scalable virtual assistant solutions for larger organizations with complex operational needs.",
    features: [
      "Dedicated team of virtual assistants",
      "Custom workflow integration",
      "Project management and oversight",
      "SLA-backed service levels",
      "Multi-department support",
      "Executive-level reporting and insights",
    ],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              Our Services
            </h1>
            <p className="text-lg text-gray-60 leading-relaxed">
              Comprehensive virtual assistant services designed to free up your
              time and accelerate growth.
            </p>
          </div>
        </Container>
      </section>

      {/* Services Tile Grid */}
      <section className="py-20 lg:py-28">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceCategories.map((service) => (
              <div
                key={service.id}
                id={service.id}
                className="group bg-white border border-border rounded-2xl p-8 hover:shadow-xl hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-60 text-sm leading-relaxed mb-5">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <section className="py-20 bg-primary">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Need a Custom Solution?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
              We can tailor our services to meet your specific business
              requirements. Let&apos;s discuss what you need.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary font-medium rounded-[var(--radius-md)] hover:bg-gray-10 transition-colors"
            >
              Contact Us Today
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
