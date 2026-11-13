"use client";

import React, { useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import { useFindings } from "@/hooks/useFindings";
import { DashboardSection } from "@/components/admin";
import { InlineFinding } from "@/components/admin/inline-finding";
import { mapFindingsByTarget, targetKey } from "@/lib/types/findings";

interface RankRow {
  id: string;
  keyword: string;
  page: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  dayKey: string;
}

export function RankingsTable() {
  const { data: rows, loading } = useCollection<RankRow>("rank-history", {
    orderByField: "dayKey",
    orderDirection: "desc",
  });
  // Rank drops used to be written to the task board and shown nowhere. They are
  // the agent's verdict on the row below, so they ride along with it.
  const { findings, refetch: refetchFindings } = useFindings({
    scope: "keyword",
    skills: ["rank-drop"],
  });
  const findingsByKeyword = useMemo(() => mapFindingsByTarget(findings, "keyword"), [findings]);

  const summary = useMemo(() => {
    const byKeyword = new Map<string, RankRow[]>();
    for (const r of rows) {
      const arr = byKeyword.get(r.keyword) ?? [];
      arr.push(r);
      byKeyword.set(r.keyword, arr);
    }
    const out: { keyword: string; latest: RankRow; trend: number; samples: number }[] = [];
    for (const [keyword, arr] of byKeyword) {
      arr.sort((a, b) => b.dayKey.localeCompare(a.dayKey));
      const latest = arr[0];
      const previous = arr[arr.length - 1];
      const trend = previous && previous.id !== latest.id ? previous.position - latest.position : 0;
      out.push({ keyword, latest, trend, samples: arr.length });
    }
    out.sort((a, b) => a.latest.position - b.latest.position);
    return out;
  }, [rows]);

  return (
    <DashboardSection title="Position snapshots (auto, every Monday)">
      {loading ? (
        <p className="text-sm text-gray-60">Loading…</p>
      ) : summary.length === 0 ? (
        <p className="text-sm text-gray-60">
          No snapshots yet. The agent captures rank history every Monday at 03:30. Lower position is better.
        </p>
      ) : (
        <div className="overflow-x-auto bg-card rounded-lg border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-10 text-left text-gray-70">
              <tr>
                <th className="px-3 py-2">Keyword</th>
                <th className="px-3 py-2">Latest position</th>
                <th className="px-3 py-2">Δ (7d)</th>
                <th className="px-3 py-2">Page</th>
                <th className="px-3 py-2">Impr.</th>
                <th className="px-3 py-2">Clicks</th>
                <th className="px-3 py-2">CTR</th>
                <th className="px-3 py-2">Samples</th>
                <th className="px-3 py-2">Agent</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.keyword} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{s.keyword}</td>
                  <td className="px-3 py-2">{s.latest.position.toFixed(1)}</td>
                  <td
                    className={`px-3 py-2 ${
                      s.trend > 0 ? "text-success-text" : s.trend < 0 ? "text-error-text" : "text-gray-60"
                    }`}
                  >
                    {s.trend === 0 ? "—" : s.trend > 0 ? `+${s.trend.toFixed(1)}` : s.trend.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-60 truncate max-w-xs">{s.latest.page}</td>
                  <td className="px-3 py-2">{s.latest.impressions}</td>
                  <td className="px-3 py-2">{s.latest.clicks}</td>
                  <td className="px-3 py-2">{(s.latest.ctr * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2 text-gray-60">{s.samples}</td>
                  <td className="px-3 py-2">
                    <InlineFinding
                      findings={findingsByKeyword.get(targetKey(s.keyword)) ?? []}
                      onChanged={refetchFindings}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardSection>
  );
}
