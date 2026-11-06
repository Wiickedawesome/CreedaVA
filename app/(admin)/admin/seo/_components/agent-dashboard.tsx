"use client";

import React, { useMemo, useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { DashboardSection, StatCard, StatusBadge, useToast } from "@/components/admin";
import { Button } from "@/components/ui";
import { cloudSeoAgentRun, type SeoAgentSkill } from "@/lib/firebase/cloud-functions";

interface AgentRun {
  id: string;
  skill: SeoAgentSkill;
  source: "scheduled" | "manual";
  status: "in-progress" | "completed" | "partial" | "error" | "skipped";
  startedAt?: { seconds: number } | string;
  finishedAt?: { seconds: number } | string;
  queriesUsed?: number;
  findings?: number;
  summary?: Record<string, unknown>;
  error?: string;
}

const SKILLS: { skill: SeoAgentSkill; label: string; weekday: string; cost: string }[] = [
  { skill: "onpage-audit", label: "On-page audit", weekday: "Mon", cost: "0 search queries" },
  { skill: "rank-history", label: "Rank history snapshot", weekday: "Mon", cost: "0 search queries" },
  { skill: "keyword-gaps", label: "Keyword gaps", weekday: "Tue", cost: "~80 search queries" },
  { skill: "citation-audit", label: "Citation audit (AIO/GEO)", weekday: "Wed", cost: "~80 search queries" },
  { skill: "backlinks-resources", label: "Backlink prospects (resources)", weekday: "Thu", cost: "~80 search queries" },
  { skill: "backlinks-competitor", label: "Competitor mentions", weekday: "Fri", cost: "~80 search queries" },
  { skill: "brand-mentions", label: "Unlinked brand mentions", weekday: "Sat", cost: "~4 search queries" },
  { skill: "synthesizer", label: "Weekly synthesizer + email", weekday: "Sun", cost: "0 search queries (Gemini-only)" },
];

const statusVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  completed: "success",
  ok: "success",
  partial: "warning",
  "in-progress": "info",
  skipped: "default",
  error: "error",
  locked: "warning",
  killswitch: "error",
};

function fmtDate(v: AgentRun["startedAt"]): string {
  if (!v) return "—";
  if (typeof v === "string") return new Date(v).toLocaleString();
  if (typeof v === "object" && v.seconds) return new Date(v.seconds * 1000).toLocaleString();
  return "—";
}

export function SeoAgentDashboard() {
  const { data: runs, loading, refetch } = useCollection<AgentRun>("agent-runs", {
    orderByField: "startedAt",
    orderDirection: "desc",
  });
  const { toast } = useToast();
  const [running, setRunning] = useState<SeoAgentSkill | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cutoff] = useState<number>(() => Date.now() - 7 * 86_400_000);

  const stats = useMemo(() => {
    const last7 = runs.filter((r) => {
      const d =
        typeof r.startedAt === "object" && r.startedAt?.seconds
          ? r.startedAt.seconds * 1000
          : new Date((r.startedAt as string) ?? 0).getTime();
      return d > cutoff;
    });
    return {
      total: last7.length,
      completed: last7.filter((r) => r.status === "completed").length,
      partial: last7.filter((r) => r.status === "partial").length,
      errors: last7.filter((r) => r.status === "error").length,
      findings: last7.reduce((s, r) => s + (r.findings ?? 0), 0),
      queriesUsed: last7.reduce((s, r) => s + (r.queriesUsed ?? 0), 0),
    };
  }, [runs, cutoff]);

  async function handleRun(skill: SeoAgentSkill, force = false) {
    setRunning(skill);
    try {
      const result = await cloudSeoAgentRun(skill, { force });
      if (result.status === "locked") {
        toast(`${skill} is already running. Use Force to override.`, "info");
      } else if (result.status === "killswitch") {
        toast("Kill switch is enabled \u2014 toggle it off in Settings.", "error");
      } else if (result.status === "error") {
        toast(result.error ?? "Run failed.", "error");
      } else {
        toast(
          `${skill}: ${result.status} \u2014 ${result.result?.findings ?? 0} findings, ${result.result?.queriesUsed ?? 0} queries used.`,
          "success",
        );
      }
      // The callable writes run docs server-side; refresh to reflect new stats/runs immediately.
      refetch();
      setTimeout(() => refetch(), 1200);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Run failed.", "error");
    } finally {
      setRunning(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      refetch();
      // Brief delay so the spinner is visible and the fetch can land.
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div>
      <DashboardSection title="Last 7 days">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Runs" value={stats.total} />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="Findings" value={stats.findings} />
          <StatCard label="Search queries used" value={stats.queriesUsed} />
        </div>
      </DashboardSection>

      <DashboardSection title="Skill rotation">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SKILLS.map((s) => (
            <div key={s.skill} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">{s.label}</div>
                <div className="text-xs text-gray-50">
                  {s.weekday} • {s.cost}
                </div>
              </div>
              <Button onClick={() => handleRun(s.skill)} disabled={running !== null}>
                {running === s.skill ? "Running…" : "Run now"}
              </Button>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        title="Recent runs"
        action={
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        }
      >
        {loading ? (
          <p className="text-sm text-gray-60">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-gray-60">No runs yet. Click &ldquo;Run now&rdquo; on any skill above to start.</p>
        ) : (
          <div className="overflow-x-auto bg-card rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-10 text-left text-gray-70">
                <tr>
                  <th className="px-3 py-2">Skill</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Started</th>
                  <th className="px-3 py-2">Findings</th>
                  <th className="px-3 py-2">Queries</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 30).map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">{r.skill}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.status} variant={statusVariant[r.status] ?? "default"} />
                    </td>
                    <td className="px-3 py-2">{r.source}</td>
                    <td className="px-3 py-2">{fmtDate(r.startedAt)}</td>
                    <td className="px-3 py-2">{r.findings ?? 0}</td>
                    <td className="px-3 py-2">{r.queriesUsed ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
