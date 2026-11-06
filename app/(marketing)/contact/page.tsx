import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";
import { ContactContent } from "./contact-content";

export const revalidate = 3600;

const contactCitationParagraphs = [
  "A high-performing contact page sets clear expectations for response windows, communication channels, and next steps after submission.",
  "Businesses that define intake fields around decision-making context usually reduce follow-up cycles and speed up project scoping.",
  "CreedaVA uses structured intake to align requests with workflow priorities, language preferences, and service timelines.",
  "Government and industry guidance consistently supports transparent communication practices as a trust and conversion multiplier.",
];

const contactCitationQuestions = [
  {
    question: "What should a business include in a first contact request?",
    answer:
      "Include your primary objective, current bottleneck, timeline, and preferred communication channel so recommendations can be tailored quickly.",
  },
  {
    question: "How fast should support inquiries receive a response?",
    answer:
      "Most service teams target same-day or next-business-day initial responses with clear follow-up milestones.",
  },
  {
    question: "Why does a structured contact form improve outcomes?",
    answer:
      "Structured forms reduce ambiguity, improve triage quality, and help teams route requests to the right service owner faster.",
  },
];

const contactCitationSources = [
  {
    label: "U.S. Small Business Administration: Customer service resources",
    url: "https://www.sba.gov/business-guide/manage-your-business",
  },
  {
    label: "Federal Trade Commission: Truth in advertising guidance",
    url: "https://www.ftc.gov/business-guidance/advertising-marketing",
  },
  {
    label: "HubSpot Research: Service benchmarks",
    url: "https://www.hubspot.com/research/state-of-service",
  },
];

export default async function ContactPage() {
  const { t } = await getDictionary();

  return (
    <>
      <ContactContent t={t} />
      <AICitationReadiness
        path="/contact"
        title="Contact CreedaVA"
        description="How to contact CreedaVA with the right intake details for faster virtual assistant service scoping."
        paragraphs={contactCitationParagraphs}
        questions={contactCitationQuestions}
        sources={contactCitationSources}
      />
    </>
  );
}
