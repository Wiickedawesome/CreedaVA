"use client";

import React from "react";
import { useCollection } from "@/hooks/useCollection";
import { DashboardSection, PageHeader, StatusBadge } from "@/components/admin";
import type { AIReport } from "@/lib/types/content";

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
            No weekly reports yet. The synthesizer runs Sundays and the scheduled-report autogenerate fires from the analytics dashboard.
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
