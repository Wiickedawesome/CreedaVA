"use client";

import { useState, useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  StatCard,
  AdminTabs,
  DataTable,
  EmptyState,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { InsightCard } from "@/components/admin/report-categories";
import type { AIInsight, AITask } from "@/lib/types/content";
import type { ToolRiskLevel } from "@/lib/firebase/ai-tools";
import type { ActionDecision } from "@/lib/firebase/ai-autonomy";

// ─── Types ───────────────────────────────────────────

interface ActivityLogEntry {
  id: string;
  toolName: string;
  domain: string;
  risk: ToolRiskLevel;
  decision: ActionDecision;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  conversationId?: string;
  userConfirmed?: boolean;
  executedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Helpers ─────────────────────────────────────────

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const riskColors: Record<string, string> = {
  "read-only": "bg-blue-500/15 text-blue-400",
  draft: "bg-yellow-500/15 text-yellow-400",
  auto: "bg-green-500/15 text-green-400",
  destructive: "bg-red-500/15 text-red-400",
};

const decisionColors: Record<string, string> = {
  "auto-execute": "bg-green-500/15 text-green-400",
  confirm: "bg-yellow-500/15 text-yellow-400",
  deny: "bg-red-500/15 text-red-400",
};

// ─── Page ────────────────────────────────────────────

export default function AIActivityDashboard() {
  const { data: activityLog, loading: logLoading } = useCollection<ActivityLogEntry>(
    "ai-activity-log",
    { orderByField: "createdAt", orderDirection: "desc" },
  );
  const { data: insights, edit: editInsight } = useCollection<AIInsight>(
    "ai-insights",
    { orderByField: "createdAt", orderDirection: "desc" },
  );
  const { data: tasks } = useCollection<AITask>(
    "ai-tasks",
    { orderByField: "createdAt", orderDirection: "desc" },
  );

  const [tab, setTab] = useState("overview");
  const [domainFilter, setDomainFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  // ─── Computed stats ────────────────────────────────

  const stats = useMemo(() => {
    const total = activityLog.length;
    const autoExec = activityLog.filter((l) => l.decision === "auto-execute").length;
    const confirmed = activityLog.filter((l) => l.decision === "confirm").length;
    const denied = activityLog.filter((l) => l.decision === "deny").length;
    const errors = activityLog.filter((l) => l.error).length;

    // Domain breakdown
    const domains: Record<string, number> = {};
    for (const entry of activityLog) {
      domains[entry.domain] = (domains[entry.domain] || 0) + 1;
    }

    // Risk breakdown
    const risks: Record<string, number> = {};
    for (const entry of activityLog) {
      risks[entry.risk] = (risks[entry.risk] || 0) + 1;
    }

    // Top tools
    const toolCounts: Record<string, number> = {};
    for (const entry of activityLog) {
      toolCounts[entry.toolName] = (toolCounts[entry.toolName] || 0) + 1;
    }
    const topTools = Object.entries(toolCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // Active insights (not dismissed)
    const activeInsights = insights.filter((i) => !i.dismissed);
    const criticalInsights = activeInsights.filter((i) => i.severity === "critical").length;
    const warningInsights = activeInsights.filter((i) => i.severity === "warning").length;

    // Tasks
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const failedTasks = tasks.filter((t) => t.status === "failed").length;
    const runningTasks = tasks.filter((t) => t.status === "running" || t.status === "queued").length;

    return {
      total, autoExec, confirmed, denied, errors,
      domains, risks, topTools,
      activeInsights: activeInsights.length, criticalInsights, warningInsights,
      completedTasks, failedTasks, runningTasks,
    };
  }, [activityLog, insights, tasks]);

  // ─── Filtered activity log ─────────────────────────

  const filteredLog = useMemo(() => {
    return activityLog.filter((entry) => {
      if (domainFilter !== "all" && entry.domain !== domainFilter) return false;
      if (riskFilter !== "all" && entry.risk !== riskFilter) return false;
      return true;
    });
  }, [activityLog, domainFilter, riskFilter]);

  // ─── Activity log table columns ────────────────────

  const logColumns: Column<ActivityLogEntry>[] = [
    {
      key: "executedAt",
      header: "When",
      render: (entry) => (
        <span className="text-xs text-gray-40" title={entry.executedAt}>
          {timeAgo(entry.executedAt)}
        </span>
      ),
    },
    {
      key: "toolName",
      header: "Tool",
      render: (entry) => (
        <span className="font-mono text-xs text-gray-80">{entry.toolName}</span>
      ),
    },
    {
      key: "domain",
      header: "Domain",
      render: (entry) => (
        <span className="text-xs capitalize text-gray-60">{entry.domain}</span>
      ),
    },
    {
      key: "risk",
      header: "Risk",
      render: (entry) => (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${riskColors[entry.risk] || ""}`}>
          {entry.risk}
        </span>
      ),
    },
    {
      key: "decision",
      header: "Decision",
      render: (entry) => (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${decisionColors[entry.decision] || ""}`}>
          {entry.decision}
        </span>
      ),
    },
    {
      key: "error",
      header: "Status",
      render: (entry) => (
        <span className={`text-xs ${entry.error ? "text-red-400" : "text-green-400"}`}>
          {entry.error ? "Error" : "OK"}
        </span>
      ),
    },
  ];

  // ─── Task table columns ────────────────────────────

  const taskColumns: Column<AITask>[] = [
    {
      key: "label",
      header: "Task",
      render: (task) => (
        <span className="text-sm text-gray-80">{task.label}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (task) => (
        <span className="text-xs text-gray-60 capitalize">{task.type.replace(/-/g, " ")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (task) => {
        const colors: Record<string, string> = {
          queued: "bg-gray-500/15 text-gray-400",
          running: "bg-blue-500/15 text-blue-400",
          completed: "bg-green-500/15 text-green-400",
          failed: "bg-red-500/15 text-red-400",
        };
        return (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[task.status] || ""}`}>
            {task.status}
          </span>
        );
      },
    },
    {
      key: "durationMs",
      header: "Duration",
      render: (task) =>
        task.durationMs ? (
          <span className="text-xs text-gray-40">{(task.durationMs / 1000).toFixed(1)}s</span>
        ) : (
          <span className="text-xs text-gray-40">—</span>
        ),
    },
    {
      key: "resultSnapshot",
      header: "Result",
      render: (task) => (
        <span className="text-xs text-gray-60 truncate max-w-[200px] inline-block">
          {task.resultSnapshot || task.error || "—"}
        </span>
      ),
    },
  ];

  // ─── Domain list for filter ────────────────────────
  const domainOptions = useMemo(() => {
    const set = new Set(activityLog.map((e) => e.domain));
    return Array.from(set).sort();
  }, [activityLog]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Activity"
        description="Monitor AI tool usage, proactive insights, and autonomous actions"
      />

      {/* ─── Stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Actions" value={stats.total} />
        <StatCard label="Auto-Executed" value={stats.autoExec} />
        <StatCard
          label="Active Insights"
          value={stats.activeInsights}
          trend={stats.criticalInsights > 0 ? { value: stats.criticalInsights, positive: false } : undefined}
        />
        <StatCard
          label="AI Tasks"
          value={stats.completedTasks + stats.failedTasks + stats.runningTasks}
          trend={stats.runningTasks > 0 ? { value: stats.runningTasks, positive: true } : undefined}
        />
      </div>

      {/* ─── Tabs ───────────────────────────────────── */}
      <AdminTabs
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "activity", label: `Activity Log (${activityLog.length})` },
          { value: "insights", label: `Insights (${insights.length})` },
          { value: "tasks", label: `AI Tasks (${tasks.length})` },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {/* ─── Overview Tab ───────────────────────────── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tool usage breakdown */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-80 mb-4">Top Tools Used</h3>
            {stats.topTools.length === 0 ? (
              <p className="text-xs text-gray-40">No tool invocations yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.topTools.map(([tool, count]) => {
                  const maxCount = stats.topTools[0][1];
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={tool} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-60 w-48 truncate shrink-0">{tool}</span>
                      <div className="flex-1 h-2 bg-gray-20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-40 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Risk breakdown */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-80 mb-4">Risk Level Distribution</h3>
            {stats.total === 0 ? (
              <p className="text-xs text-gray-40">No actions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {(["read-only", "draft", "auto", "destructive"] as const).map((risk) => {
                  const count = stats.risks[risk] || 0;
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={risk} className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium w-24 text-center ${riskColors[risk]}`}>
                        {risk}
                      </span>
                      <div className="flex-1 h-2 bg-gray-20 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: risk === "destructive" ? "var(--red-500, #ef4444)" :
                              risk === "auto" ? "var(--green-500, #22c55e)" :
                              risk === "draft" ? "var(--yellow-500, #eab308)" :
                              "var(--blue-500, #3b82f6)",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-40 w-16 text-right">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Domain breakdown */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-80 mb-4">Actions by Domain</h3>
            {Object.keys(stats.domains).length === 0 ? (
              <p className="text-xs text-gray-40">No domains recorded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.domains)
                  .sort(([, a], [, b]) => b - a)
                  .map(([domain, count]) => (
                    <div key={domain} className="flex items-center justify-between bg-gray-20/30 rounded-lg px-3 py-2">
                      <span className="text-xs capitalize text-gray-60">{domain}</span>
                      <span className="text-sm font-medium text-gray-80">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Decision breakdown */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-80 mb-4">Decision Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{stats.autoExec}</p>
                <p className="text-xs text-green-400/70 mt-1">Auto-Executed</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.confirmed}</p>
                <p className="text-xs text-yellow-400/70 mt-1">Confirmed</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-400">{stats.denied}</p>
                <p className="text-xs text-red-400/70 mt-1">Denied</p>
              </div>
              <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-400">{stats.errors}</p>
                <p className="text-xs text-gray-400/70 mt-1">Errors</p>
              </div>
            </div>
          </div>

          {/* Recent insights (pinned + critical first) */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-medium text-gray-80 mb-4">
              Recent Insights
              {stats.criticalInsights > 0 && (
                <span className="ml-2 text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
                  {stats.criticalInsights} critical
                </span>
              )}
              {stats.warningInsights > 0 && (
                <span className="ml-2 text-[10px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full">
                  {stats.warningInsights} warning
                </span>
              )}
            </h3>
            {insights.length === 0 ? (
              <p className="text-xs text-gray-40">No insights yet. The weekly SEO review will generate insights automatically.</p>
            ) : (
              <div className="space-y-3">
                {insights
                  .filter((i) => !i.dismissed)
                  .sort((a, b) => {
                    // Pinned first, then by severity, then by date
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    const sevOrder = { critical: 0, warning: 1, positive: 2, info: 3 };
                    return (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3);
                  })
                  .slice(0, 8)
                  .map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onPin={() => editInsight(insight.id, { pinned: !insight.pinned })}
                      onDismiss={() => editInsight(insight.id, { dismissed: true })}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Activity Log Tab ───────────────────────── */}
      {tab === "activity" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
            >
              <option value="all">All Domains</option>
              {domainOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
            >
              <option value="all">All Risk Levels</option>
              <option value="read-only">Read-Only</option>
              <option value="draft">Draft</option>
              <option value="auto">Auto</option>
              <option value="destructive">Destructive</option>
            </select>
          </div>

          {filteredLog.length === 0 && !logLoading ? (
            <EmptyState
              title="No activity yet"
              description="AI tool invocations will appear here as the AI assistant processes requests."
            />
          ) : (
            <DataTable
              columns={logColumns}
              data={filteredLog}
              keyExtractor={(entry) => entry.id}
            />
          )}
        </div>
      )}

      {/* ─── Insights Tab ───────────────────────────── */}
      {tab === "insights" && (
        <div className="space-y-3">
          {insights.length === 0 ? (
            <EmptyState
              title="No insights yet"
              description="Proactive SEO and business insights will appear here after the weekly review runs."
            />
          ) : (
            insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onPin={() => editInsight(insight.id, { pinned: !insight.pinned })}
                onDismiss={() => editInsight(insight.id, { dismissed: !insight.dismissed })}
              />
            ))
          )}
        </div>
      )}

      {/* ─── Tasks Tab ──────────────────────────────── */}
      {tab === "tasks" && (
        <div>
          {tasks.length === 0 ? (
            <EmptyState
              title="No AI tasks"
              description="Tasks like blog generation, SEO audits, and report creation will appear here."
            />
          ) : (
            <DataTable
              columns={taskColumns}
              data={tasks}
              keyExtractor={(task) => task.id}
            />
          )}
        </div>
      )}
    </div>
  );
}
