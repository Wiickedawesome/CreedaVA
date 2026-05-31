"use client";

import React, { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { AdminTabs, PageHeader } from "@/components/admin";
import type { Tab } from "@/components/admin/tabs";

// Lazy-load every section so the hub stays light and each tab only pays its own bundle cost.
const PagesSection = dynamic(() => import("./_components/sections/pages-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading pages…" />,
});
const KeywordsSection = dynamic(() => import("./_components/sections/keywords-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading keywords…" />,
});
const OpportunitiesSection = dynamic(() => import("./_components/sections/opportunities-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading opportunities…" />,
});
const BriefsSection = dynamic(() => import("./_components/sections/briefs-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading briefs…" />,
});
const OutreachSection = dynamic(() => import("./_components/sections/outreach-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading outreach…" />,
});
const CitationsSection = dynamic(() => import("./_components/sections/citations-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading citations…" />,
});
const WeeklyDigestSection = dynamic(() => import("./_components/sections/weekly-digest-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading digest…" />,
});
const AgentDashboard = dynamic(
  () => import("./_components/agent-dashboard").then((m) => m.SeoAgentDashboard),
  { ssr: false, loading: () => <SectionSkeleton label="Loading agent…" /> },
);
const TasksBoard = dynamic(
  () => import("./_components/tasks-board").then((m) => m.SeoTasksBoard),
  { ssr: false, loading: () => <SectionSkeleton label="Loading tasks…" /> },
);

type SectionId = "pages" | "keywords" | "opportunities" | "briefs" | "outreach" | "citations" | "digest" | "agent" | "tasks";

const SECTIONS: { value: SectionId; label: string; description: string }[] = [
  { value: "pages", label: "Pages & Audits", description: "Manage on-page SEO metadata and run AI audits for each public page." },
  { value: "keywords", label: "Keywords", description: "Track target keywords, pull Search Console rankings, and get AI keyword ideas." },
  { value: "opportunities", label: "Opportunities", description: "Content gaps, backlink prospects, and unlinked brand mentions found by the agent." },
  { value: "briefs", label: "Briefs", description: "AI-generated content briefs ready to hand off to writers." },
  { value: "outreach", label: "Outreach", description: "Draft and track backlink/PR outreach emails." },
  { value: "citations", label: "Citations", description: "Monitor AIO/GEO citations — where AI engines mention CreedaVA." },
  { value: "digest", label: "Weekly Digest", description: "The agent's weekly synthesized SEO summary and email." },
  { value: "agent", label: "Agent", description: "Run the autonomous SEO agent on demand and review its run history." },
  { value: "tasks", label: "Tasks", description: "SEO action items generated from agent findings." },
];

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-gray-50">
      {label}
    </div>
  );
}

export default function SeoHubPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawSection = (searchParams?.get("section") ?? "pages") as SectionId;
  const section: SectionId = useMemo(() => {
    return SECTIONS.find((s) => s.value === rawSection)?.value ?? "pages";
  }, [rawSection]);

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("section", value);
      // Drop the inner ?tab= when switching sections so each section starts on its own default.
      params.delete("tab");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const tabs: Tab[] = SECTIONS.map((s) => ({ label: s.label, value: s.value }));
  const activeSection = SECTIONS.find((s) => s.value === section);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Hub"
        description="Your operational SEO workspace — pages, keywords, the autonomous agent, and outreach. For business-wide AI reports, use the AI Dashboard."
      />
      <div>
        <AdminTabs tabs={tabs} activeTab={section} onChange={handleChange} />
        {activeSection && (
          <p className="mt-3 text-sm text-gray-50">{activeSection.description}</p>
        )}
      </div>
      <Suspense fallback={<SectionSkeleton label="Loading…" />}>
        {section === "pages" && <PagesSection />}
        {section === "keywords" && <KeywordsSection />}
        {section === "opportunities" && <OpportunitiesSection />}
        {section === "briefs" && <BriefsSection />}
        {section === "outreach" && <OutreachSection />}
        {section === "citations" && <CitationsSection />}
        {section === "digest" && <WeeklyDigestSection />}
        {section === "agent" && <AgentDashboard />}
        {section === "tasks" && <TasksBoard />}
      </Suspense>
    </div>
  );
}
