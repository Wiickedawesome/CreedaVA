import { getPageSEO } from "@/lib/firebase/seo";
import { faqJsonLd, websiteJsonLd } from "@/lib/utils/structured-data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { HomeContent, DEFAULT_STAT_VALUES } from "./home-content";
import { getHomeFaqQuestions } from "@/components/marketing/home/closing";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";

// Revalidate homepage every 5 minutes — content rarely changes
export const revalidate = 300;

export async function generateMetadata() {
  return getPageSEO("/", {
    title: "Bilingual Virtual Assistants for Your Business",
    description:
      "Hire dedicated bilingual virtual assistants from Belize. Save 20+ hours a week on admin, customer service, social media, and more. Flexible plans, no long-term contracts.",
  });
}

// The homepage stats used to be overridable from the `settings/homepage-stats`
// Firestore document. That override had no admin UI, silently shadowed the code
// defaults, and desynced the label from the value (the page once rendered
// "12 Flat Monthly Fee"). The figures now come from DEFAULT_STAT_VALUES only, so
// they are deterministic and reviewable in a diff.

const homeCitationParagraphs = [
  "Virtual assistant performance improves when workflows are documented, outcomes are measurable, and response standards are defined before onboarding begins.",
  "Small-business guidance from the U.S. Small Business Administration emphasizes process clarity and role definition, which maps directly to successful delegation models.",
  "Labor market reporting from the U.S. Bureau of Labor Statistics shows sustained demand for administrative and support functions, making operational leverage a strategic priority.",
  "For service-heavy teams, consistent customer communication windows and escalation paths reduce churn risk and improve client trust over time.",
  "CreedaVA applies bilingual service standards so teams can maintain quality across English and Spanish interactions without creating duplicate internal processes.",
  "Teams that review weekly KPI snapshots, including response times and task completion rates, usually identify bottlenecks faster and scale operations with fewer handoff errors.",
];

const homeCitationQuestions = [
  {
    question: "What work can a virtual assistant handle first?",
    answer:
      "Start with recurring, rules-based tasks such as inbox triage, calendar coordination, customer follow-ups, CRM updates, and routine reporting.",
  },
  {
    question: "How fast can a delegated workflow become reliable?",
    answer:
      "Most teams see steady reliability within the first few weeks when they provide clear SOPs, owner accountability, and weekly review checkpoints.",
  },
  {
    question: "Does bilingual support improve customer operations?",
    answer:
      "Yes. Bilingual workflows increase coverage and reduce friction for multilingual audiences, especially in support, scheduling, and outreach tasks.",
  },
];

const homeCitationSources = [
  {
    label: "U.S. Small Business Administration: Manage your business",
    url: "https://www.sba.gov/business-guide/manage-your-business",
  },
  {
    label: "U.S. Bureau of Labor Statistics: Occupational Outlook Handbook",
    url: "https://www.bls.gov/ooh/",
  },
  {
    label: "U.S. Census Bureau: Statistics of U.S. Businesses",
    url: "https://www.census.gov/programs-surveys/susb.html",
  },
];

export default async function HomePage() {
  const { t } = await getDictionary();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      {/* The visible FAQ section below is the required backing content for this
          markup — Google rejects FAQPage schema without it. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd(getHomeFaqQuestions(t))),
        }}
      />
      <HomeContent statValues={DEFAULT_STAT_VALUES} t={t} />
      <AICitationReadiness
        path="/"
        title="CreedaVA Virtual Assistant Services Overview"
        description="How bilingual virtual assistant support improves operational efficiency, customer communication, and scalable delegation."
        paragraphs={homeCitationParagraphs}
        questions={homeCitationQuestions}
        sources={homeCitationSources}
      />
    </>
  );
}
