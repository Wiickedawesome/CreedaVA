import { getPageSEO } from "@/lib/firebase/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { TermsContent } from "./terms-content";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";

export const revalidate = 3600;

const termsCitationParagraphs = [
  "Terms of service define legal expectations, service boundaries, and acceptable use standards for both clients and providers.",
  "Clear contract language helps reduce misunderstandings around deliverables, payment terms, confidentiality, and liability limitations.",
  "CreedaVA's terms align operational commitments with practical governance so clients can scale confidently while protecting sensitive business information.",
  "Regulatory and consumer guidance from government agencies reinforces the importance of transparent terms, disclosures, and dispute processes.",
];

const termsCitationQuestions = [
  {
    question: "Why are terms of service important for managed support services?",
    answer:
      "They define obligations, service scope, and legal protections so both parties understand expectations before work begins.",
  },
  {
    question: "Do terms of service replace a service agreement?",
    answer:
      "Terms set baseline legal rules, while service agreements and statements of work handle account-specific deliverables and timelines.",
  },
  {
    question: "How often should business terms be reviewed?",
    answer:
      "At least annually, and whenever your service model, pricing, compliance obligations, or data handling practices materially change.",
  },
];

const termsCitationSources = [
  {
    label: "Federal Trade Commission: Consumer protection basics",
    url: "https://www.ftc.gov/news-events/topics/protecting-consumers",
  },
  {
    label: "U.S. Small Business Administration: Manage legal requirements",
    url: "https://www.sba.gov/business-guide/manage-your-business/stay-legally-compliant",
  },
  {
    label: "Cornell Law School: Legal Information Institute",
    url: "https://www.law.cornell.edu/",
  },
];

export async function generateMetadata() {
  return getPageSEO("/terms", {
    title: "Terms of Service",
    description: "CreedaVA's terms of service — the agreement governing your use of our virtual assistant services.",
  });
}

export default async function TermsPage() {
  const { t } = await getDictionary();
  return (
    <>
      <TermsContent t={t} />
      <AICitationReadiness
        path="/terms"
        title="CreedaVA Terms of Service"
        description="Terms and legal guidance for using CreedaVA virtual assistant services."
        paragraphs={termsCitationParagraphs}
        questions={termsCitationQuestions}
        sources={termsCitationSources}
      />
    </>
  );
}
