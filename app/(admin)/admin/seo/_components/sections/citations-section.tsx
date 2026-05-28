"use client";

import React from "react";
import { useCollection } from "@/hooks/useCollection";
import { DashboardSection, PageHeader } from "@/components/admin";

interface CitationAudit {
  id: string;
  url: string;
  pathKey: string;
  score: number;
  fetchedAt: string;
  hasFaqSchema: boolean;
  hasArticleSchema: boolean;
  paaCoverage: number;
  quotableBullets: number;
  hasCitations: boolean;
  headingDepth: number;
  paragraphCount: number;
  recommendations: string[];
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 70) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export default function CitationsSection() {
  const { data: audits, loading } = useCollection<CitationAudit>("citation-audits", {
    orderByField: "score",
    orderDirection: "asc",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="LLM Citation Readiness"
        description="How well each page is structured for AI Overviews, ChatGPT, Perplexity, and other LLM citation engines. Lower scores need the most work."
      />

      <DashboardSection title={`Audits (${audits.length})`}>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : audits.length === 0 ? (
          <p className="text-sm text-gray-500">
            No citation audits yet. The agent runs weekly and writes findings to <code>citation-audits</code>.
            Trigger a manual run from the Agent tab.
          </p>
        ) : (
          <div className="space-y-3">
            {audits.map((a) => (
              <div key={a.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-50 truncate">{a.url}</div>
                    <div className="text-sm font-medium text-foreground truncate">{a.pathKey}</div>
                    <div className="text-xs text-gray-50 mt-1">
                      {a.paragraphCount} paragraphs • {a.quotableBullets} bullets • depth {a.headingDepth} • PAA {a.paaCoverage}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold px-3 py-1 rounded border ${scoreColor(a.score)}`}>
                    {a.score}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-2 text-[11px]">
                  <SchemaBadge label="FAQ schema" present={a.hasFaqSchema} />
                  <SchemaBadge label="Article schema" present={a.hasArticleSchema} />
                  <SchemaBadge label="Citations" present={a.hasCitations} />
                </div>

                {a.recommendations.length > 0 && (
                  <ul className="text-xs text-gray-70 list-disc pl-5 space-y-0.5">
                    {a.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}

function SchemaBadge({ label, present }: { label: string; present: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${
        present ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      <span>{present ? "✓" : "✗"}</span>
      {label}
    </span>
  );
}
