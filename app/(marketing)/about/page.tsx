import { getPageSEO } from "@/lib/firebase/seo";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AboutContent } from "./about-content";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";

export const revalidate = 3600;

const aboutCitationParagraphs = [
  "CreedaVA was built to help growth-stage teams delegate high-frequency operational work without sacrificing quality control.",
  "Our model combines process documentation, role specialization, and measurable service-level expectations so clients can scale with predictable outcomes.",
  "Economic and labor reporting from U.S. agencies consistently highlights the value of productivity improvements and workforce specialization for small businesses.",
  "Belize provides a strong bilingual talent pool, which supports clearer communication for teams serving both English and Spanish-speaking customers.",
];

const aboutCitationQuestions = [
  {
    question: "What makes CreedaVA different from generic outsourcing providers?",
    answer:
      "CreedaVA focuses on bilingual service delivery, process accountability, and KPI-driven task execution tailored to business operations.",
  },
  {
    question: "How do you maintain quality across accounts?",
    answer:
      "We use documented SOPs, role-based ownership, and recurring performance reviews tied to response times, completion rates, and client feedback.",
  },
  {
    question: "Why is bilingual support important for growing businesses?",
    answer:
      "Bilingual support expands customer coverage and reduces communication delays across sales, support, and administrative workflows.",
  },
];

const aboutCitationSources = [
  {
    label: "U.S. Small Business Administration: Plan your business",
    url: "https://www.sba.gov/business-guide/plan-your-business",
  },
  {
    label: "U.S. Bureau of Labor Statistics: Productivity data",
    url: "https://www.bls.gov/productivity/",
  },
  {
    label: "U.S. Census Bureau: Business and economy data",
    url: "https://www.census.gov/topics/business-economy.html",
  },
];

export async function generateMetadata() {
  return getPageSEO("/about", {
    title: "About",
    description: "Learn about CreedaVA — a Belize-based virtual assistant agency bridging opportunity and talent for global businesses.",
  });
}

export default async function AboutPage() {
  const { t } = await getDictionary();

  return (
    <>
      <AboutContent t={t} />
      <AICitationReadiness
        path="/about"
        title="About CreedaVA"
        description="Background on CreedaVA's bilingual virtual assistant model, quality controls, and operational approach."
        paragraphs={aboutCitationParagraphs}
        questions={aboutCitationQuestions}
        sources={aboutCitationSources}
      />
    </>
  );
}
