"use client";

import React, { Suspense, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/admin";
import { ADMIN_ROUTE_ALIASES } from "@/lib/utils/admin-route-aliases";

const AgentDashboard = dynamic(() => import("./_components/sections/agent-hub-section"), {
  ssr: false,
  loading: () => <SectionSkeleton label="Loading agent…" />,
});

/**
 * Surfaces that moved to their own top-level page. Redirect, don't silently
 * default to the run history — a stale bookmark should land where the thing
 * actually lives now.
 */
const MOVED_SECTIONS: Record<string, string> = {
  keywords: ADMIN_ROUTE_ALIASES.seoKeywords,
  gaps: ADMIN_ROUTE_ALIASES.seoOpportunities,
  opportunities: ADMIN_ROUTE_ALIASES.seoOpportunities,
  citations: ADMIN_ROUTE_ALIASES.seoOpportunities,
  rankings: ADMIN_ROUTE_ALIASES.seoRankings,
  pages: ADMIN_ROUTE_ALIASES.seoPages,
  outreach: ADMIN_ROUTE_ALIASES.seoOutreach,
};

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-gray-50">
      {label}
    </div>
  );
}

/**
 * Runs, briefs and the weekly digest.
 *
 * There is no section switcher: `agent` was its only entry, so the strip was a
 * permanent single tab wedged between the page title and the real tabs. The
 * retired `?section=` values are still handled — old links land in the right
 * place instead of silently showing run history.
 */
export default function AgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const section = searchParams?.get("section") ?? "";
  const moved = useMemo(() => MOVED_SECTIONS[section], [section]);

  useEffect(() => {
    if (!section) return;
    if (moved) {
      router.replace(moved);
      return;
    }
    // A live-but-obsolete parameter: drop it so the address bar matches the page.
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("section");
    const query = params.toString();
    router.replace(`/admin/seo${query ? `?${query}` : ""}`, { scroll: false });
  }, [section, moved, router, searchParams]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent"
        description="Eight skills run on a weekly rotation. Runs is what fired, Briefs is what it drafted, Digest is the summary."
      />
      <Suspense fallback={<SectionSkeleton label="Loading…" />}>
        <AgentDashboard />
      </Suspense>
    </div>
  );
}
