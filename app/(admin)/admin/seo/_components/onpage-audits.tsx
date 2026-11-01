"use client";

import React from "react";
import { useCollection } from "@/hooks/useCollection";
import { DashboardSection } from "@/components/admin";

interface OnPageAudit {
  id: string;
  url: string;
  pathKey: string;
  score: number;
  fetchedAt: string;
  status: number;
  responseTimeMs: number;
  titleLength: number;
  metaDescriptionLength: number;
  wordCount: number;
  issues: { code: string; severity: "info" | "low" | "medium" | "high"; message: string }[];
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-green-700 bg-green-50 border-green-200";
  if (score >= 70) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export function OnPageAuditsList() {
  const { data: audits, loading } = useCollection<OnPageAudit>("onpage-audits", {
    orderByField: "score",
    orderDirection: "asc",
  });

  return (
    <DashboardSection title="On-page audits (auto, every Monday)">
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : audits.length === 0 ? (
        <p className="text-sm text-gray-500">
          No audits yet. The agent runs every Monday at 03:00 (America/Belize), or click <strong>Run now</strong> on the SEO Agent tab.
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
                    HTTP {a.status} • {a.responseTimeMs}ms • {a.wordCount} words • title {a.titleLength} chars • meta {a.metaDescriptionLength} chars
                  </div>
                </div>
                <div className={`text-2xl font-bold px-3 py-1 rounded border ${scoreColor(a.score)}`}>
                  {a.score}
                </div>
              </div>
              {(a.issues?.length ?? 0) > 0 && (
                <ul className="text-xs space-y-1">
                  {(a.issues ?? []).map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                          i.severity === "high"
                            ? "bg-red-100 text-red-700"
                            : i.severity === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : i.severity === "low"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {i.severity}
                      </span>
                      <span className="font-mono text-gray-500">{i.code}</span>
                      <span className="text-gray-700">{i.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
