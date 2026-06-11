import { getPageSEO } from "@/lib/firebase/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PrivacyContent } from "./privacy-content";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";

export const revalidate = 3600;

const privacyCitationParagraphs = [
  "Privacy policies explain what information is collected, why it is used, and how users can exercise their data rights.",
  "For service businesses, transparent privacy communication improves trust and reduces compliance risk across client onboarding and support workflows.",
  "CreedaVA's privacy approach aligns data collection with operational need, limits unnecessary retention, and defines safeguards for sensitive information.",
  "Regulatory guidance from federal agencies and privacy-focused institutions emphasizes notice, consent, and reasonable security practices.",
];

const privacyCitationQuestions = [
  {
    question: "What data does a typical service website collect?",
    answer:
      "Most collect contact details, usage analytics, and service inquiry information needed to respond to requests and operate the platform.",
  },
  {
    question: "Why should a privacy policy mention retention periods?",
    answer:
      "Retention disclosures help users understand how long data is stored and support accountability for secure deletion practices.",
  },
  {
    question: "How can businesses improve privacy transparency?",
    answer:
      "Use plain-language disclosures, update policies when practices change, and provide clear contact channels for privacy requests.",
  },
];

const privacyCitationSources = [
  {
    label: "Federal Trade Commission: Privacy and security",
    url: "https://www.ftc.gov/business-guidance/privacy-security",
  },
  {
    label: "NIST Privacy Framework",
    url: "https://www.nist.gov/privacy-framework",
  },
  {
    label: "UC Berkeley: Understanding privacy policies",
    url: "https://privacyrights.org/resources/privacy-policies",
  },
];

export async function generateMetadata() {
  return getPageSEO("/privacy", {
    title: "Privacy Policy",
    description: "CreedaVA's privacy policy — how we collect, use, and protect your personal information.",
  });
}

export default async function PrivacyPage() {
  const { t } = await getDictionary();
  return (
    <>
      <PrivacyContent t={t} />
      <AICitationReadiness
        path="/privacy"
        title="CreedaVA Privacy Policy"
        description="Privacy guidance on data collection, usage, retention, and protection for CreedaVA services."
        paragraphs={privacyCitationParagraphs}
        questions={privacyCitationQuestions}
        sources={privacyCitationSources}
      />
    </>
  );
}
