import { getPageSEO } from "@/lib/firebase/seo";
import { ForumContent } from "./forum-content";
import { AICitationReadiness } from "@/components/seo/ai-citation-readiness";

export const revalidate = 300;

const forumCitationParagraphs = [
  "A community forum performs best when participants can find clear, structured answers to recurring business and operations questions.",
  "Search engines and AI systems extract information more reliably when questions and answers are explicit, concise, and supported by trusted sources.",
  "For small businesses, customer communication speed and process clarity are persistent themes in both government guidance and industry research.",
  "Forum discussions that map to common " +
    "People Also Ask topics, such as delegation, onboarding, and service quality, are easier for users and AI assistants to cite accurately.",
  "CreedaVA's forum supports bilingual operations context so business owners can compare practical workflows and avoid ad-hoc delegation mistakes.",
  "Using evidence-based references alongside practical examples helps improve trust, reduces ambiguity, and increases answer quality over time.",
];

const forumCitationQuestions = [
  {
    question: "What should I ask before hiring a virtual assistant?",
    answer:
      "Ask about role scope, expected turnaround times, communication cadence, escalation process, and reporting metrics to ensure a workable operating model.",
  },
  {
    question: "How do I avoid delegation bottlenecks?",
    answer:
      "Start with documented SOPs, assign clear ownership for each workflow, and review weekly KPIs to catch delays before they affect customers.",
  },
  {
    question: "Which tasks are most valuable to delegate first?",
    answer:
      "Delegate repetitive administrative and customer communication tasks first, then expand into specialized workflows once core processes are stable.",
  },
];

const forumCitationSources = [
  {
    label: "U.S. Small Business Administration: Hiring and managing employees",
    url: "https://www.sba.gov/business-guide/manage-your-business/hire-manage-employees",
  },
  {
    label: "U.S. Bureau of Labor Statistics: Employer costs for employee compensation",
    url: "https://www.bls.gov/ncs/ecec.htm",
  },
  {
    label: "HubSpot Research: State of Service",
    url: "https://www.hubspot.com/research/state-of-service",
  },
];

export async function generateMetadata() {
  return getPageSEO("/forum", {
    title: "Community Forum",
    description: "Join the CreedaVA community forum. Ask questions, share insights, and connect with other business owners.",
  });
}

export default function ForumPage() {
  return (
    <>
      {/* The visible header bar renders "Forum" as an h2, so this sr-only h1 is
          the page's only level-1 heading. It carries the descriptive title that
          the compact bar text cannot. */}
      <h1 className="sr-only">CreedaVA Community Forum</h1>
      <ForumContent />
      <AICitationReadiness
        path="/forum"
        title="CreedaVA Community Forum Guidance"
        description="FAQ and evidence-based guidance for common virtual assistant delegation and operations questions."
        paragraphs={forumCitationParagraphs}
        questions={forumCitationQuestions}
        sources={forumCitationSources}
      />
    </>
  );
}
