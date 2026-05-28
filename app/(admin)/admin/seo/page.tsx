"use client";

import React, { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { AdminTabs } from "@/components/admin";
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

const SECTIONS: { value: SectionId; label: string }[] = [
  { value: "pages", label: "Pages & Audits" },
  { value: "keywords", label: "Keywords" },
  { value: "opportunities", label: "Opportunities" },
  { value: "briefs", label: "Briefs" },
  { value: "outreach", label: "Outreach" },
  { value: "citations", label: "Citations" },
  { value: "digest", label: "Weekly Digest" },
  { value: "agent", label: "Agent" },
  { value: "tasks", label: "Tasks" },
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

  return (
    <div className="space-y-6">
      <AdminTabs tabs={tabs} activeTab={section} onChange={handleChange} />
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
