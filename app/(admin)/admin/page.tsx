"use client";

import { useState, useEffect, useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  StatCard,
  DashboardSection,
  AIPromptButton,
  useToast,
} from "@/components/admin";
import { fetchAnalyticsEvents } from "@/lib/firebase/analytics";
import { cloudFetchBusinessReviews } from "@/lib/firebase/cloud-functions";
import { lazyGenerateAndSaveReport } from "@/lib/firebase/ai-lazy";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Lead, Customer, Task, Booking } from "@/lib/types/crm";

// ─── SVG Chart Components ────────────────────────────

function GaugeChart({ value, label }: { value: number; label: string }) {
  const radius = 80;
  const circumference = Math.PI * radius;
  const filled = (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <svg width="200" height="120" viewBox="0 0 200 120" className="max-w-full h-auto">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--gray-20)"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
        <text
          x="100"
          y="95"
          textAnchor="middle"
          style={{ fontSize: "32px", fontWeight: 700, fill: "var(--gray-90)" }}
        >
          {value}%
        </text>
      </svg>
      <p className="text-sm text-gray-50 mt-1">{label}</p>
    </div>
  );
}

function SparklineChart({
  data,
  color = "var(--primary)",
}: {
  data: number[];
  color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 200;
  const height = 56;
  const pad = 4;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });
  const fill = [
    `${pad},${height - pad}`,
    ...points,
    `${width - pad},${height - pad}`,
  ];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
    >
      <polygon points={fill.join(" ")} fill={color} opacity="0.08" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Dashboard Page ──────────────────────────────────

function TrafficAreaChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const w = 500;
  const h = 120;
  const pad = 6;

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return { x, y };
  });

  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const fill = [
    `${pad},${h - pad}`,
    ...pts.map((p) => `${p.x},${p.y}`),
    `${w - pad},${h - pad}`,
  ].join(" ");

  return (
    <svg
      width={w}
      height={h + 20}
      viewBox={`0 0 ${w} ${h + 20}`}
      className="w-full h-auto"
    >
      <defs>
        <linearGradient id="dashTrafficGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={pad}
          x2={w - pad}
          y1={h - pad - frac * (h - pad * 2)}
          y2={h - pad - frac * (h - pad * 2)}
          stroke="var(--gray-10)"
          strokeWidth="1"
        />
      ))}
      <polygon points={fill} fill="url(#dashTrafficGrad)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--primary)" />
      ))}
      {data.map((d, i) => {
        if (data.length <= 14 || i % Math.ceil(data.length / 7) === 0)
          return (
            <text
              key={i}
              x={pts[i].x}
              y={h + 14}
              textAnchor="middle"
              style={{ fontSize: "9px", fill: "var(--gray-50)" }}
            >
              {d.label}
            </text>
          );
        return null;
      })}
    </svg>
  );
}

