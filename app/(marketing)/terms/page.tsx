import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "CreedaVA's terms of service — the rules and guidelines governing the use of our virtual assistant services.",
};

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-60">
              Last updated: February 14, 2026
            </p>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-20 lg:py-28">
        <Container size="md">
          <div className="prose prose-lg max-w-none space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-60 leading-relaxed">
                By accessing or using CreedaVA&apos;s services, you agree to be
                bound by these Terms of Service. If you do not agree to these
                terms, please do not use our services. We reserve the right to
                modify these terms at any time, and your continued use of our
                services constitutes acceptance of any changes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                2. Services
              </h2>
              <p className="text-gray-60 leading-relaxed">
                CreedaVA provides virtual assistant services including but not
                limited to administrative support, customer service, social
                media management, data entry, bookkeeping, real estate support,
                insurance processing, and enterprise solutions. The specific
                scope of services will be defined in your service agreement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                3. Client Responsibilities
              </h2>
              <p className="text-gray-60 leading-relaxed mb-4">
                As a client, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-60">
                <li>
                  Provide clear instructions and necessary resources for task
                  completion
                </li>
                <li>
                  Respond to communications in a timely manner
                </li>
                <li>
                  Make payments according to the agreed-upon schedule
                </li>
                <li>
                  Not request our VAs to perform illegal or unethical activities
                </li>
                <li>
                  Maintain the confidentiality of any login credentials shared
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                4. Payment Terms
              </h2>
              <p className="text-gray-60 leading-relaxed">
                Payment is due according to the terms specified in your service
                plan. We accept major credit cards and bank transfers. Late
                payments may result in suspension of services. All fees are
                non-refundable unless otherwise stated in your service agreement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                5. Confidentiality
              </h2>
              <p className="text-gray-60 leading-relaxed">
                All virtual assistants sign non-disclosure agreements (NDAs) to
                protect your business information. We treat all client data as
                confidential and will not share it with third parties without
                your explicit consent, except as required by law.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                6. Intellectual Property
              </h2>
              <p className="text-gray-60 leading-relaxed">
                All work product created by our virtual assistants on your
                behalf becomes your intellectual property upon payment. CreedaVA
                retains no rights to work created specifically for clients.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                7. Limitation of Liability
              </h2>
              <p className="text-gray-60 leading-relaxed">
                CreedaVA&apos;s liability is limited to the amount paid for
                services in the preceding 30-day period. We are not liable for
                any indirect, incidental, consequential, or punitive damages
                arising from the use of our services. We will make reasonable
                efforts to ensure quality and accuracy but cannot guarantee
                error-free service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                8. Termination
              </h2>
              <p className="text-gray-60 leading-relaxed">
                Either party may terminate services with 14 days&apos; written
                notice. CreedaVA reserves the right to terminate services
                immediately if the client violates these terms. Upon
                termination, any outstanding balances become immediately due, and
                we will return all client materials and data.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                9. Dispute Resolution
              </h2>
              <p className="text-gray-60 leading-relaxed">
                Any disputes arising from these terms or our services will first
                be addressed through good-faith negotiation. If a resolution
                cannot be reached, the matter will be submitted to binding
                arbitration in accordance with applicable laws.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                10. Contact
              </h2>
              <p className="text-gray-60 leading-relaxed">
                For questions about these Terms of Service, please contact us at{" "}
                <a
                  href="mailto:legal@creedava.com"
                  className="text-primary hover:underline"
                >
                  legal@creedava.com
                </a>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
