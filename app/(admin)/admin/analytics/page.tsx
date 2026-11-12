"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  DashboardSection,
  StatCard,
  AdminTabs,
  WorldMap,
  CountryMap,
} from "@/components/admin";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  fetchAnalyticsEvents,
  type AnalyticsEvent,
} from "@/lib/firebase/analytics";
import {
  cloudFetchAnalyticsReport,
  cloudFetchRealtimeAnalytics,
} from "@/lib/firebase/cloud-functions";

// ─── Constants ───────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  DE: "Germany", FR: "France", ES: "Spain", IT: "Italy", BR: "Brazil",
  MX: "Mexico", IN: "India", CN: "China", JP: "Japan", KR: "South Korea",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland",
  PL: "Poland", BE: "Belgium", CH: "Switzerland", AT: "Austria", IE: "Ireland",
  PT: "Portugal", GR: "Greece", CZ: "Czech Republic", RO: "Romania",
  HU: "Hungary", RU: "Russia", TR: "Turkey", ZA: "South Africa", NG: "Nigeria",
  EG: "Egypt", KE: "Kenya", SG: "Singapore", MY: "Malaysia", TH: "Thailand",
  ID: "Indonesia", PH: "Philippines", VN: "Vietnam", NZ: "New Zealand",
  AR: "Argentina", CL: "Chile", CO: "Colombia", PE: "Peru", VE: "Venezuela",
  IL: "Israel", AE: "UAE", SA: "Saudi Arabia", PK: "Pakistan",
  BD: "Bangladesh", UA: "Ukraine", BZ: "Belize",
};

const EVENT_LABELS: Record<string, { label: string; icon: string }> = {
  page_view: { label: "Page View", icon: "👁️" },
  form_submission: { label: "Form Submit", icon: "📝" },
  button_click: { label: "Button Click", icon: "🖱️" },
  chat_interaction: { label: "Chat", icon: "💬" },
  scroll_depth: { label: "Scroll", icon: "📜" },
  session_start: { label: "Session Start", icon: "🚀" },
  first_visit: { label: "First Visit", icon: "✨" },
  user_engagement: { label: "Engagement", icon: "⏱️" },
};

function getCountryName(code?: string) {
  if (!code || code === "Unknown" || code === "N/A") return "Unknown";
  return COUNTRY_NAMES[code] || code;
}

function getEventLabel(type: string) {
  return (
    EVENT_LABELS[type] || {
      label: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      icon: "📊",
    }
  );
}

// ─── Inline SVG Charts ──────────────────────────────

function AreaChart({
  data,
  color = "var(--primary)",
  height = 120,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const w = 600;
  const pad = 6;

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = height - pad - (v / max) * (height - pad * 2);
    return { x, y };
  });

  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const fill = [
    `${pad},${height - pad}`,
    ...pts.map((p) => `${p.x},${p.y}`),
    `${w - pad},${height - pad}`,
  ].join(" ");

  return (
    <svg
      width={w}
      height={height + 20}
      viewBox={`0 0 ${w} ${height + 20}`}
      className="w-full h-auto"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={pad}
          x2={w - pad}
          y1={height - pad - frac * (height - pad * 2)}
          y2={height - pad - frac * (height - pad * 2)}
          stroke="var(--gray-10)"
          strokeWidth="1"
        />
      ))}
      <polygon points={fill} fill="url(#areaGrad)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
      {/* X labels (show every few) */}
      {data.map((d, i) => {
        if (data.length <= 10 || i % Math.ceil(data.length / 8) === 0)
          return (
            <text key={i} x={pts[i].x} y={height + 14} textAnchor="middle" style={{ fontSize: "9px", fill: "var(--gray-50)" }}>
              {d.label}
            </text>
          );
        return null;
      })}
    </svg>
  );
}

