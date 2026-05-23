"use client";

import React from "react";
import { useCollection } from "@/hooks/useCollection";
import { PageHeader, DashboardSection, StatusBadge } from "@/components/admin";

interface ContentBrief {
  id: string;
  keyword: string;
  status: "draft" | "in-progress" | "published" | "archived";
  priority?: number;
  currentPosition?: number;
  impressions?: number;
  rankingPage?: string;
  recommendedOutline?: string[];
  generatedAt?: string;
}

export default function BriefsPage() {
  const { data: briefs, loading } = useCollection<ContentBrief>("content-briefs", {
    orderByField: "priority",
    orderDirection: "desc",
  });

  return (
    <div>
      <PageHeader
        title="Content Briefs"
        description="Auto-generated weekly from striking-distance keywords (positions 11–30). Convert to a draft when ready."
      />
      <DashboardSection title="All briefs">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : briefs.length === 0 ? (
          <p className="text-sm text-gray-500">No briefs yet. The synthesizer generates these every Sunday.</p>
        ) : (
          <div className="space-y-3">
            {briefs.map((b) => (
              <div key={b.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{b.keyword}</h3>
                    <div className="text-xs text-gray-50">
                      pos {b.currentPosition?.toFixed(1) ?? "—"} • {b.impressions ?? 0} impressions • priority {b.priority ?? 0}
                    </div>
                  </div>
                  <StatusBadge
                    status={b.status}
                    variant={b.status === "published" ? "success" : b.status === "in-progress" ? "info" : "default"}
                  />
                </div>
                {b.rankingPage && (
                  <div className="text-xs text-gray-50 mb-2">
                    Existing page: <code>{b.rankingPage}</code>
                  </div>
                )}
                {b.recommendedOutline && b.recommendedOutline.length > 0 && (
                  <ol className="text-sm text-gray-70 list-decimal pl-5 space-y-0.5">
                    {b.recommendedOutline.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
