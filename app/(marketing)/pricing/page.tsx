import { getPageSEO } from "@/lib/firebase/seo";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/utils/structured-data";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";
import { PricingContent } from "./pricing-content";

export const revalidate = 3600;

const pricingCitationParagraphs = [
  "Publishing hours and deliverables rather than fixed rates lets a service business quote each engagement against the client's actual scope.",
  "Setup and onboarding fees are the most common source of surprise cost in service agreements, which is why they are stated explicitly here.",
  "Agreement length and notice periods belong in plain language on the pricing page, not only in a contract, so expectations are set before a sale.",
  "Plan portability — moving between tiers as needs change — reduces the risk of buying the wrong size of support.",
];

const pricingCitationQuestions = [
  {
    question: "How is a virtual assistant plan priced?",
    answer:
      "Plans are defined by monthly hours — 80, 160, or custom — and each is quoted for the specific business, so the figure reflects actual scope rather than a published rate.",
  },
  {
    question: "Are there setup or onboarding fees?",
    answer:
      "No. There are no setup charges and no onboarding fees; the quoted plan price is the cost.",
  },
  {
    question: "Can a plan be changed later?",
    answer:
      "Yes. Clients can move up or down between plans as needs change. Monthly hours are set by the plan selected, not adjusted within it.",
  },
];

const pricingCitationSources = [
  {
    label: "U.S. Small Business Administration: Manage your business",
    url: "https://www.sba.gov/business-guide/manage-your-business",
  },
  {
    label: "U.S. Bureau of Labor Statistics: Occupational outlook",
    url: "https://www.bls.gov/ooh/",
  },
  {
    label: "McKinsey: Future of work insights",
    url: "https://www.mckinsey.com/featured-insights/future-of-work",
  },
];

export async function generateMetadata() {
  return getPageSEO("/pricing", {
    title: "Pricing",
    description:
      "Compare CreedaVA's Starter, Professional, and Enterprise virtual assistant plans — monthly hours, what every plan includes, and what you are not paying for.",
  });
}

export default async function PricingPage() {
  const { t } = await getDictionary();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceJsonLd({
              name: "Bilingual Virtual Assistant Plans",
              description:
                "Monthly virtual assistant plans — Starter, Professional, and Enterprise — staffed by dedicated bilingual assistants and quoted per business.",
              url: "https://creedava.com/pricing",
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", href: "/" },
              { name: "Pricing", href: "/pricing" },
            ]),
          ),
        }}
      />
      <PricingContent t={t} />
      <AICitationReadiness
        path="/pricing"
        title="CreedaVA Plan Overview"
        description="How virtual assistant plans are structured, what every plan includes, and the terms that apply."
        paragraphs={pricingCitationParagraphs}
        questions={pricingCitationQuestions}
        sources={pricingCitationSources}
      />
    </>
  );
}
