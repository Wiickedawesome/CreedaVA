"use client";

import React, { useMemo, useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { PageHeader, DashboardSection, StatusBadge, useToast, StatCard } from "@/components/admin";
import { Button } from "@/components/ui";
import type { SEOKeyword } from "@/lib/types/content";

type GapType = "striking-distance" | "low-ctr" | "competitor-only";

interface KeywordGap {
  id: string;
  keyword: string;
  type: GapType;
  priority?: number;
  // striking-distance / low-ctr
  currentPosition?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  rankingPage?: string;
  // competitor-only
  competitorPages?: { domain: string; url: string }[];
  capturedAt?: string;
  updatedAt?: string;
}

const TYPE_LABEL: Record<GapType, string> = {
  "striking-distance": "Striking distance",
  "low-ctr": "Low CTR",
  "competitor-only": "Competitor-only",
};

const TYPE_DESCRIPTION: Record<GapType, string> = {
  "striking-distance": "Already ranking on page 2 (positions 11–30) — small content lifts could push them to page 1.",
  "low-ctr": "Getting impressions but few clicks — usually a title or meta description problem.",
  "competitor-only": "Known competitor pages rank for these queries but CreedaVA doesn't appear at all.",
};

export default function OpportunitiesSection() {
  const { data: gaps, loading } = useCollection<KeywordGap>("keyword-gaps", {
    orderByField: "priority",
    orderDirection: "desc",
  });
  const { data: existingKeywords, add: addKeyword } = useCollection<SEOKeyword>("keywords");
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<GapType | "all">("all");

  const tracked = useMemo(
    () => new Set(existingKeywords.map((k) => k.keyword.toLowerCase())),
    [existingKeywords],
  );

  const counts = useMemo(() => {
    const c = { all: gaps.length, "striking-distance": 0, "low-ctr": 0, "competitor-only": 0 } as Record<string, number>;
    for (const g of gaps) c[g.type] = (c[g.type] ?? 0) + 1;
    return c;
  }, [gaps]);

  const filtered = useMemo(() => {
    if (filter === "all") return gaps;
    return gaps.filter((g) => g.type === filter);
  }, [gaps, filter]);

  async function trackKeyword(gap: KeywordGap) {
    if (tracked.has(gap.keyword.toLowerCase())) {
      toast("Already tracked");
      return;
    }
    setBusyId(gap.id);
    try {
      await addKeyword({
        keyword: gap.keyword,
        searchIntent: "informational",
        difficulty: gap.type === "striking-distance" ? "low" : "medium",
        suggestedTitle: gap.rankingPage
          ? `Improve "${gap.keyword}" on ${gap.rankingPage}`
          : `Target keyword: ${gap.keyword}`,
        tracked: true,
      });
      toast(`Now tracking "${gap.keyword}"`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to track", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Keyword gaps the SEO agent surfaces from Search Console + competitor probes. Track promising ones to manage them in the Keywords tab."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Striking distance" value={counts["striking-distance"] ?? 0} />
        <StatCard label="Low CTR" value={counts["low-ctr"] ?? 0} />
        <StatCard label="Competitor-only" value={counts["competitor-only"] ?? 0} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "striking-distance", "low-ctr", "competitor-only"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={filter === t ? "primary" : "outline"}
            onClick={() => setFilter(t)}
          >
            {t === "all" ? `All (${counts.all})` : `${TYPE_LABEL[t]} (${counts[t] ?? 0})`}
          </Button>
        ))}
      </div>

      <DashboardSection title="Findings">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">
            No opportunities yet. The agent runs daily — check the Agent tab to trigger a manual run.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((g) => {
              const alreadyTracked = tracked.has(g.keyword.toLowerCase());
              return (
                <div key={g.id} className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-foreground truncate">{g.keyword}</h3>
                        <StatusBadge
                          status={TYPE_LABEL[g.type]}
                          variant={g.type === "striking-distance" ? "info" : g.type === "low-ctr" ? "warning" : "default"}
                        />
                      </div>
                      <div className="text-xs text-gray-50">{TYPE_DESCRIPTION[g.type]}</div>
                    </div>
                    {typeof g.priority === "number" && (
                      <StatusBadge
                        status={`P${g.priority}`}
                        variant={g.priority > 70 ? "error" : g.priority > 40 ? "warning" : "default"}
                      />
                    )}
                  </div>

                  {(g.type === "striking-distance" || g.type === "low-ctr") && (
                    <div className="text-xs text-gray-60 mb-2">
                      pos {g.currentPosition?.toFixed(1) ?? "—"} • {g.impressions ?? 0} impressions
                      {typeof g.clicks === "number" && ` • ${g.clicks} clicks`}
                      {typeof g.ctr === "number" && ` • CTR ${(g.ctr * 100).toFixed(1)}%`}
                      {g.rankingPage && (
                        <>
                          {" • page "}
                          <code>{g.rankingPage}</code>
                        </>
                      )}
                    </div>
                  )}

                  {g.type === "competitor-only" && g.competitorPages && g.competitorPages.length > 0 && (
                    <ul className="text-xs text-gray-60 mb-2 space-y-0.5">
                      {g.competitorPages.slice(0, 5).map((p, i) => (
                        <li key={i}>
                          <span className="font-mono">{p.domain}</span>{" "}
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            view
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => trackKeyword(g)}
                      disabled={busyId === g.id || alreadyTracked}
                    >
                      {alreadyTracked ? "Already tracked" : "Track this keyword"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
