import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "CreedaVA's privacy policy — how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-gray-10 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-6">
              Privacy Policy
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
                1. Information We Collect
              </h2>
              <p className="text-gray-60 leading-relaxed mb-4">
                We collect information you provide directly to us, such as when
                you fill out a contact form, request a consultation, or create
                an account. This may include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-60">
                <li>Name, email address, and phone number</li>
                <li>Company name and job title</li>
                <li>Billing and payment information</li>
                <li>Any other information you choose to provide</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-gray-60 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-60">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>
                  Send promotional communications (you can opt out at any time)
                </li>
                <li>
                  Respond to your comments, questions, and customer service
                  requests
                </li>
                <li>
                  Monitor and analyze trends, usage, and activities in
                  connection with our services
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                3. Information Sharing
              </h2>
              <p className="text-gray-60 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal
                information to third parties without your consent, except as
                necessary to provide our services or as required by law. We may
                share information with trusted service providers who assist us
                in operating our business, provided they agree to keep your
                information confidential.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                4. Data Security
              </h2>
              <p className="text-gray-60 leading-relaxed">
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction. All virtual assistants sign
                non-disclosure agreements (NDAs), and we use encrypted
                communication channels for all client interactions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                5. Cookies and Tracking
              </h2>
              <p className="text-gray-60 leading-relaxed">
                Our website may use cookies and similar tracking technologies to
                enhance your experience, analyze site traffic, and understand
                where our visitors come from. You can control cookie preferences
                through your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                6. Your Rights
              </h2>
              <p className="text-gray-60 leading-relaxed">
                You have the right to access, correct, or delete your personal
                information at any time. You may also opt out of receiving
                marketing communications from us. To exercise any of these
                rights, please contact us at{" "}
                <a
                  href="mailto:privacy@creedava.com"
                  className="text-primary hover:underline"
                >
                  privacy@creedava.com
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                7. Changes to This Policy
              </h2>
              <p className="text-gray-60 leading-relaxed">
                We may update this privacy policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the &quot;Last updated&quot; date. We encourage you
                to review this page periodically for any changes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                8. Contact Us
              </h2>
              <p className="text-gray-60 leading-relaxed">
                If you have questions or concerns about this privacy policy,
                please contact us at{" "}
                <a
                  href="mailto:privacy@creedava.com"
                  className="text-primary hover:underline"
                >
                  privacy@creedava.com
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
