"use client";

import React, { Suspense, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { AdminTabs, PageHeader } from "@/components/admin";
import type { Tab } from "@/components/admin/tabs";
import { ADMIN_ROUTE_ALIASES } from "@/lib/utils/admin-route-aliases";

// Lazy-load every section so the hub stays light and each tab only pays its own bundle cost.
const OutreachSection = dynamic(() => import("./_components/sections/outreach-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading outreach…" />,
});
const AgentDashboard = dynamic(() => import("./_components/sections/agent-hub-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading agent…" />,
});

type SectionId = "outreach" | "agent";

type SectionConfig = { value: SectionId; label: string; description: string };

// Legacy ?section= values. Anything the agent produces is a sub-tab of `agent`.
const SECTION_ALIASES: Record<string, SectionId> = {
  digest: "agent",
  briefs: "agent",
  tasks: "agent",
  "action-items": "agent",
};

/**
 * Sections that moved to their own top-level page. `?section=keywords` is still
 * bookmarked in places, so it redirects instead of silently opening Outreach.
 */
const MOVED_SECTIONS: Record<string, string> = {
  keywords: ADMIN_ROUTE_ALIASES.seoKeywords,
  gaps: ADMIN_ROUTE_ALIASES.seoOpportunities,
  opportunities: ADMIN_ROUTE_ALIASES.seoOpportunities,
  citations: ADMIN_ROUTE_ALIASES.seoOpportunities,
  rankings: ADMIN_ROUTE_ALIASES.seoRankings,
  pages: ADMIN_ROUTE_ALIASES.seoPages,
};

const DEFAULT_SECTION: SectionId = "agent";

const SECTIONS: SectionConfig[] = [
  { value: "agent", label: "Agent", description: "The autonomous agent: runs, its audits, the briefs and action items it writes, and the weekly digest." },
  { value: "outreach", label: "Outreach", description: "Draft and track backlink/PR outreach emails." },
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

  const rawSection = searchParams?.get("section") ?? DEFAULT_SECTION;
  const moved = MOVED_SECTIONS[rawSection];

  // Redirect rather than fall through to the default tab.
  useEffect(() => {
    if (moved) router.replace(moved);
  }, [moved, router]);

  const section: SectionId = useMemo(() => {
    const aliased = SECTION_ALIASES[rawSection] ?? rawSection;
    return SECTIONS.find((s) => s.value === aliased)?.value ?? DEFAULT_SECTION;
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
        description="Outreach and the autonomous agent. Keywords and page metadata have their own pages."
      />
      <div>
        <AdminTabs tabs={tabs} activeTab={section} onChange={handleChange} />
        {activeSection && (
          <p className="mt-3 text-sm text-gray-50">{activeSection.description}</p>
        )}
      </div>
      <Suspense fallback={<SectionSkeleton label="Loading…" />}>
        {section === "outreach" && <OutreachSection />}
        {section === "agent" && <AgentDashboard />}
      </Suspense>
    </div>
  );
}
