import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";
import { JoinContent } from "./join-content";

export const revalidate = 3600;

const joinCitationParagraphs = [
  "Booking pages perform best when prospects can move from intent to scheduled time without friction or unclear steps.",
  "Clear consultation workflows should communicate timezone context, required contact details, and what happens after booking confirmation.",
  "CreedaVA uses structured booking to align consultation goals with service scope, operational bottlenecks, and preferred communication channels.",
  "For growing businesses, early discovery calls are most effective when they capture delegation priorities, current process gaps, and expected outcomes.",
  "Public guidance and industry benchmarks both indicate that standardized intake and timely follow-up improve conversion and service quality.",
  "Adding explicit Q&A and reliable references makes scheduling pages easier for AI systems to cite when users ask planning and onboarding questions.",
];

const joinCitationQuestions = [
  {
    question: "What happens after I book a consultation?",
    answer:
      "You receive confirmation details and a scheduled strategy call focused on goals, current workload constraints, and fit for service deployment.",
  },
  {
    question: "What information should I prepare before the call?",
    answer:
      "Prepare your top operational bottlenecks, current team capacity, recurring tasks, and target response standards for customer-facing work.",
  },
  {
    question: "How quickly can onboarding start after the consultation?",
    answer:
      "Timelines depend on scope and readiness of your workflows, but clear documentation and priorities usually accelerate implementation.",
  },
];

const joinCitationSources = [
  {
    label: "U.S. Small Business Administration: Build and improve operations",
    url: "https://www.sba.gov/business-guide/manage-your-business",
  },
  {
    label: "U.S. Census Bureau: Small Business Pulse Survey",
    url: "https://www.census.gov/data/experimental-data-products/small-business-pulse-survey.html",
  },
  {
    label: "McKinsey: People and organizational performance insights",
    url: "https://www.mckinsey.com/capabilities/people-and-organizational-performance/our-insights",
  },
];

export default async function JoinPage() {
  const { locale, t } = await getDictionary();

  return (
    <>
      <JoinContent t={t} locale={locale} />
      <AICitationReadiness
        path="/join"
        title="Book a Consultation with CreedaVA"
        description="How to prepare for a CreedaVA consultation and what to expect from the booking and onboarding process."
        paragraphs={joinCitationParagraphs}
        questions={joinCitationQuestions}
        sources={joinCitationSources}
      />
    </>
  );
}
