"use client";

import { useState, useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import { useScheduledReports } from "@/hooks/useScheduledReports";
import {
  PageHeader,
  DataTable,
  Modal,
  AdminTabs,
  StatCard,
  AIPromptButton,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import {
  ReportCategoryCard,
  ScheduledReportCard,
  InsightCard,
  BusinessPulse,
} from "@/components/admin/report-categories";
import { Button, Input } from "@/components/ui";
import type { AIReport, AIReportType, AIInsight } from "@/lib/types/content";
import type { Lead, Customer, Task, Project, Contact, Booking } from "@/lib/types/crm";
import type {
  BlogPost,
  SEOKeyword,
  SEOAudit,
  Campaign,
  SocialPost,
  EmailDraft,
  LandingPage,
} from "@/lib/types/content";
import type { AllCollections } from "@/lib/utils/ai-data-context";
import {
  buildFullContext,
  buildSalesContext,
  buildSEOContext,
  buildMarketingContext,
  buildOperationsContext,
} from "@/lib/utils/ai-data-context";
import { lazyGenerateText } from "@/lib/firebase/ai-lazy";
import { cloudExportToSheets, cloudGenerateReportSheet, cloudUploadReportToDrive } from "@/lib/firebase/cloud-functions";

// ─── On-Demand Category Definitions ──────────────────

interface CategoryDef {
  id: AIReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  contextBuilder: (data: AllCollections) => string;
  promptTemplate: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "performance",
    title: "Performance Deep Dive",
    description: "Full business health analysis — pipeline, revenue, velocity, gaps",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    contextBuilder: buildFullContext,
    promptTemplate: `Produce a comprehensive performance deep-dive for CreedaVA. Analyze all data holistically: pipeline health, conversion funnel, revenue trends, task completion velocity, content output, marketing ROI. Identify the top 3 strengths and top 3 weaknesses. Provide a score 0-100 and 5 specific, actionable recommendations.`,
  },
  {
    id: "seo",
    title: "SEO & Content Audit",
    description: "Content gaps, keyword opportunities, page performance",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    contextBuilder: buildSEOContext,
    promptTemplate: `Perform an SEO & Content audit for CreedaVA. Analyze: blog content gaps, keyword coverage, keyword difficulty distribution, search intent alignment, landing page conversion potential. Identify missing content topics, underperforming keywords, and content refresh opportunities. Score 0-100.`,
  },
  {
    id: "pipeline",
    title: "Sales Pipeline",
    description: "Lead flow, conversion rates, bottlenecks, forecasting",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    contextBuilder: buildSalesContext,
    promptTemplate: `Analyze the CreedaVA sales pipeline. Cover: lead volume by source, conversion rate per stage, average deal value, pipeline velocity (time in each stage), win/loss analysis, booking-to-customer conversion. Identify bottlenecks and recommend 5 improvements. Score 0-100.`,
  },
  {
    id: "competitor",
    title: "Competitive Positioning",
    description: "Strategic positioning, market gaps, differentiation analysis",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    contextBuilder: buildFullContext,
    promptTemplate: `Based on CreedaVA&apos;s current data (service offerings, content, marketing channels, pricing), provide a competitive positioning analysis for the virtual assistant services market. Cover: strengths vs typical VA companies, market differentiation opportunities, service gaps, content strategy vs industry best practices, pricing positioning. Recommend 5 strategic moves. Score 0-100.`,
  },
  {
    id: "operational",
    title: "Operational Efficiency",
    description: "Task throughput, project delivery, team productivity",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    contextBuilder: buildOperationsContext,
    promptTemplate: `Analyze CreedaVA&apos;s operational efficiency. Examine: task completion rates, overdue percentages, priority distribution, project delivery timelines, booking fulfillment rates. Identify workflow bottlenecks, resource allocation issues, and productivity patterns. Recommend 5 operational improvements. Score 0-100.`,
  },
  {
    id: "marketing",
    title: "Marketing ROI",
    description: "Campaign performance, channel effectiveness, spend analysis",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    ),
    contextBuilder: buildMarketingContext,
    promptTemplate: `Analyze CreedaVA&apos;s marketing ROI across all channels. Cover: campaign budget vs spend vs conversions, platform performance comparison, social media content output and engagement patterns, email campaign effectiveness, landing page conversion rates. Calculate cost-per-lead and cost-per-conversion where possible. Recommend 5 optimizations. Score 0-100.`,
  },
];

// ─── Helper: format Firestore date ───────────────────