export default function AdminDashboardPage() {

  const { data: leads, loading: ll } = useCollection<Lead>("leads", {
    orderByField: "createdAt",
  });
  const { data: customers, loading: cl } = useCollection<Customer>(
    "customers",
    { orderByField: "createdAt" },
  );
  const { data: tasks, loading: tl } = useCollection<Task>("tasks", {
    orderByField: "createdAt",
  });
  const { data: bookings, loading: bl } = useCollection<Booking>("bookings", {
    orderByField: "createdAt",
  });

  const loading = ll || cl || tl || bl;

  // ─── Daily Status ──────────────────────────────────
  const [dailyRunning, setDailyRunning] = useState(false);
  const { toast } = useToast();

  async function handleRunDailyStatus() {
    setDailyRunning(true);
    try {
      await lazyGenerateAndSaveReport("daily", "/admin");
      toast("Daily Status Brief generated — view it in Analytics → Reports", "success");
    } catch (err) {
      console.error("Daily status generation failed:", err);
      toast("Daily status failed — try again", "error");
    } finally {
      setDailyRunning(false);
    }
  }

  // ─── Google sync status ────────────────────────────
  const [syncLog, setSyncLog] = useState<{ type: string; completedAt: string; results: { service: string; status: string; detail?: string }[] } | null>(null);
  const [reviews, setReviews] = useState<{ count: number; loading: boolean }>({ count: 0, loading: false });

  useEffect(() => {
    getDoc(doc(db, "sync-log", "latest")).then((snap) => {
      if (snap.exists()) setSyncLog(snap.data() as typeof syncLog);
    }).catch(() => {});

    // Load review count from cached business-reviews
    import("firebase/firestore").then(({ collection, getDocs }) => {
      getDocs(collection(db, "business-reviews")).then((snap) => {
        setReviews({ count: snap.size, loading: false });
      }).catch(() => {});
    });
  }, []);

  async function handleSyncReviews() {
    setReviews((r) => ({ ...r, loading: true }));
    try {
      const result = await cloudFetchBusinessReviews();
      if (result.success) {
        setReviews({ count: result.reviewCount, loading: false });
      }
    } catch {
      setReviews((r) => ({ ...r, loading: false }));
    }
  }

  // ─── Traffic data from Firestore analytics ─────────
  const [trafficData, setTrafficData] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    fetchAnalyticsEvents(30)
      .then(({ events }) => {
        // Group page_view events by date
        const dateMap: Record<string, number> = {};
        const now = new Date();
        // Pre-fill last 14 days
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          dateMap[d.toISOString().slice(5, 10)] = 0; // MM-DD
        }
        events
          .filter((e) => e.eventType === "page_view")
          .forEach((e) => {
            const key = e.timestamp.slice(5, 10);
            if (key in dateMap) dateMap[key]++;
          });
        setTrafficData(
          Object.entries(dateMap).map(([label, value]) => ({ label, value })),
        );
      })
      .catch(() => setTrafficData([]));
  }, []);

  // ─── Computed metrics ──────────────────────────────
  const activeCustomers = useMemo(
    () => customers.filter((c) => c.status === "active"),
    [customers],
  );
  const mrr = useMemo(
    () => activeCustomers.reduce((s, c) => s + (c.monthlyValue || 0), 0),
    [activeCustomers],
  );

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done"),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "done"),
    [tasks],
  );
  const taskCompletionRate =
    tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

  const wonRate = useMemo(() => {
    const closed = leads.filter(
      (l) => l.status === "won" || l.status === "lost",
    );
    if (closed.length === 0) return 0;
    return Math.round(
      (closed.filter((l) => l.status === "won").length / closed.length) * 100,
    );
  }, [leads]);

  const _leadSources = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      counts[l.source || "other"] = (counts[l.source || "other"] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const _sourceColors: Record<string, string> = {
    website: "#005148",
    referral: "#007A6D",
    social: "#0043CE",
    ad: "#F1C21B",
    email: "#4589FF",
    "cold-call": "#878D96",
    other: "#A2A9B0",
  };

  const funnel = useMemo(
    () => [
      {
        label: "New",
        count: leads.filter((l) => l.status === "new").length,
        color: "#4589FF",
      },
      {
        label: "Contacted",
        count: leads.filter((l) => l.status === "contacted").length,
        color: "#0043CE",
      },
      {
        label: "Qualified",
        count: leads.filter((l) => l.status === "qualified").length,
        color: "#6929C4",
      },
      {
        label: "Proposal",
        count: leads.filter((l) => l.status === "proposal").length,
        color: "#9F1853",
      },
      {
        label: "Won",
        count: leads.filter((l) => l.status === "won").length,
        color: "#198038",
      },
      {
        label: "Lost",
        count: leads.filter((l) => l.status === "lost").length,
        color: "#DA1E28",
      },
    ],
    [leads],
  );
  const _maxFunnel = Math.max(...funnel.map((f) => f.count), 1);


  // Sparkline data (simulate weekly distribution from totals)
  const leadsSparkline = useMemo(() => {
    if (leads.length === 0) return [0, 0, 0, 0, 0, 0, 0];
    return Array.from({ length: 7 }, (_, i) =>
      Math.max(
        0,
        Math.round(leads.length / 7 + (Math.sin(i) * leads.length) / 14),
      ),
    );
  }, [leads]);

  const revenueSparkline = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) =>
      Math.max(0, Math.round(mrr + (Math.cos(i) * mrr) / 5)),
    );
  }, [mrr]);



  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Business performance overview and analytics"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunDailyStatus}
              disabled={dailyRunning}
              className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dailyRunning ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              )}
              {dailyRunning ? "Running..." : "Daily Status"}
            </button>
            <AIPromptButton
            section="Dashboard AI"
            description="Analyze your business data — get growth strategies, weekly priorities, and SEO quick wins."
            placeholder="e.g. What should we focus on this week to grow revenue?"
            presets={[
              { label: "Growth Strategy", prompt: "Analyze our metrics and suggest a 5-step growth strategy focusing on lead conversion, customer retention, and revenue growth." },
              { label: "Weekly Priorities", prompt: "Based on current data, list the top 5 priorities for this week with specific actions and expected impact." },
              { label: "SEO Quick Win", prompt: "Suggest one high-impact SEO action we can do today with step-by-step instructions." },
              { label: "Revenue Leaks", prompt: "Identify potential revenue leaks in our pipeline. Check for stale leads, underpriced customers, and missed upsell opportunities. Suggest fixes." },
              { label: "Client Health Check", prompt: "Assess overall client health. Flag at-risk customers, highlight happiest clients, and suggest proactive outreach for each segment." },
              { label: "Competitor Moves", prompt: "Based on our current positioning, suggest 3 competitive advantages we should emphasize in our marketing and sales conversations." },
              { label: "Bottleneck Finder", prompt: "Identify the single biggest bottleneck slowing our growth right now. Explain why it matters, its impact, and give 3 actions to fix it." },
              { label: "30-Day Plan", prompt: "Create a 30-day action plan to improve key business metrics. Break into weekly milestones with owners and measurable outcomes." },
            ]}
            dataContext={(() => {
              const newLeads = leads.filter((l) => l.status === "new").length;
              const pipeline = leads.filter((l) => !["won", "lost"].includes(l.status)).reduce((s, l) => s + (l.value || 0), 0);
              const activeClients = customers.filter((c) => c.status === "active").length;
              const churned = customers.filter((c) => c.status === "churned").length;
              const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length;
              const pending = bookings.filter((b) => b.status === "pending").length;
              return `CreedaVA Dashboard Summary:\n- ${leads.length} total leads (${newLeads} new), pipeline value $${pipeline}\n- Win rate: ${wonRate}%, ${leads.filter(l=>l.status==="lost").length} lost\n- ${activeClients} active customers, ${churned} churned, MRR $${customers.filter(c=>c.status==="active").reduce((s,c)=>s+(c.monthlyValue||0),0)}\n- ${tasks.length} tasks (${overdue} overdue, ${tasks.filter(t=>t.status==="done").length} done)\n- ${bookings.length} bookings (${pending} pending)`;
            })()}
          />
          </div>
        }
      />


          {/* Row 1 — Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Leads"
              value={leads.length.toString()}
              badge={
                leads.filter((l) => l.status === "new").length > 0
                  ? `${leads.filter((l) => l.status === "new").length} new`
                  : undefined
              }
              trend={
                wonRate > 0
                  ? { value: wonRate, positive: true }
                  : undefined
              }
            />
            <StatCard
              label="Active Clients"
              value={activeCustomers.length.toString()}
              badge={`${customers.length} total`}
              trend={
                activeCustomers.length > 0
                  ? {
                      value: Math.round(
                        (activeCustomers.length /
                          Math.max(customers.length, 1)) *
                          100,
                      ),
                      positive: true,
                    }
                  : undefined
              }
            />
            <StatCard
              label="Monthly Revenue"
              value={`$${mrr.toLocaleString()}`}
              badge="MRR"
            />
            <StatCard
              label="Task Completion"
              value={`${taskCompletionRate}%`}
              badge={`${openTasks.length} open`}
              trend={
                taskCompletionRate > 50
                  ? { value: taskCompletionRate, positive: true }
                  : taskCompletionRate > 0
                    ? { value: 100 - taskCompletionRate, positive: false }
                    : undefined
              }
            />
          </div>

          {/* Row 2 — Three chart panels */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Conversion gauge */}
            <DashboardSection title="Conversion Rate">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-50">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
                  Achieved
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-50">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-20 inline-block" />
                  Remaining
                </span>
              </div>
              <GaugeChart value={wonRate} label="Lead-to-customer conversion" />
            </DashboardSection>

            {/* Traffic over time */}
            <DashboardSection title="Traffic Over Time">
              {trafficData.length > 1 && trafficData.some((d) => d.value > 0) ? (
                <TrafficAreaChart data={trafficData} />
              ) : (
                <p className="text-sm text-gray-40 text-center py-8">
                  No traffic data yet
                </p>
              )}
            </DashboardSection>

            {/* Sparkline trends */}
            <DashboardSection title="Trends">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-50">Lead Volume</span>
                    <span className="text-xs font-medium text-gray-80">
                      {leads.length}
                    </span>
                  </div>
                  <SparklineChart data={leadsSparkline} color="var(--primary)" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-50">Revenue</span>
                    <span className="text-xs font-medium text-gray-80">
                      ${mrr.toLocaleString()}
                    </span>
                  </div>
                  <SparklineChart data={revenueSparkline} color="#198038" />
                </div>
              </div>
            </DashboardSection>
          </div>

          {/* Row 3 — Summary, Activity, Sync, Quick Actions */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DashboardSection title="Revenue Summary">
              <div className="space-y-3">
                {[
                  {
                    label: "Monthly Revenue",
                    value: `$${mrr.toLocaleString()}`,
                  },
                  {
                    label: "Annual Projected",
                    value: `$${(mrr * 12).toLocaleString()}`,
                  },
                  {
                    label: "Avg. Client Value",
                    value:
                      activeCustomers.length > 0
                        ? `$${Math.round(mrr / activeCustomers.length).toLocaleString()}`
                        : "$0",
                  },
                  { label: "Total Bookings", value: bookings.length.toString() },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-1.5 border-b border-gray-10 last:border-0"
                  >
                    <span className="text-sm text-gray-60">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-90">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </DashboardSection>

            <DashboardSection
              title="Recent Activity"
              action={
                <a
                  href="/admin/tasks"
                  className="text-xs font-medium text-primary hover:text-primary-light"
                >
                  View all &rarr;
                </a>
              }
            >
              {openTasks.length === 0 && leads.length === 0 ? (
                <p className="text-sm text-gray-40 text-center py-6">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-2">
                  {leads.slice(0, 3).map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center gap-2.5 py-1.5"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {lead.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-80 truncate">
                          {lead.name}
                        </p>
                        <p className="text-xs text-gray-40">New lead</p>
                      </div>
                    </div>
                  ))}
                  {openTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2.5 py-1.5"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-20">
                        <svg
                          className="w-3.5 h-3.5 text-gray-60"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M9 11l3 3L22 4" />
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-80 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-40">
                          {task.priority} priority
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardSection>

            <DashboardSection title="Google Sync">
              <div className="space-y-2">
                {syncLog ? (
                  <>
                    <p className="text-xs text-gray-40">
                      Last sync: {new Date(syncLog.completedAt).toLocaleString()}
                    </p>
                    <div className="space-y-1.5">
                      {(syncLog.results || []).map((r) => (
                        <div key={r.service} className="flex items-center justify-between text-sm">
                          <span className="text-gray-70">{r.service}</span>
                          <span className={r.status === "ok" ? "text-green-600 text-xs font-medium" : "text-red-500 text-xs"}>
                            {r.status === "ok" ? `✓ ${r.detail || "synced"}` : `✗ ${r.detail || "failed"}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-40">No sync data yet — runs daily at 6 AM</p>
                )}
                <div className="pt-2 border-t border-gray-10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-70">Google Reviews</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-90">{reviews.count}</span>
                      <button
                        onClick={handleSyncReviews}
                        disabled={reviews.loading}
                        className="text-xs text-primary hover:text-primary-light disabled:opacity-50"
                      >
                        {reviews.loading ? "Syncing..." : "Refresh"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardSection>

            <DashboardSection title="Quick Actions">
              <div className="space-y-1">
                {[
                  {
                    label: "Add New Lead",
                    href: "/admin/leads",
                    icon: "M12 4v16m8-8H4",
                  },
                  {
                    label: "Create Task",
                    href: "/admin/tasks",
                    icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
                  },
                  {
                    label: "Write Blog Post",
                    href: "/admin/blog",
                    icon: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7",
                  },
                  {
                    label: "View Analytics",
                    href: "/admin/analytics",
                    icon: "M3 3v18h18M7 16l4-8 4 4 4-4",
                  },
                ].map((a) => (
                  <a
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-70 hover:bg-gray-10 hover:text-gray-90 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={a.icon} />
                    </svg>
                    {a.label}
                  </a>
                ))}
              </div>
            </DashboardSection>
          </div>
    </div>
  );
}
