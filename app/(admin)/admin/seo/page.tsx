"use client";

import React, { Suspense, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { AdminTabs, PageHeader } from "@/components/admin";
import type { Tab } from "@/components/admin/tabs";
import { ADMIN_ROUTE_ALIASES } from "@/lib/utils/admin-route-aliases";

const AgentDashboard = dynamic(() => import("./_components/sections/agent-hub-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading agent…" />,
});

type SectionId = "agent";

/** Legacy `?section=` values — everything the agent produces lives under `agent`. */
const SECTION_ALIASES: Record<string, SectionId> = {
  digest: "agent",
  briefs: "agent",
  tasks: "agent",
  "action-items": "agent",
};

/** Surfaces that moved to their own top-level page. Redirect, don't silently default. */
const MOVED_SECTIONS: Record<string, string> = {
  keywords: ADMIN_ROUTE_ALIASES.seoKeywords,
  gaps: ADMIN_ROUTE_ALIASES.seoOpportunities,
  opportunities: ADMIN_ROUTE_ALIASES.seoOpportunities,
  citations: ADMIN_ROUTE_ALIASES.seoOpportunities,
  rankings: ADMIN_ROUTE_ALIASES.seoRankings,
  pages: ADMIN_ROUTE_ALIASES.seoPages,
  outreach: ADMIN_ROUTE_ALIASES.seoOutreach,
};

const DEFAULT_SECTION: SectionId = "agent";

const SECTIONS: { value: SectionId; label: string }[] = [{ value: "agent", label: "Runs" }];

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-gray-50">
      {label}
    </div>
  );
}

export default function AgentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawSection = searchParams?.get("section") ?? DEFAULT_SECTION;
  const moved = MOVED_SECTIONS[rawSection];

  useEffect(() => {
    if (moved) router.replace(moved);
  }, [moved, router]);

  const section: SectionId = useMemo(() => {
    const aliased = SECTION_ALIASES[rawSection] ?? rawSection;
    return (SECTIONS as { value: string }[]).some((s) => s.value === aliased)
      ? (aliased as SectionId)
      : DEFAULT_SECTION;
  }, [rawSection]);

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("section", value);
      params.delete("tab");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const tabs: Tab[] = SECTIONS.map((s) => ({ label: s.label, value: s.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent"
        description="The autonomous SEO agent: runs, crawler audits, the briefs and action items it writes, and the weekly digest."
      />
      <AdminTabs tabs={tabs} activeTab={section} onChange={handleChange} />
      <Suspense fallback={<SectionSkeleton label="Loading…" />}>
        {section === "agent" && <AgentDashboard />}
      </Suspense>
    </div>
  );
}