function formatDate(d: unknown): string {
  if (!d) return "—";
  const date = typeof d === "object" && d !== null && "toDate" in d
    ? (d as { toDate: () => Date }).toDate()
    : new Date(d as string);
  return date.toLocaleDateString();
}

function formatDateTime(d: unknown): string {
  if (!d) return "";
  const date = typeof d === "object" && d !== null && "toDate" in d
    ? (d as { toDate: () => Date }).toDate()
    : new Date(d as string);
  return date.toLocaleString();
}

// ─── Page ────────────────────────────────────────────

export default function AIReportsDashboard() {
  // ─── Load ALL collections ──────────────────────────
  const { data: reports, loading: reportsLoading, add, edit: editReport, del } = useCollection<AIReport>("reports", { orderByField: "createdAt" });
  const { data: insights, add: addInsight, edit: editInsight } = useCollection<AIInsight>("ai-insights", { orderByField: "createdAt" });
  const { data: leads } = useCollection<Lead>("leads");
  const { data: customers } = useCollection<Customer>("customers");
  const { data: tasks } = useCollection<Task>("tasks");
  const { data: projects } = useCollection<Project>("projects");
  const { data: contacts } = useCollection<Contact>("contacts");
  const { data: bookings } = useCollection<Booking>("bookings");
  const { data: campaigns } = useCollection<Campaign>("campaigns");
  const { data: socialPosts } = useCollection<SocialPost>("social-posts");
  const { data: emails } = useCollection<EmailDraft>("emails");
  const { data: blog } = useCollection<BlogPost>("blog");
  const { data: keywords } = useCollection<SEOKeyword>("keywords");
  const { data: seoAudits } = useCollection<SEOAudit>("seo");
  const { data: landingPages } = useCollection<LandingPage>("landing-pages");

  const { toast } = useToast();

  // ─── All data bundle ──────────────────────────────
  const allData: AllCollections = useMemo(() => ({
    leads, customers, tasks, projects, contacts, bookings,
    campaigns, socialPosts, emails, blog, keywords, seoAudits, landingPages,
  }), [leads, customers, tasks, projects, contacts, bookings, campaigns, socialPosts, emails, blog, keywords, seoAudits, landingPages]);

  // ─── Scheduler ─────────────────────────────────────
  const { schedules, isGenerating: schedulerGenerating, generateReport } = useScheduledReports();

  // ─── UI state ──────────────────────────────────────
  const [tab, setTab] = useState("overview");
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<AIReport | null>(null);
  const [categoryGenerating, setCategoryGenerating] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", summaryHtml: "", highlights: [] as string[], recommendations: [] as string[] });

  async function handleExportToSheets(collection: "leads" | "customers" | "contacts" | "bookings" | "tasks" | "campaigns" | "blog") {
    setExporting(true);
    try {
      const result = await cloudExportToSheets(collection);
      if (result.success) {
        toast(`Exported ${result.rowCount} rows to Google Sheets`, "success");
        window.open(result.spreadsheetUrl, "_blank");
      } else {
        toast("Export failed — check Sheets integration", "error");
      }
    } catch {
      toast("Failed — ensure Google Sheets is configured in Settings → Integrations", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleGenerateReportSheet() {
    setExporting(true);
    try {
      const result = await cloudGenerateReportSheet();
      if (result.success) {
        toast(`Report "${result.sheetTitle}" created in Google Sheets`, "success");
        window.open(result.spreadsheetUrl, "_blank");
      } else {
        toast("Failed to generate report sheet", "error");
      }
    } catch {
      toast("Failed — ensure Google Sheets is configured in Settings → Integrations", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleUploadReportToDrive(report: AIReport) {
    setUploading(true);
    try {
      const content = btoa(unescape(encodeURIComponent(
        `# ${report.title}\n\nType: ${report.type}\nGenerated: ${report.createdAt}\nScore: ${report.score ?? "N/A"}\n\n${report.summaryHtml}\n\n## Recommendations\n${(report.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      )));
      const result = await cloudUploadReportToDrive(
        `${report.title.replace(/[^a-zA-Z0-9 ]/g, "")}.md`,
        content,
        "text/markdown",
      );
      if (result.success) {
        toast("Report uploaded to Google Drive", "success");
        window.open(result.webLink, "_blank");
      } else {
        toast("Upload failed", "error");
      }
    } catch {
      toast("Failed — ensure Google Drive is configured in Settings → Integrations", "error");
    } finally {
      setUploading(false);
    }
  }

  // ─── Derived stats ────────────────────────────────
  const latestScore = useMemo(() => {
    const scored = reports.filter((r) => r.score !== undefined);
    return scored.length > 0 ? scored[0].score! : null;
  }, [reports]);

  const totalCollections = useMemo(() => {
    return Object.values(allData).filter((arr) => arr && arr.length > 0).length;
  }, [allData]);

  const activeInsights = useMemo(
    () => insights.filter((i) => !i.dismissed),
    [insights],
  );

  // ─── Handlers ──────────────────────────────────────

  async function handleAiResult(text: string) {
    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const result = JSON.parse(cleaned);
      const saved = {
        title: result.title || "AI Report",
        type: "custom" as AIReportType,
        category: "on-demand" as const,
        summaryHtml: result.summaryHtml || result.summary || text,
        highlights: result.highlights || [],
        recommendations: result.recommendations || [],
        score: result.score,
        area: "general",
      };
      await add(saved);
      toast("Report generated!", "success");
    } catch {
      await add({
        title: "AI Report",
        type: "custom" as AIReportType,
        category: "on-demand" as const,
        summaryHtml: text,
        highlights: [],
        recommendations: [],
        area: "general",
      });
      toast("Report generated!", "success");
    }
  }

  async function handleCategoryGenerate(cat: CategoryDef) {
    setCategoryGenerating(cat.id);
    try {
      const context = cat.contextBuilder(allData);
      const prompt = `You are a senior business analyst for CreedaVA (virtual assistant services).
${cat.promptTemplate}

RESPOND WITH VALID JSON ONLY — no markdown fences, no extra text.
JSON shape: { "title": "string", "summaryHtml": "HTML string (2-4 paragraphs)", "highlights": ["3-5 items"], "recommendations": ["3-5 items"], "score": number 0-100 }

Business data:
${context}`;

      const raw = await lazyGenerateText(prompt);
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { title: cat.title, summaryHtml: raw, highlights: [], recommendations: [] };
      }

      await add({
        title: (parsed.title as string) || `${cat.title} — ${new Date().toLocaleDateString()}`,
        type: cat.id,
        category: "on-demand" as const,
        summaryHtml: (parsed.summaryHtml as string) || (parsed.summary as string) || raw,
        highlights: (parsed.highlights as string[]) || [],
        recommendations: (parsed.recommendations as string[]) || [],
        score: parsed.score as number | undefined,
        dataSources: Object.keys(allData).filter(
          (k) => (allData[k as keyof AllCollections] as unknown[])?.length > 0,
        ),
        area: cat.id,
      });

      // Extract insights from recommendations
      const recs = (parsed.recommendations as string[]) || [];
      for (const rec of recs.slice(0, 3)) {
        await addInsight({
          title: rec.slice(0, 80),
          description: rec,
          area: cat.id === "seo" ? "seo" : cat.id === "pipeline" ? "sales" : cat.id === "marketing" ? "marketing" : cat.id === "operational" ? "operations" : "general",
          severity: "info",
          sourceReport: cat.id,
        });
      }

      toast(`${cat.title} complete!`, "success");
    } catch (err) {
      console.error(`${cat.title} generation failed:`, err);
      toast(`${cat.title} failed — try again`, "error");
    } finally {
      setCategoryGenerating(null);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Report deleted");
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openDetail(report: AIReport) {
    setSelected(report);
    setEditForm({
      title: report.title || "",
      summaryHtml: report.summaryHtml || "",
      highlights: [...(report.highlights || [])],
      recommendations: [...(report.recommendations || [])],
    });
    setDetailOpen(true);
  }

  async function handleSaveReport() {
    if (!selected) return;
    setSaving(true);
    try {
      await editReport(selected.id, {
        title: editForm.title,
        summaryHtml: editForm.summaryHtml,
        highlights: editForm.highlights,
        recommendations: editForm.recommendations,
      });
      toast("Report updated");
    } catch {
      toast("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  // ─── Table columns ────────────────────────────────

  const columns: Column<AIReport>[] = [
    {
      key: "title",
      header: "Report",
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-gray-90">{r.title}</p>
          {r.area && (
            <p className="text-[10px] text-gray-40 capitalize mt-0.5">{r.area}</p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <span className="text-xs capitalize bg-gray-10 text-gray-60 px-2 py-0.5 rounded">
          {r.type}
        </span>
      ),
    },
    {
      key: "score" as keyof AIReport,
      header: "Score",
      render: (r) =>
        r.score !== undefined ? (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              r.score >= 70 ? "text-emerald-700 bg-emerald-50" : r.score >= 40 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"
            }`}
          >
            {r.score}/100
          </span>
        ) : (
          <span className="text-xs text-gray-30">—</span>
        ),
    },
    {
      key: "highlights",
      header: "Items",
      render: (r) => (
        <span className="text-sm text-gray-60">{(r.highlights?.length || 0) + (r.recommendations?.length || 0)}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Generated",
      render: (r) => (
        <span className="text-xs text-gray-40">{formatDate(r.createdAt)}</span>
      ),
    },
  ];

  // ─── Tabs config ───────────────────────────────────

  const tabs = [
    { label: "Overview", value: "overview" },
    { label: "Scheduled", value: "scheduled", badge: schedules.filter((s) => s.isStale).length || undefined },
    { label: "On-Demand", value: "on-demand" },
    { label: "Insights", value: "insights", badge: activeInsights.length || undefined },
    { label: "History", value: "history", badge: reports.length || undefined },
  ];

  // ─── Loading state ─────────────────────────────────

  if (reportsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Dashboard"
        description="AI-powered business intelligence — reports, insights, and recommendations"
        actions={
          <div className="flex items-center gap-2">
          <AIPromptButton
            section="AI Dashboard"
            description="Ask AI anything about your business data"
            placeholder="e.g. What are my biggest revenue risks? Which leads should I prioritize?"
            presets={[
              { label: "Full Analysis", prompt: "Generate a comprehensive business health analysis. Cover all areas: sales pipeline, revenue, marketing, SEO, operations. Format as JSON with title, summaryHtml (HTML), highlights (array), recommendations (array), score (0-100)." },
              { label: "Quick Pulse", prompt: "Give me a quick business pulse. What are the 3 most important things I should know right now? Format as JSON with title, summaryHtml (HTML), highlights (array), recommendations (array)." },
              { label: "Risk Assessment", prompt: "Identify the top business risks and vulnerabilities. Check for: stale leads, overdue tasks, low conversion rates, content gaps, marketing spend inefficiency. Format as JSON with title, summaryHtml (HTML), highlights (array), recommendations (array), score (0-100)." },
            ]}
            dataContext={buildFullContext(allData)}
            buildPrompt={(input, ctx) =>
              `You are a senior business analyst for CreedaVA (virtual assistant services).\n${input}\n\nBusiness data:\n${ctx}\n\nReturn valid JSON: { "title": "string", "summaryHtml": "HTML string", "highlights": ["string array"], "recommendations": ["string array"], "score": number 0-100 }. Use actual data.`
            }
            onResult={handleAiResult}
          />
          <div className="relative group">
            <Button variant="outline" size="sm" isLoading={exporting}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
              Export to Sheets
            </Button>
            <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover:block w-48 rounded-lg border border-border bg-white shadow-lg py-1">
              {(["leads", "customers", "contacts", "bookings", "tasks", "campaigns", "blog"] as const).map((c) => (
                <button key={c} className="w-full text-left px-3 py-1.5 text-sm text-gray-70 hover:bg-gray-10 capitalize" onClick={() => handleExportToSheets(c)}>
                  {c}
                </button>
              ))}
              <hr className="my-1 border-border" />
              <button className="w-full text-left px-3 py-1.5 text-sm text-primary font-medium hover:bg-gray-10" onClick={handleGenerateReportSheet}>
                Weekly Report
              </button>
            </div>
          </div>
          </div>
        }
      />

      <AdminTabs tabs={tabs} defaultValue="overview" onChange={setTab} />

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Health Score"
              value={latestScore !== null ? `${latestScore}/100` : "—"}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />
            <StatCard
              label="Reports Generated"
              value={reports.length}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              }
            />
            <StatCard
              label="Active Insights"
              value={activeInsights.length}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              }
            />
            <StatCard
              label="Data Sources"
              value={`${totalCollections} collections`}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              }
            />
          </div>

          {/* Two-column: Pulse + Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Business Pulse */}
            <BusinessPulse
              score={latestScore}
              areas={[
                { label: "Sales", value: leads.length > 0 ? Math.round((leads.filter((l) => l.status === "won").length / leads.length) * 100) : 0 },
                { label: "Operations", value: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0 },
                { label: "Content", value: blog.length > 0 ? Math.round((blog.filter((b) => b.status === "published").length / blog.length) * 100) : 0 },
                { label: "Marketing", value: campaigns.length > 0 ? Math.round((campaigns.filter((c) => c.status === "active" || c.status === "completed").length / campaigns.length) * 100) : 0 },
              ]}
            />

            {/* Recent reports */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-90 mb-4">Recent Reports</h3>
              {reports.length === 0 ? (
                <p className="text-sm text-gray-40 py-8 text-center">No reports yet. Generate one from Scheduled or On-Demand tabs.</p>
              ) : (
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <button
                      key={report.id}
                      onClick={() => openDetail(report)}
                      className="w-full text-left flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/20 hover:bg-gray-10/30 transition-all cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-90 truncate">{report.title}</p>
                        <p className="text-[10px] text-gray-40 mt-0.5">
                          {formatDate(report.createdAt)} · <span className="capitalize">{report.type}</span>
                        </p>
                      </div>
                      {report.score !== undefined && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
                            report.score >= 70 ? "text-emerald-700 bg-emerald-50" : report.score >= 40 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"
                          }`}
                        >
                          {report.score}
                        </span>
                      )}
                      <svg className="w-4 h-4 text-gray-30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top insights */}
          {activeInsights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-90 mb-3">Latest Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeInsights.slice(0, 4).map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onDismiss={() => editInsight(insight.id, { dismissed: true })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ SCHEDULED TAB ═══════ */}
      {tab === "scheduled" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-90">Scheduled Reports</h3>
              <p className="text-xs text-gray-50 mt-0.5">
                Auto-generated on page visit when stale. Click to regenerate manually.
              </p>
            </div>
            {schedulerGenerating && (
              <span className="inline-flex items-center gap-2 text-xs text-primary">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Generating...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map((s) => (
              <ScheduledReportCard
                key={s.period}
                period={s.period}
                lastReport={s.lastReport}
                isStale={s.isStale}
                isGenerating={s.isGenerating}
                onRegenerate={() => generateReport(s.period, allData)}
                onView={(report) => openDetail(report)}
              />
            ))}
          </div>

          {/* Scheduled report history */}
          <div className="rounded-xl border border-border bg-white p-5">
            <h4 className="text-sm font-semibold text-gray-90 mb-3">Scheduled Report History</h4>
            <DataTable
              columns={columns}
              data={reports.filter((r) => r.category === "scheduled" || ["daily", "weekly", "monthly"].includes(r.type))}
              keyExtractor={(r) => r.id}
              onRowClick={(r) => openDetail(r)}
              emptyMessage="No scheduled reports yet"
            />
          </div>
        </div>
      )}

      {/* ═══════ ON-DEMAND TAB ═══════ */}
      {tab === "on-demand" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-90">On-Demand Analysis</h3>
            <p className="text-xs text-gray-50 mt-0.5">
              Run targeted analyses. AI scans your data and produces reports with scores and recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <ReportCategoryCard
                key={cat.id}
                icon={cat.icon}
                title={cat.title}
                description={cat.description}
                lastRun={reports.find((r) => r.type === cat.id) || null}
                onGenerate={() => handleCategoryGenerate(cat)}
                generating={categoryGenerating === cat.id}
              />
            ))}
          </div>

          {/* On-demand history */}
          <div className="rounded-xl border border-border bg-white p-5">
            <h4 className="text-sm font-semibold text-gray-90 mb-3">On-Demand Report History</h4>
            <DataTable
              columns={columns}
              data={reports.filter((r) => r.category === "on-demand" || !["daily", "weekly", "monthly"].includes(r.type))}
              keyExtractor={(r) => r.id}
              onRowClick={(r) => openDetail(r)}
              emptyMessage="No on-demand reports yet — run an analysis above"
            />
          </div>
        </div>
      )}

      {/* ═══════ INSIGHTS TAB ═══════ */}
      {tab === "insights" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-90">AI Insights Feed</h3>
              <p className="text-xs text-gray-50 mt-0.5">
                Recommendations and observations from AI analyses. Pin important ones, dismiss resolved ones.
              </p>
            </div>
            <span className="text-xs text-gray-40">{activeInsights.length} active</span>
          </div>

          {insights.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-gray-20 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <p className="text-sm text-gray-40">No insights yet</p>
              <p className="text-xs text-gray-30 mt-1">Run an analysis from the On-Demand tab to generate insights</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights
                .filter((i) => !i.dismissed)
                .map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onPin={() => editInsight(insight.id, { pinned: !insight.pinned })}
                    onDismiss={() => editInsight(insight.id, { dismissed: true })}
                  />
                ))}

              {/* Dismissed section */}
              {insights.filter((i) => i.dismissed).length > 0 && (
                <details className="mt-6">
                  <summary className="text-xs text-gray-40 cursor-pointer hover:text-gray-60 transition-colors">
                    {insights.filter((i) => i.dismissed).length} dismissed insights
                  </summary>
                  <div className="space-y-2 mt-3">
                    {insights
                      .filter((i) => i.dismissed)
                      .map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onDismiss={() => editInsight(insight.id, { dismissed: false })}
                        />
                      ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════ HISTORY TAB ═══════ */}
      {tab === "history" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-90">All Reports</h3>
            <p className="text-xs text-gray-50 mt-0.5">
              Complete history of all AI-generated reports
            </p>
          </div>

          <DataTable
            columns={columns}
            data={reports}
            keyExtractor={(r) => r.id}
            onRowClick={(r) => openDetail(r)}
            emptyMessage="No reports yet — generate one from your CRM data"
          />
        </div>
      )}

      {/* ═══════ DETAIL / EDIT MODAL ═══════ */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected ? `Edit: ${editForm.title || "Report"}` : "Report"}
        size="lg"
        footer={
          <>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            {selected && (
              <Button variant="outline" size="sm" onClick={() => handleUploadReportToDrive(selected)} isLoading={uploading}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                Save to Drive
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveReport} isLoading={saving}>
              Update
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            {/* Meta badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs capitalize bg-gray-10 text-gray-60 px-2 py-0.5 rounded">
                {selected.type}
              </span>
              {selected.category && (
                <span className="text-xs capitalize bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {selected.category}
                </span>
              )}
              {selected.score !== undefined && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    selected.score >= 70 ? "text-emerald-700 bg-emerald-50" : selected.score >= 40 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"
                  }`}
                >
                  Score: {selected.score}/100
                </span>
              )}
              <span className="text-xs text-gray-40">
                {formatDateTime(selected.createdAt)}
              </span>
            </div>

            {/* Editable title */}
            <Input label="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />

            {/* Editable summary */}
            <div>
              <label className="block text-xs font-medium text-gray-50 uppercase tracking-wide mb-2">Summary (HTML)</label>
              <textarea
                className="w-full rounded-lg border border-border px-4 py-3 text-sm text-gray-80 min-h-40 font-mono"
                value={editForm.summaryHtml}
                onChange={(e) => setEditForm({ ...editForm, summaryHtml: e.target.value })}
              />
            </div>

            {/* Editable highlights */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-50 uppercase tracking-wide">Key Highlights</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditForm({ ...editForm, highlights: [...editForm.highlights, ""] })}
                >
                  + Add
                </Button>
              </div>
              <div className="space-y-2">
                {editForm.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-border bg-white px-3 py-1.5 text-sm text-gray-80"
                      value={h}
                      onChange={(e) => {
                        const updated = [...editForm.highlights];
                        updated[i] = e.target.value;
                        setEditForm({ ...editForm, highlights: updated });
                      }}
                    />
                    <button
                      className="text-gray-30 hover:text-red-500 transition-colors"
                      onClick={() => setEditForm({ ...editForm, highlights: editForm.highlights.filter((_, j) => j !== i) })}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Editable recommendations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-50 uppercase tracking-wide">Recommendations</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditForm({ ...editForm, recommendations: [...editForm.recommendations, ""] })}
                >
                  + Add
                </Button>
              </div>
              <div className="space-y-2">
                {editForm.recommendations.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-border bg-white px-3 py-1.5 text-sm text-gray-80"
                      value={r}
                      onChange={(e) => {
                        const updated = [...editForm.recommendations];
                        updated[i] = e.target.value;
                        setEditForm({ ...editForm, recommendations: updated });
                      }}
                    />
                    <button
                      className="text-gray-30 hover:text-red-500 transition-colors"
                      onClick={() => setEditForm({ ...editForm, recommendations: editForm.recommendations.filter((_, j) => j !== i) })}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Data sources (read-only) */}
            {selected.dataSources && selected.dataSources.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-50 uppercase tracking-wide mb-2">Data Sources</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.dataSources.map((ds) => (
                    <span key={ds} className="text-[10px] bg-gray-10 text-gray-50 px-2 py-0.5 rounded-full capitalize">
                      {ds}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═══════ DELETE CONFIRM ═══════ */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Report"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-70">
          Delete this report? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
