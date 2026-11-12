"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useCollection } from "@/hooks/useCollection";
import { useScheduledReports } from "@/hooks/useScheduledReports";
import { DashboardSection, PageHeader, StatusBadge } from "@/components/admin";
import type {
  AIReport,
  BlogPost,
  Campaign,
  EmailDraft,
  ForumThread,
  LandingPage,
  SEOAudit,
  SEOKeyword,
} from "@/lib/types/content";
import type { Booking, Contact, Customer, Lead } from "@/lib/types/crm";
import type { AllCollections } from "@/lib/utils/ai-data-context";

function formatDate(d: unknown): string {
  if (!d) return "—";
  const date =
    typeof d === "object" && d !== null && "toDate" in d
      ? (d as { toDate: () => Date }).toDate()
      : new Date(d as string);
  return date.toLocaleString();
}

export default function WeeklyDigestSection() {
  const { data: reports, loading } = useCollection<AIReport>("reports", {
    orderByField: "createdAt",
    orderDirection: "desc",
  });

  // ─── Keep this digest fresh ─────────────────────────
  // The weekly scheduled report is generated on the client (the hook debounces
  // via localStorage and only touches the weekly period). This tab is its only
  // reader, so the trigger lives here beside the output it produces. Previously
  // it ran from the SEO Hub's Creeda AI tab, which has since been retired in
  // favour of the admin dashboard entry point.
  const { data: leads } = useCollection<Lead>("leads");
  const { data: customers } = useCollection<Customer>("customers");
  const { data: contacts } = useCollection<Contact>("contacts");
  const { data: bookings } = useCollection<Booking>("bookings");
  const { data: campaigns } = useCollection<Campaign>("campaigns");
  const { data: emails } = useCollection<EmailDraft>("emails");
  const { data: blog } = useCollection<BlogPost>("blog");
  const { data: keywords } = useCollection<SEOKeyword>("keywords");
  const { data: seoAudits } = useCollection<SEOAudit>("seo");
  const { data: landingPages } = useCollection<LandingPage>("landing-pages");
  const { data: forumThreads } = useCollection<ForumThread>("forum");

  const allData: AllCollections = useMemo(
    () => ({
      leads,
      customers,
      contacts,
      bookings,
      campaigns,
      emails,
      blog,
      keywords,
      seoAudits,
      landingPages,
      forumThreads,
    }),
    [
      leads,
      customers,
      contacts,
      bookings,
      campaigns,
      emails,
      blog,
      keywords,
      seoAudits,
      landingPages,
      forumThreads,
    ],
  );

  const { autoGenerate } = useScheduledReports();
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (autoRanRef.current) return;
    if (leads.length + customers.length + bookings.length === 0) return;
    autoRanRef.current = true;
    autoGenerate(allData).catch((err) =>
      console.warn("[weekly-digest] autoGenerate failed:", err),
    );
  }, [leads.length, customers.length, bookings.length, allData, autoGenerate]);

  // Show only true weekly reports: explicit type="weekly" OR scheduled-weekly category.
  const weekly = reports
    .filter((r) => r.type === "weekly" || (r.category === "scheduled" && /week/i.test(r.title)))
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <PageHeader
        as="h2"
        title="Weekly Digest"
        description="Latest weekly synthesizer + scheduled reports. Each captures findings the SEO agent collected during the prior 7 days."
      />

      <DashboardSection title={`Latest ${weekly.length} reports`}>
        {loading ? (
          <p className="text-sm text-gray-60">Loading…</p>
        ) : weekly.length === 0 ? (
          <p className="text-sm text-gray-60">
            No weekly reports yet. The synthesizer runs Sundays; a stale report is
            regenerated automatically the first time this tab opens each week.
          </p>
        ) : (
          <div className="space-y-3">
            {weekly.map((r) => (
              <div key={r.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate">{r.title}</h3>
                    <div className="text-xs text-gray-50">
                      {formatDate(r.createdAt)} • {r.type}
                      {r.area && ` • ${r.area}`}
                    </div>
                  </div>
                  {typeof r.score === "number" && (
                    <StatusBadge
                      status={`${r.score}/100`}
                      variant={r.score >= 80 ? "success" : r.score >= 60 ? "warning" : "error"}
                    />
                  )}
                </div>

                {r.highlights && r.highlights.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-70 mb-1">
                      Highlights
                    </div>
                    <ul className="text-sm text-gray-70 list-disc pl-5 space-y-0.5">
                      {r.highlights.slice(0, 5).map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {r.recommendations && r.recommendations.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-70 mb-1">
                      Recommendations
                    </div>
                    <ul className="text-sm text-gray-70 list-disc pl-5 space-y-0.5">
                      {r.recommendations.slice(0, 5).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
