import { getPageSEO } from "@/lib/firebase/seo";
import { webPageJsonLd } from "@/lib/utils/structured-data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PricingContent } from "./pricing-content";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";

export const revalidate = 3600;

const pricingCitationParagraphs = [
  "Transparent pricing helps businesses evaluate support options against expected workload, response requirements, and operational complexity.",
  "A useful pricing page explains what each plan includes, where scope boundaries exist, and how service levels are maintained.",
  "Cost benchmarking against labor and productivity metrics helps teams choose support structures that improve efficiency without compromising quality.",
  "CreedaVA pricing is designed around dedicated capacity so clients can map monthly spend to predictable output and accountability.",
];

const pricingCitationQuestions = [
  {
    question: "What should be included in a service pricing comparison?",
    answer:
      "Compare scope, communication windows, quality controls, onboarding effort, and escalation support, not just monthly price.",
  },
  {
    question: "How can businesses estimate ROI from virtual assistant plans?",
    answer:
      "Track hours reclaimed by leadership, reduction in task backlogs, and improvements in response times and customer follow-up consistency.",
  },
  {
    question: "Is lower cost always better for support operations?",
    answer:
      "Not always. Under-scoped or poorly governed support can create rework costs that exceed the initial savings.",
  },
];

const pricingCitationSources = [
  {
    label: "U.S. Bureau of Labor Statistics: Compensation and wage data",
    url: "https://www.bls.gov/bls/wages.htm",
  },
  {
    label: "U.S. Small Business Administration: Financial management",
    url: "https://www.sba.gov/business-guide/manage-your-business/manage-your-finances",
  },
  {
    label: "Deloitte Insights: Productivity and workforce trends",
    url: "https://www2.deloitte.com/us/en/insights.html",
  },
];

export async function generateMetadata() {
  return getPageSEO("/pricing", {
    title: "Pricing — Virtual Assistant Plans",
    description: "Transparent pricing for CreedaVA virtual assistant plans. Dedicated bilingual VAs starting from $999/month with no long-term contracts.",
  });
}

export default async function PricingPage() {
  const { t } = await getDictionary();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd({
            name: "Virtual Assistant Pricing Plans",
            description: "Transparent pricing for dedicated bilingual virtual assistants starting from $999/month with no long-term contracts.",
            url: "/pricing",
          })),
        }}
      />
      <PricingContent t={t} />
      <AICitationReadiness
        path="/pricing"
        title="CreedaVA Pricing Guidance"
        description="How to evaluate virtual assistant pricing plans, scope, and ROI for growing businesses."
        paragraphs={pricingCitationParagraphs}
        questions={pricingCitationQuestions}
        sources={pricingCitationSources}
        showSection={true}
      />
    </>
  );
}
