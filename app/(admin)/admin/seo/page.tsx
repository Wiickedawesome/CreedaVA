"use client";

import React, { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { AdminTabs, PageHeader } from "@/components/admin";
import type { Tab } from "@/components/admin/tabs";

// Lazy-load every section so the hub stays light and each tab only pays its own bundle cost.
const AiSection = dynamic(() => import("./_components/sections/ai-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading Creeda AI…" />,
});
const PagesSection = dynamic(() => import("./_components/sections/pages-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading pages…" />,
});
const KeywordsSection = dynamic(() => import("./_components/sections/keywords-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading keywords…" />,
});
const OpportunitiesSection = dynamic(() => import("./_components/sections/opportunities-hub-section"), {
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
const AgentDashboard = dynamic(() => import("./_components/sections/agent-hub-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading agent…" />,
});
const ActionItemsBoard = dynamic(
  () => import("./_components/tasks-board").then((m) => m.SeoTasksBoard),
  { ssr: false, loading: () => <SectionSkeleton label="Loading action items…" /> },
);

type SectionId = "ai" | "pages" | "keywords" | "opportunities" | "briefs" | "outreach" | "agent" | "action-items";

// Legacy ?section= values that now live inside a merged tab.
const SECTION_ALIASES: Record<string, SectionId> = {
  citations: "opportunities",
  digest: "agent",
  tasks: "action-items",
};

const SECTIONS: { value: SectionId; label: string; description: string }[] = [
  { value: "ai", label: "Creeda AI", description: "Chat with Creeda AI about your whole business and watch your live health pulse." },
  { value: "pages", label: "Pages & Audits", description: "Manage on-page SEO metadata and run AI audits for each public page." },
  { value: "keywords", label: "Keywords", description: "Track target keywords, pull Search Console rankings, and get AI keyword ideas." },
  { value: "opportunities", label: "Opportunities", description: "Content gaps, backlink prospects, brand mentions, and AIO/GEO citations found by the agent." },
  { value: "briefs", label: "Briefs", description: "AI-generated content briefs ready to hand off to writers." },
  { value: "outreach", label: "Outreach", description: "Draft and track backlink/PR outreach emails." },
  { value: "agent", label: "Agent", description: "Run the autonomous SEO agent, review its run history, and read the weekly digest." },
  { value: "action-items", label: "Action items", description: "SEO actions the agent has queued from its findings." },
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

  const rawSection = searchParams?.get("section") ?? "ai";
  const section: SectionId = useMemo(() => {
    const aliased = SECTION_ALIASES[rawSection] ?? rawSection;
    return SECTIONS.find((s) => s.value === aliased)?.value ?? "ai";
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
        description="Your operational SEO workspace — Creeda AI, pages, keywords, the autonomous agent, and outreach."
      />
      <div>
        <AdminTabs tabs={tabs} activeTab={section} onChange={handleChange} />
        {activeSection && (
          <p className="mt-3 text-sm text-gray-50">{activeSection.description}</p>
        )}
      </div>
      <Suspense fallback={<SectionSkeleton label="Loading…" />}>
        {section === "ai" && <AiSection />}
        {section === "pages" && <PagesSection />}
        {section === "keywords" && <KeywordsSection />}
        {section === "opportunities" && <OpportunitiesSection />}
        {section === "briefs" && <BriefsSection />}
        {section === "outreach" && <OutreachSection />}
        {section === "agent" && <AgentDashboard />}
        {section === "action-items" && <ActionItemsBoard />}
      </Suspense>
    </div>
  );
}
