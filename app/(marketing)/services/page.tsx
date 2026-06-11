import { getPageSEO } from "@/lib/firebase/seo";
import { serviceJsonLd } from "@/lib/utils/structured-data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { ServicesContent } from "./services-content";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";

export const revalidate = 3600;

const servicesCitationParagraphs = [
  "Virtual assistant services are most effective when each workflow has a documented owner, SLA target, and escalation route.",
  "Service categories such as inbox management, scheduling, customer support, and reporting can be phased in to lower implementation risk.",
  "Bilingual service capability improves consistency for companies operating across English and Spanish customer segments.",
  "Industry and government guidance consistently show that standard operating procedures and role clarity improve execution reliability.",
];

const servicesCitationQuestions = [
  {
    question: "Which service line should businesses implement first?",
    answer:
      "Begin with repetitive, high-volume tasks that consume core team time, then layer in specialized support once basic workflows are stable.",
  },
  {
    question: "How do I measure virtual assistant performance?",
    answer:
      "Track response time, completion rate, quality checks, and customer satisfaction trends by workflow and review these KPIs weekly.",
  },
  {
    question: "Can service bundles be adjusted as needs change?",
    answer:
      "Yes. A phased model lets businesses expand or refine support scope based on seasonal demand and evolving priorities.",
  },
];

const servicesCitationSources = [
  {
    label: "U.S. Small Business Administration: Build your team",
    url: "https://www.sba.gov/business-guide/manage-your-business/hire-manage-employees",
  },
  {
    label: "U.S. Bureau of Labor Statistics: Occupational requirements",
    url: "https://www.bls.gov/ooh/",
  },
  {
    label: "McKinsey: Future of work insights",
    url: "https://www.mckinsey.com/featured-insights/future-of-work",
  },
];

export async function generateMetadata() {
  return getPageSEO("/services", {
    title: "Virtual Assistant Services",
    description: "Explore CreedaVA's full range of bilingual virtual assistant services — admin support, customer service, bookkeeping, social media, and more.",
  });
}

export default async function ServicesPage() {
  const { t } = await getDictionary();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd({
            name: "Bilingual Virtual Assistant Services",
            description: "Full range of bilingual virtual assistant services — admin support, customer service, bookkeeping, social media management, and more.",
          })),
        }}
      />
      <ServicesContent t={t} />
      <AICitationReadiness
        path="/services"
        title="CreedaVA Service Overview"
        description="Detailed guidance on bilingual virtual assistant service lines and workflow implementation."
        paragraphs={servicesCitationParagraphs}
        questions={servicesCitationQuestions}
        sources={servicesCitationSources}
      />
    </>
  );
}