function DonutWithLegend({
  segments,
  centerValue,
}: {
  segments: { value: number; color: string; label: string }[];
  centerValue: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = 60;
  const inner = 38;
  const cx = 70;
  const cy = 70;
  let cum = -90;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="shrink-0 flex justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {total > 0 ? (
            segments.map((seg, i) => {
              const angle = (seg.value / total) * 360;
              const start = cum;
              const end = start + angle;
              cum = end;
              const large = angle > 180 ? 1 : 0;
              const sr = (start * Math.PI) / 180;
              const er = (end * Math.PI) / 180;
              const x1 = cx + radius * Math.cos(sr);
              const y1 = cy + radius * Math.sin(sr);
              const x2 = cx + radius * Math.cos(er);
              const y2 = cy + radius * Math.sin(er);
              const x3 = cx + inner * Math.cos(er);
              const y3 = cy + inner * Math.sin(er);
              const x4 = cx + inner * Math.cos(sr);
              const y4 = cy + inner * Math.sin(sr);
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`}
                  fill={seg.color}
                />
              );
            })
          ) : (
            <circle cx={cx} cy={cy} r={radius} fill="var(--gray-20)" />
          )}
          <text
            x={cx}
            y={cy + 5}
            textAnchor="middle"
            style={{ fontSize: "16px", fontWeight: 700, fill: "var(--gray-90)" }}
          >
            {centerValue}
          </text>
        </svg>
      </div>
      <div className="space-y-2 w-full">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-sm text-gray-70 truncate">{seg.label}</span>
            <span className="text-sm font-semibold text-gray-90 ml-auto">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBar({
  data,
}: {
  data: { label: string; value: number; pct: number; color: string }[];
}) {
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-80">{d.label}</span>
            <span className="text-xs font-medium text-gray-60">
              {d.value} ({d.pct}%)
            </span>
          </div>
          <div className="h-3 bg-gray-10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(d.pct, 2)}%`,
                backgroundColor: d.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PeakHoursHeatmap({
  events,
  ga4Hourly,
}: {
  events: AnalyticsEvent[];
  ga4Hourly?: { dayOfWeek: number; hour: number; pageViews: number }[];
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  if (events.length > 0) {
    events.forEach((ev) => {
      const d = new Date(ev.timestamp);
      const day = (d.getDay() + 6) % 7; // 0=Mon
      grid[day][d.getHours()]++;
    });
  } else if (ga4Hourly && ga4Hourly.length > 0) {
    ga4Hourly.forEach((row) => {
      if (row.dayOfWeek >= 0 && row.dayOfWeek < 7 && row.hour >= 0 && row.hour < 24) {
        grid[row.dayOfWeek][row.hour] += row.pageViews;
      }
    });
  }

  const maxVal = Math.max(...grid.flat(), 1);

  return (
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-label="Hourly traffic heatmap, scroll horizontally"
    >
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(24, 1fr)` }}>
        <div />
        {hours.map((h) => (
          <div key={h} className="text-[9px] text-gray-50 text-center w-5">
            {h}
          </div>
        ))}
        {days.map((day, di) => (
          <div key={day} className="contents">
            <div className="text-xs text-gray-60 pr-1 self-center">
              {day}
            </div>
            {hours.map((h) => {
              const v = grid[di][h];
              const opacity = v > 0 ? 0.15 + (v / maxVal) * 0.85 : 0.04;
              return (
                <div
                  key={`${di}-${h}`}
                  className="w-5 h-5 rounded-sm"
                  style={{ backgroundColor: `rgba(0, 81, 72, ${opacity})` }}
                  title={`${day} ${h}:00 — ${v} events`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-gray-50">Less</span>
        {[0.04, 0.2, 0.4, 0.6, 0.85, 1].map((o) => (
          <div
            key={o}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: `rgba(0, 81, 72, ${o})` }}
          />
        ))}
        <span className="text-[10px] text-gray-50">More</span>
      </div>
    </div>
  );
}

function ConversionFunnel({
  events,
  totalEvents: _totalEvents,
  ga4TopPages,
}: {
  events: AnalyticsEvent[];
  totalEvents: number;
  ga4TopPages?: { path: string; pageViews: number; users: number; avgDuration: number }[];
}) {
  const stages = [
    { label: "Homepage", match: (p: string) => p === "/" || p === "" },
    { label: "Services", match: (p: string) => p.includes("/services") },
    { label: "Contact", match: (p: string) => p.includes("/contact") },
  ];

  let counts: { label: string; value: number }[];
  if (events.length > 0) {
    counts = stages.map((s) => ({
      label: s.label,
      value: events.filter((e) => s.match(e.page || "")).length,
    }));
  } else if (ga4TopPages && ga4TopPages.length > 0) {
    counts = stages.map((s) => ({
      label: s.label,
      value: ga4TopPages
        .filter((p) => s.match(p.path || ""))
        .reduce((sum, p) => sum + p.pageViews, 0),
    }));
  } else {
    counts = stages.map((s) => ({ label: s.label, value: 0 }));
  }

  const maxCount = Math.max(counts[0]?.value || 1, 1);

  return (
    <div className="space-y-3">
      {counts.map((c, i) => {
        const pct = maxCount > 0 ? Math.round((c.value / maxCount) * 100) : 0;
        const dropoff =
          i > 0 && counts[i - 1].value > 0
            ? Math.round(
                ((counts[i - 1].value - c.value) / counts[i - 1].value) * 100,
              )
            : 0;
        return (
          <div key={c.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-80">{c.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-60">
                  {c.value}
                </span>
                {i > 0 && dropoff > 0 && (
                  <span className="text-[10px] text-error-text">
                    ▼ {dropoff}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-4 bg-gray-10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  background: `linear-gradient(90deg, var(--chart-1), var(--chart-7))`,
                  opacity: 1 - i * 0.15,
                }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-gray-50 mt-2">
        Conversion: {counts[0]?.value > 0 && counts[3]?.value > 0
          ? `${((counts[3].value / counts[0].value) * 100).toFixed(1)}%`
          : "N/A"}{" "}
        Homepage → Contact
      </p>
    </div>
  );
}

// ─── Analytics Page ──────────────────────────────────

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdminPages, setShowAdminPages] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEvent | null>(null);
  const [sortField, setSortField] = useState<"timestamp" | "eventType" | "page">("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [ga4Syncing, setGa4Syncing] = useState(false);
  const [ga4Data, setGa4Data] = useState<{
    totalUsers: number; totalSessions: number; totalPageViews: number;
    avgBounceRate: number; avgSessionDuration: number; totalNewUsers: number;
    totalConversions: number;
  } | null>(null);
  const [ga4Daily, setGa4Daily] = useState<{
    date: string; activeUsers: number; sessions: number; pageViews: number;
    bounceRate: number; avgSessionDuration: number; newUsers: number; conversions: number;
  }[]>([]);
  const [ga4TopPages, setGa4TopPages] = useState<{
    path: string; pageViews: number; users: number; avgDuration: number;
  }[]>([]);
  const [ga4TrafficSources, setGa4TrafficSources] = useState<{
    channel: string; sessions: number; users: number; conversions: number;
  }[]>([]);
  const [ga4Countries, setGa4Countries] = useState<{
    countryCode: string; country: string; users: number; sessions: number; pageViews: number;
  }[]>([]);
  const [ga4Hourly, setGa4Hourly] = useState<{
    dayOfWeek: number; hour: number; pageViews: number;
  }[]>([]);
  const [ga4Events, setGa4Events] = useState<{
    eventName: string; count: number;
  }[]>([]);
  const [realtimeUsers, setRealtimeUsers] = useState<number | null>(null);

  const daysFilter = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  // ─── Surface dailyGoogleSync last-run (server-truth replacement for
  //     the per-period localStorage flag below). ───────────────────
  const { data: syncLog } = useCollection<{
    id: string;
    type?: string;
    completedAt?: { toDate: () => Date } | string;
    results?: { service: string; status: string; detail?: string }[];
  }>("sync-log", { orderByField: "completedAt", orderDirection: "desc" });

  const syncDescription = useMemo(() => {
    const latest = syncLog.find((s) => s.type === "daily-google-sync");
    if (!latest?.completedAt) {
      return "Real-time website traffic, visitor locations, and page performance";
    }
    const ts =
      typeof latest.completedAt === "object" && "toDate" in latest.completedAt
        ? latest.completedAt.toDate()
        : new Date(latest.completedAt as string);
    const okCount = (latest.results ?? []).filter((r) => r.status === "ok").length;
    const errCount = (latest.results ?? []).filter((r) => r.status === "error").length;
    return `Real-time website traffic — last Google sync ${ts.toLocaleString()} (${okCount} ok${errCount ? `, ${errCount} error` : ""})`;
  }, [syncLog]);

  const handleSyncGA4 = useCallback(async () => {
    setGa4Syncing(true);
    try {
      const [report, realtime] = await Promise.all([
        cloudFetchAnalyticsReport(daysFilter),
        cloudFetchRealtimeAnalytics(),
      ]);
      if (report.success) {
        setGa4Data(report.summary);
        setGa4Daily(report.dailyData || []);
        setGa4TopPages(report.topPages || []);
        setGa4TrafficSources(report.trafficSources || []);
        setGa4Countries(report.countryBreakdown || []);
        setGa4Hourly(report.hourlyBreakdown || []);
        setGa4Events(report.eventBreakdown || []);
      }
      if (realtime.success) {
        setRealtimeUsers(realtime.activeUsers);
      }
    } catch {
      // GA4 not configured — silent fallback
    } finally {
      setGa4Syncing(false);
    }
  }, [daysFilter]);

  // ─── Fetch ─────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalyticsEvents(daysFilter);
      setEvents(data.events);
    } catch (err) {
      console.error("Analytics fetch failed", err);
      setError("Failed to load analytics data.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user, daysFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchAnalytics();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;

    const syncKey = `ga4-last-sync-${daysFilter}`;
    const lastSyncRaw = window.localStorage.getItem(syncKey);
    const lastSync = lastSyncRaw ? Number(lastSyncRaw) : 0;
    const now = Date.now();
    const syncEveryMs = 15 * 60 * 1000;

    if (now - lastSync < syncEveryMs) return;

    const timeoutId = window.setTimeout(() => {
      void handleSyncGA4().finally(() => {
        window.localStorage.setItem(syncKey, String(Date.now()));
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [user, daysFilter, handleSyncGA4]);

  // ─── Filtered events ──────────────────────────────
  const filtered = useMemo(
    () =>
      showAdminPages
        ? events
        : events.filter(
            (e) =>
              !e.page?.startsWith("/admin") && !e.page?.startsWith("/login"),
          ),
    [events, showAdminPages],
  );

  // ─── Computed Data ─────────────────────────────────
  const uniquePages = useMemo(() => {
    const pages = new Set(filtered.map((e) => e.page).filter(Boolean));
    return pages.size;
  }, [filtered]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set(
      filtered
        .map((e) => e.country)
        .filter((c) => c && c !== "Unknown" && c !== "N/A"),
    );
    if (countries.size > 0) return countries.size;
    return ga4Countries.length;
  }, [filtered, ga4Countries]);

  // Time series (events per day) — falls back to GA4 dailyData when Firestore is empty
  const timeSeries = useMemo(() => {
    const buckets: Record<string, number> = {};
    filtered.forEach((e) => {
      const d = new Date(e.timestamp).toISOString().split("T")[0];
      buckets[d] = (buckets[d] || 0) + 1;
    });
    const sorted = Object.entries(buckets).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    if (sorted.length > 0) {
      return sorted.map(([date, value]) => ({
        label: date.slice(5), // MM-DD
        value,
      }));
    }
    // Fallback: GA4 dailyData (date is YYYYMMDD)
    return [...ga4Daily]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        label: `${d.date.slice(4, 6)}-${d.date.slice(6, 8)}`,
        value: d.pageViews,
      }));
  }, [filtered, ga4Daily]);

  // Event type breakdown — falls back to GA4 eventBreakdown when Firestore is empty
  const eventTypeBreakdown = useMemo(() => {
    const colors = [
      "var(--chart-1)", "var(--chart-7)", "var(--chart-2)", "var(--chart-8)", "var(--chart-3)",
      "var(--chart-4)", "var(--chart-5)", "var(--chart-6)",
    ];
    const acc: Record<string, number> = {};
    filtered.forEach((e) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1;
    });
    if (Object.keys(acc).length > 0) {
      return Object.entries(acc)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count], i) => ({
          label: getEventLabel(type).label,
          value: count,
          color: colors[i % colors.length],
        }));
    }
    // GA4 fallback (event names like page_view, session_start, scroll, etc.)
    return ga4Events
      .slice(0, 8)
      .map((e, i) => ({
        label: getEventLabel(e.eventName).label,
        value: e.count,
        color: colors[i % colors.length],
      }));
  }, [filtered, ga4Events]);

  // Top pages — falls back to GA4 topPages when Firestore is empty
  const topPages = useMemo(() => {
    const acc: Record<string, number> = {};
    filtered.forEach((e) => {
      const p = e.page || "/";
      acc[p] = (acc[p] || 0) + 1;
    });
    if (Object.keys(acc).length > 0) {
      const total = filtered.length || 1;
      return Object.entries(acc)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([page, count]) => ({
          label: page,
          value: count,
          pct: Math.round((count / total) * 100),
          color: "var(--chart-1)",
        }));
    }
    // Fallback: GA4 topPages
    const ga4Total = ga4TopPages.reduce((sum, p) => sum + p.pageViews, 0) || 1;
    return ga4TopPages.slice(0, 10).map((p) => ({
      label: p.path,
      value: p.pageViews,
      pct: Math.round((p.pageViews / ga4Total) * 100),
      color: "var(--chart-1)",
    }));
  }, [filtered, ga4TopPages]);

  // Country data — falls back to GA4 countryBreakdown when Firestore is empty
  const countryData = useMemo(() => {
    const acc: Record<string, number> = {};
    filtered.forEach((e) => {
      if (e.country && e.country !== "Unknown" && e.country !== "N/A") {
        acc[e.country] = (acc[e.country] || 0) + 1;
      }
    });
    if (Object.keys(acc).length > 0) {
      return Object.entries(acc)
        .sort((a, b) => b[1] - a[1])
        .map(([code, count]) => ({
          countryCode: code,
          country: getCountryName(code),
          count,
        }));
    }
    return ga4Countries.map((c) => ({
      countryCode: c.countryCode,
      country: getCountryName(c.countryCode) || c.country || c.countryCode,
      count: c.users,
    }));
  }, [filtered, ga4Countries]);

  // Sorted events for table
  const sortedEvents = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "timestamp") {
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === "eventType") {
        cmp = a.eventType.localeCompare(b.eventType);
      } else if (sortField === "page") {
        cmp = (a.page || "").localeCompare(b.page || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // ─── Render ────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Analytics"
        description={syncDescription}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 justify-end w-full sm:w-auto">
              <label className="flex items-center gap-1.5 text-xs text-gray-50">
                <input
                  type="checkbox"
                  checked={showAdminPages}
                  onChange={(e) => setShowAdminPages(e.target.checked)}
                  className="rounded border-border"
                />
                Admin pages
              </label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(["7d", "30d", "90d"] as const).map((p) => (
                  <button
                    key={p}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      period === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-10 text-gray-60 hover:bg-gray-20"
                    }`}
                    onClick={() => setPeriod(p)}
                  >
                    {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchAnalytics}
                className="p-1.5 rounded-md hover:bg-gray-10 text-gray-50 transition-colors"
                title="Refresh"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4" />
                  <path d="M12 1v3h3M4 12v3H1" />
                </svg>
              </button>
              <Button variant="outline" size="sm" onClick={handleSyncGA4} isLoading={ga4Syncing} className="hidden sm:inline-flex">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                Sync GA4
              </Button>
            </div>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg border border-warning-soft-line bg-warning-soft p-4 text-sm text-warning-text">
          {error}
        </div>
      )}

      {/* Tabs */}
      <AdminTabs
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "traffic", label: "Traffic & Maps" },
          { value: "pages", label: "Page Performance" },
          { value: "activity", label: "Recent Activity" },
        ]}
        defaultValue={activeTab}
        onChange={setActiveTab}
      />

      {/* ─── Overview Tab ─────────────────────────────── */}
      {activeTab === "overview" && (
        <>
          {/* Google Analytics 4 KPI Row — single source of truth */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            <span className="text-sm font-medium text-primary">Google Analytics 4</span>
            <span className="text-xs text-gray-50">· last {daysFilter}d</span>
            {realtimeUsers !== null && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-primary">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {realtimeUsers} active now
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Users"
              value={(ga4Data?.totalUsers ?? 0).toLocaleString()}
              badge={ga4Data ? `${ga4Data.totalNewUsers.toLocaleString()} new` : `${daysFilter}d`}
            />
            <StatCard
              label="Page Views"
              value={(ga4Data?.totalPageViews ?? 0).toLocaleString()}
              badge={ga4Data ? `${ga4Data.totalSessions.toLocaleString()} sessions` : `${daysFilter}d`}
            />
            <StatCard
              label="Bounce Rate"
              value={ga4Data ? `${(ga4Data.avgBounceRate * 100).toFixed(1)}%` : "0%"}
              badge={ga4Data ? `${Math.round(ga4Data.avgSessionDuration)}s avg` : "—"}
            />
            <StatCard
              label="Conversions"
              value={(ga4Data?.totalConversions ?? 0).toLocaleString()}
              badge={`${uniqueCountries} countries`}
            />
          </div>

          {/* Traffic Trend + Event Types */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <DashboardSection title="Traffic Over Time" className="lg:col-span-2">
              {timeSeries.length > 1 ? (
                <AreaChart data={timeSeries} color="var(--primary)" height={140} />
              ) : (
                <p className="text-sm text-gray-50 text-center py-8">
                  Not enough data to chart
                </p>
              )}
            </DashboardSection>

            <DashboardSection title="Event Types">
              {eventTypeBreakdown.length > 0 ? (
                <DonutWithLegend
                  segments={eventTypeBreakdown.slice(0, 6)}
                  centerValue={(
                    filtered.length ||
                    eventTypeBreakdown.reduce((s, e) => s + e.value, 0)
                  ).toLocaleString()}
                />
              ) : (
                <p className="text-sm text-gray-50 text-center py-8">
                  No events yet
                </p>
              )}
            </DashboardSection>
          </div>

          {/* Top Pages + Conversion Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DashboardSection title="Top Pages">
              {topPages.length > 0 ? (
                <HorizontalBar data={topPages} />
              ) : (
                <p className="text-sm text-gray-50 text-center py-8">
                  No page data yet
                </p>
              )}
            </DashboardSection>

            <DashboardSection title="Conversion Funnel">
              <ConversionFunnel
                events={filtered}
                totalEvents={filtered.length}
                ga4TopPages={ga4TopPages}
              />
            </DashboardSection>
          </div>
        </>
      )}

      {/* ─── Traffic & Maps Tab ───────────────────────── */}
      {activeTab === "traffic" && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Countries"
              value={uniqueCountries.toString()}
              badge="unique"
            />
            <StatCard
              label="Top Country"
              value={countryData[0]?.country || "N/A"}
              badge={countryData[0] ? `${countryData[0].count} events` : ""}
            />
            <StatCard
              label="Sessions"
              value={(ga4Data?.totalSessions ?? 0).toLocaleString()}
              badge={`${daysFilter}d (GA4)`}
            />
            <StatCard
              label="Page Views"
              value={(ga4Data?.totalPageViews ?? 0).toLocaleString()}
              badge={`${ga4TopPages.length || uniquePages} pages`}
            />
          </div>

          <DashboardSection title="Visitor Locations">
            <WorldMap countryData={countryData} />
          </DashboardSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DashboardSection title="Traffic by Country">
              <CountryMap
                countryData={countryData}
              />
            </DashboardSection>

            <DashboardSection title="Peak Hours">
              <PeakHoursHeatmap events={filtered} ga4Hourly={ga4Hourly} />
            </DashboardSection>
          </div>

          {/* Traffic Sources (channel breakdown from GA4) */}
          {ga4TrafficSources.length > 0 && (
            <DashboardSection title="Traffic Sources">
              <div className="overflow-x-auto -mx-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-10">
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider">
                        Channel
                      </th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider">
                        Conversions
                      </th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider w-40">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const total = ga4TrafficSources.reduce((s, r) => s + r.sessions, 0) || 1;
                      return ga4TrafficSources.map((src) => {
                        const pct = Math.round((src.sessions / total) * 100);
                        return (
                          <tr
                            key={src.channel}
                            className="border-b border-gray-10 last:border-0 hover:bg-gray-10/50 transition-colors"
                          >
                            <td className="px-4 py-2.5 text-gray-80 font-medium">
                              {src.channel || "(unassigned)"}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-gray-90">
                              {src.sessions.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-70">
                              {src.users.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right text-gray-70">
                              {src.conversions.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="h-2 bg-gray-10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.max(pct, 3)}%`,
                                    backgroundColor: "var(--chart-1)",
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </DashboardSection>
          )}
        </>
      )}

      {/* ─── Page Performance Tab ─────────────────────── */}
      {activeTab === "pages" && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Unique Pages"
              value={(ga4TopPages.length || uniquePages || 0).toString()}
              badge="tracked (GA4)"
            />
            <StatCard
              label="Most Visited"
              value={topPages[0]?.label || "/"}
              badge={topPages[0] ? `${topPages[0].value} views` : ""}
            />
            <StatCard
              label="Avg Views/Page"
              value={(() => {
                if (ga4TopPages.length > 0 && ga4Data) return Math.round(ga4Data.totalPageViews / ga4TopPages.length).toString();
                if (uniquePages > 0) return Math.round(filtered.length / uniquePages).toString();
                return "0";
              })()}
              badge="per page"
            />
            <StatCard
              label="Conversions"
              value={(ga4Data?.totalConversions ?? 0).toLocaleString()}
              badge="GA4"
            />
          </div>

          <DashboardSection title="Page Performance">
            {topPages.length > 0 ? (
              <div className="overflow-x-auto -mx-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-10">
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider">
                        Events
                      </th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider">
                        Share
                      </th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider w-40">
                        Distribution
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((p) => (
                      <tr
                        key={p.label}
                        className="border-b border-gray-10 last:border-0 hover:bg-gray-10/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-gray-80 font-medium">
                          {p.label}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-90">
                          {p.value}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-50">
                          {p.pct}%
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="h-2 bg-gray-10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(p.pct, 3)}%`,
                                backgroundColor: p.color,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-50 text-center py-8">
                No page data yet
              </p>
            )}
          </DashboardSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DashboardSection title="Event Breakdown">
              {eventTypeBreakdown.length > 0 ? (
                <DonutWithLegend
                  segments={eventTypeBreakdown}
                  centerValue={(
                    filtered.length ||
                    eventTypeBreakdown.reduce((s, e) => s + e.value, 0)
                  ).toLocaleString()}
                />
              ) : (
                <p className="text-sm text-gray-50 text-center py-8">
                  No events
                </p>
              )}
            </DashboardSection>

            <DashboardSection title="Conversion Funnel">
              <ConversionFunnel
                events={filtered}
                totalEvents={filtered.length}
                ga4TopPages={ga4TopPages}
              />
            </DashboardSection>
          </div>
        </>
      )}

      {/* ─── Recent Activity Tab ──────────────────────── */}
      {activeTab === "activity" && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Page Views"
              value={(ga4Data?.totalPageViews ?? 0).toLocaleString()}
              badge="GA4"
            />
            <StatCard
              label="New Users"
              value={(ga4Data?.totalNewUsers ?? 0).toLocaleString()}
              badge={ga4Data ? `${ga4Data.totalUsers.toLocaleString()} total` : "GA4"}
            />
            <StatCard
              label="Countries"
              value={uniqueCountries.toString()}
              badge="unique"
            />
            <StatCard
              label="Sessions"
              value={(ga4Data?.totalSessions ?? 0).toLocaleString()}
              badge="GA4 sessions"
            />
          </div>

          <DashboardSection title="Event Log">
            <div className="overflow-x-auto -mx-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-10">
                    {[
                      { key: "timestamp" as const, label: "Time" },
                      { key: "eventType" as const, label: "Event" },
                      { key: "page" as const, label: "Page" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        className="text-left px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider cursor-pointer hover:text-gray-80 select-none"
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.label}{" "}
                        {sortField === col.key && (
                          <span className="text-primary">
                            {sortDir === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </th>
                    ))}
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-50 uppercase tracking-wider">
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.slice(0, 100).map((ev) => {
                    const info = getEventLabel(ev.eventType);
                    return (
                      <tr
                        key={ev.id}
                        className="border-b border-gray-10 last:border-0 hover:bg-gray-10/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedEvent(ev)}
                      >
                        <td className="px-4 py-2 text-gray-60 whitespace-nowrap">
                          {new Date(ev.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1">
                            <span>{info.icon}</span>
                            <span className="text-gray-80">{info.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-70 font-medium">
                          {ev.page || "/"}
                        </td>
                        <td className="px-4 py-2 text-gray-50 text-xs">
                          {ev.city && ev.city !== "Unknown"
                            ? `${ev.city}, `
                            : ""}
                          {getCountryName(ev.country)}
                        </td>
                      </tr>
                    );
                  })}
                  {sortedEvents.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-50">
                        No events recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {sortedEvents.length > 100 && (
              <p className="text-xs text-gray-50 text-center mt-3">
                Showing 100 of {sortedEvents.length} events
              </p>
            )}
          </DashboardSection>
        </>
      )}

      {/* ─── Event Detail Modal ───────────────────────── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-card rounded-xl shadow-xl border border-border w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-10">
              <h3 className="text-base font-semibold text-gray-90">
                Event Details
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-md hover:bg-gray-10 text-gray-50"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto space-y-3 text-sm">
              {[
                { label: "Event Type", value: getEventLabel(selectedEvent.eventType).icon + " " + getEventLabel(selectedEvent.eventType).label },
                { label: "Page", value: selectedEvent.page || "/" },
                { label: "Timestamp", value: new Date(selectedEvent.timestamp).toLocaleString() },
                { label: "Session ID", value: selectedEvent.sessionId || "—" },
                { label: "Country", value: getCountryName(selectedEvent.country) },
                { label: "Region", value: selectedEvent.region || "—" },
                { label: "City", value: selectedEvent.city || "—" },
                { label: "Timezone", value: selectedEvent.timezone || "—" },
                { label: "Coordinates", value: selectedEvent.latitude && selectedEvent.longitude ? `${selectedEvent.latitude}, ${selectedEvent.longitude}` : "—" },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between">
                  <span className="text-gray-50 shrink-0">{row.label}</span>
                  <span className="text-gray-90 font-medium text-right ml-4 break-all">
                    {row.value}
                  </span>
                </div>
              ))}
              {selectedEvent.eventData &&
                Object.keys(selectedEvent.eventData).length > 0 && (
                  <div>
                    <span className="text-gray-50 block mb-1">Event Data</span>
                    <pre className="bg-gray-10 rounded-lg p-3 text-xs text-gray-80 overflow-x-auto">
                      {JSON.stringify(selectedEvent.eventData, null, 2)}
                    </pre>
                  </div>
                )}
              {selectedEvent.metadata &&
                Object.keys(selectedEvent.metadata).length > 0 && (
                  <div>
                    <span className="text-gray-50 block mb-1">Metadata</span>
                    <pre className="bg-gray-10 rounded-lg p-3 text-xs text-gray-80 overflow-x-auto">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
