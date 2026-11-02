"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  Modal,
  AdminTabs,
  DashboardSection,
  StatCard,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { AIPromptButton } from "@/components/admin";
import type { SEOAudit, PageSEO } from "@/lib/types/content";
import { OnPageAuditsList } from "../onpage-audits";
import { parseAiJson } from "@/lib/utils/ai-json";

// ─── Default page SEO values ─────────────────────────
const DEFAULT_PAGES: Omit<PageSEO, "id" | "createdAt" | "updatedAt">[] = [
  { path: "/", title: "CreedaVA — Virtual Assistant Services", description: "Professional virtual assistant services for businesses. Save time, reduce costs, and scale your operations with CreedaVA." },
  { path: "/services", title: "Services", description: "Explore CreedaVA's professional virtual assistant services including administrative support, customer service, social media management, and more." },
  { path: "/about", title: "About", description: "Learn about CreedaVA — a Belize-based virtual assistant agency bridging opportunity and talent for global businesses." },
  { path: "/news", title: "News & Blog", description: "Stay up to date with the latest news, tips, and insights from CreedaVA." },
  { path: "/contact", title: "Contact", description: "Get in touch with CreedaVA. We'd love to hear about your business needs." },
  { path: "/faq", title: "FAQ", description: "Frequently asked questions about CreedaVA's virtual assistant services, pricing, onboarding, and more." },
  { path: "/privacy", title: "Privacy Policy", description: "CreedaVA's privacy policy — how we collect, use, and protect your personal information." },
  { path: "/terms", title: "Terms of Service", description: "CreedaVA's terms of service — the rules and guidelines governing the use of our virtual assistant services." },
];

const severityVariant: Record<string, "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
};

/** Shape returned by the SEO audit prompt (fields are all optional). */
interface AiAudit {
  url?: string;
  score?: number;
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedH1?: string;
  missingElements?: string[];
  issues?: { issue?: string; severity?: string; fix?: string; suggestion?: string }[];
}

/** Normalise an AI audit into the stored shape the UI renders. */
function toAuditInput(
  result: AiAudit,
): Omit<SEOAudit, "id" | "createdAt" | "updatedAt"> {
  return {
    url: result.url || "AI Analysis",
    score: result.score ?? 0,
    suggestedTitle: result.suggestedTitle ?? "",
    suggestedDescription: result.suggestedDescription ?? "",
    suggestedH1: result.suggestedH1 ?? "",
    missingElements: result.missingElements ?? [],
    issues: (result.issues ?? []).map((issue) => ({
      issue: issue.issue ?? "",
      severity:
        issue.severity === "high" || issue.severity === "low" ? issue.severity : "medium",
      // Older prompts returned `suggestion`; the UI reads `fix`.
      fix: issue.fix || issue.suggestion || "",
    })),
  };
}

/**
 * Saved entries can be missing fields (cleared by a repair, or written before
 * a field existed). Drop blanks so the curated defaults fill the gaps instead
 * of rendering `undefined` — `p.description.length` used to crash the table.
 */
function definedOnly(entry: PageSEO): Partial<PageSEO> {
  const defined: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry)) {
    if (value !== undefined && value !== null && value !== "") defined[key] = value;
  }
  return defined as Partial<PageSEO>;
}

export default function SeoContentSection() {
  const { data: seoEntries, loading: seoLoading, add: addSeo, edit: editSeo } = useCollection<PageSEO>("page-seo", {
    orderByField: "path",
  });
  const { data: audits, loading: auditLoading, add: addAudit, del: delAudit } = useCollection<SEOAudit>("seo", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const rawTab = searchParams?.get("tab") ?? "pages";
  const initialTab = rawTab === "audits" ? "audits" : "pages";
  const [tab, setTab] = useState(initialTab);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    id?: string;
    path: string;
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    keywords: string;
    noIndex: boolean;
  }>({ path: "", title: "", description: "", ogTitle: "", ogDescription: "", ogImage: "", keywords: "", noIndex: false });

  // AI Audit state
  const [selected, setSelected] = useState<SEOAudit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loading = seoLoading || auditLoading;

  // Merge Firestore entries with defaults for pages not yet saved
  const mergedPages = useMemo(() => {
    const defaultPaths = new Set(DEFAULT_PAGES.map((d) => d.path));
    const existing = new Map(seoEntries.map((e) => [e.path, e]));
    const pages = DEFAULT_PAGES.map((d) => {
      const saved = existing.get(d.path);
      return saved
        ? { ...d, ...definedOnly(saved), isDefault: false }
        : { ...d, id: `default-${d.path}`, isDefault: true };
    });
    // Include custom Firestore entries whose paths are not in DEFAULT_PAGES
    for (const entry of seoEntries) {
      if (!defaultPaths.has(entry.path)) {
        pages.push({
          ...entry,
          title: entry.title ?? "",
          description: entry.description ?? "",
          isDefault: false,
        });
      }
    }
    return pages;
  }, [seoEntries]);

  const pagesWithSeo = mergedPages.filter((p) => !p.isDefault).length;

  // ─── Page SEO handlers ─────────────────────────────
  function openEdit(page: typeof mergedPages[0]) {
    const entry = seoEntries.find((e) => e.path === page.path);
    setEditForm({
      id: entry?.id,
      path: page.path,
      title: page.title,
      description: page.description,
      ogTitle: (page as PageSEO).ogTitle || "",
      ogDescription: (page as PageSEO).ogDescription || "",
      ogImage: (page as PageSEO).ogImage || "",
      keywords: (page as PageSEO).keywords?.join(", ") || "",
      noIndex: (page as PageSEO).noIndex || false,
    });
    setEditOpen(true);
  }

  function openNewPage() {
    setEditForm({
      id: undefined,
      path: "",
      title: "",
      description: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      keywords: "",
      noIndex: false,
    });
    setEditOpen(true);
  }

  async function handleSaveSeo() {
    const data: Omit<PageSEO, "id" | "createdAt" | "updatedAt"> = {
      path: editForm.path,
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      ogTitle: editForm.ogTitle.trim() || undefined,
      ogDescription: editForm.ogDescription.trim() || undefined,
      ogImage: editForm.ogImage.trim() || undefined,
      keywords: editForm.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      noIndex: editForm.noIndex,
    };

    try {
      if (editForm.id && !editForm.id.startsWith("default-")) {
        await editSeo(editForm.id, data);
      } else {
        await addSeo(data as PageSEO);
      }
      toast("SEO saved — changes are live!", "success");
      setEditOpen(false);
    } catch {
      toast("Failed to save", "error");
    }
  }

  async function handleSeedAll() {
    setSeeding(true);
    try {
      const existing = new Set(seoEntries.map((e) => e.path));
      let created = 0;
      for (const page of DEFAULT_PAGES) {
        if (!existing.has(page.path)) {
          await addSeo(page as PageSEO);
          created++;
        }
      }
      toast(`Created ${created} SEO entries`, "success");
    } catch {
      toast("Failed to seed pages", "error");
    } finally {
      setSeeding(false);
    }
  }

  function openAuditDetail(audit: SEOAudit) {
    setSelected(audit);
    setDetailOpen(true);
  }

  async function handleDeleteAudit() {
    if (!selected) return;
    setDeleting(true);
    try {
      await delAudit(selected.id);
      toast("Audit deleted");
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  function scoreColor(score: number) {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-error";
  }

  // ─── Table columns ────────────────────────────────
  const seoColumns: Column<typeof mergedPages[0]>[] = [
    {
      key: "path",
      header: "Page",
      render: (p) => (
        <div>
          <span className="font-medium text-gray-90">{p.path === "/" ? "Homepage" : p.path.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
          <span className="block text-xs text-gray-50">{p.path}</span>
        </div>
      ),
    },
    {
      key: "title",
      header: "Title Tag",
      render: (p) => <span className="text-sm text-gray-70 truncate max-w-xs block">{p.title}</span>,
    },
    {
      key: "description",
      header: "Meta Description",
      render: (p) => (
        <span className="text-sm text-gray-50 truncate max-w-sm block">
          {p.description.length > 80 ? p.description.slice(0, 80) + "…" : p.description}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) =>
        p.isDefault ? (
          <StatusBadge status="Default" variant="warning" />
        ) : (
          <StatusBadge status="Custom" variant="success" />
        ),
    },
  ];

  const auditColumns: Column<SEOAudit>[] = [
    {
      key: "url",
      header: "URL",
      render: (a) => <span className="font-medium text-gray-90 truncate max-w-xs block">{a.url}</span>,
    },
    {
      key: "score",
      header: "Score",
      render: (a) => <span className={`font-bold ${scoreColor(a.score)}`}>{a.score}/100</span>,
    },
    {
      key: "issues",
      header: "Issues",
      render: (a) => {
        const high = a.issues?.filter((i) => i.severity === "high").length || 0;
        const med = a.issues?.filter((i) => i.severity === "medium").length || 0;
        return (
          <div className="flex gap-2">
            {high > 0 && <StatusBadge status={`${high} high`} variant="error" />}
            {med > 0 && <StatusBadge status={`${med} med`} variant="warning" />}
            {high === 0 && med === 0 && <StatusBadge status="All good" variant="success" />}
          </div>
        );
      },
    },
    {
      key: "suggestedTitle",
      header: "Suggested Title",
      render: (a) => <span className="text-sm text-gray-70 truncate max-w-xs block">{a.suggestedTitle}</span>,
    },
  ];

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
        as="h2"
        title="SEO Content"
        description="Manage page metadata and run AI content audits"
        actions={
          <AIPromptButton
            section="SEO AI"
            description="Analyze a URL or topic for SEO improvements. Get a score, issues, and actionable recommendations."
            placeholder="Enter a URL or topic to analyze... e.g. https://creedava.com/services"
            presets={[
              { label: "Homepage Audit", prompt: "Analyze the SEO of https://creedava.com/ and suggest improvements" },
              { label: "Services Page", prompt: "Analyze SEO for a virtual assistant services page" },
              { label: "Content Gap", prompt: "What content topics should CreedaVA cover to improve organic search rankings?" },
              { label: "Meta Tag Review", prompt: "Review and optimize meta titles and descriptions for the top 5 pages. Provide improved versions with character counts." },
              { label: "Internal Linking", prompt: "Suggest an internal linking strategy to improve page authority distribution. Identify orphan pages and recommend link placements." },
              { label: "Schema Markup", prompt: "Recommend structured data / schema markup improvements for CreedaVA's website. Cover FAQ, Service, Organization, and BreadcrumbList schemas." },
              { label: "Page Speed Tips", prompt: "Identify common page speed issues for service websites and suggest 5 specific optimizations to improve Core Web Vitals scores." },
              { label: "Local SEO", prompt: "Provide a local SEO strategy for a virtual assistant services company. Cover Google Business Profile, local keywords, citations, and reviews." },
            ]}
            onResult={(raw) => {
              try {
                addAudit(toAuditInput(parseAiJson<AiAudit>(raw)));
                toast("SEO audit complete!", "success");
              } catch {
                toast("AI returned an unreadable response — try again", "error");
              }
            }}
            buildPrompt={(input) =>
              buildTrainedPrompt("SEO Audit", `Analyze this URL/topic: "${input}"\n\nReturn ONLY valid JSON with:\n- url: the analyzed URL or topic\n- score: numeric SEO score 0-100\n- suggestedTitle: improved page title\n- suggestedDescription: improved meta description\n- issues: array of { issue: string, severity: "low"|"medium"|"high", fix: string }\n- recommendations: array of strings with specific improvements\n\nNo markdown fences.`, "", { includeCompetitors: true, includeKPIs: true })
            }
          />
        }
      />

      <AdminTabs
        tabs={[
          { label: "Page SEO", value: "pages", badge: mergedPages.length },
          { label: "Audits", value: "audits", badge: audits.length },
        ]}
        defaultValue={initialTab}
        onChange={setTab}
      />

      {/* ─── Page SEO Tab ──────────────────────────── */}
      {tab === "pages" && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Total Pages" value={mergedPages.length.toString()} badge="tracked" />
            <StatCard
              label="Custom SEO"
              value={pagesWithSeo.toString()}
              badge={`${mergedPages.length - pagesWithSeo} defaults`}
            />
            <StatCard
              label="Coverage"
              value={`${mergedPages.length > 0 ? Math.round((pagesWithSeo / mergedPages.length) * 100) : 0}%`}
              badge="customized"
            />
            <StatCard label="Pages" value={mergedPages.length.toString()} badge="in sitemap" />
          </div>

          {pagesWithSeo < mergedPages.length && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  {mergedPages.length - pagesWithSeo} pages using default SEO
                </p>
                <p className="text-xs text-gray-50 mt-0.5">
                  Click a row to customize, or seed all pages to Firestore at once.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={openNewPage}>
                  + New Page
                </Button>
                <Button size="sm" onClick={handleSeedAll} isLoading={seeding}>
                  Seed All Defaults
                </Button>
              </div>
            </div>
          )}

          {pagesWithSeo >= mergedPages.length && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={openNewPage}>
                + New Page
              </Button>
            </div>
          )}

          <DataTable
            columns={seoColumns}
            data={mergedPages}
            keyExtractor={(p) => p.path}
            onRowClick={(p) => openEdit(p)}
            emptyMessage="No pages found"
          />
        </>
      )}

      {/* ─── AI Audits Tab ─────────────────────────── */}
      {tab === "audits" && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label="Audits" value={audits.length.toString()} badge="total" />
            <StatCard
              label="Avg Score"
              value={audits.length > 0 ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length).toString() : "N/A"}
              badge="out of 100"
            />
            <StatCard
              label="High Issues"
              value={audits.reduce((s, a) => s + (a.issues?.filter((i) => i.severity === "high").length || 0), 0).toString()}
              badge="critical"
            />
            <StatCard
              label="Score 80+"
              value={audits.filter((a) => a.score >= 80).length.toString()}
              badge={`${audits.length > 0 ? Math.round((audits.filter((a) => a.score >= 80).length / audits.length) * 100) : 0}% passing`}
            />
          </div>

          <DataTable
            columns={auditColumns}
            data={audits}
            keyExtractor={(a) => a.id}
            onRowClick={(a) => openAuditDetail(a)}
            emptyMessage="No audits yet — enter a URL above to get started"
          />

          <OnPageAuditsList />
        </>
      )}

      {/* ─── SEO Agent and Tasks now live at the hub level ── */}

      {/* ─── Edit SEO Modal ───────────────────────── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editForm.id ? `Edit SEO — ${editForm.path === "/" ? "Homepage" : editForm.path}` : "New Page SEO"}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveSeo}>
              Save &amp; Publish
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-50 mb-1">Page Path</label>
            <Input
              value={editForm.path}
              disabled={!!editForm.id && !editForm.id.startsWith("default-")}
              onChange={(e) => setEditForm((f) => ({ ...f, path: e.target.value }))}
              placeholder="/custom-page"
            />
            {!editForm.id && (
              <p className="text-xs text-gray-50 mt-1">Enter the URL path, e.g. /blog or /landing/promo</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-50 mb-1">
              Title Tag <span className="text-gray-50">({editForm.title.length}/60)</span>
            </label>
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Page title for search results"
            />
            <p className="text-xs text-gray-50 mt-1">Shows as the page title in Google search results and browser tabs.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-50 mb-1">
              Meta Description <span className="text-gray-50">({editForm.description.length}/160)</span>
            </label>
            <textarea
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-90 placeholder:text-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Page description for search results"
            />
            <p className="text-xs text-gray-50 mt-1">Shows below the title in Google. Aim for 120-160 characters.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-50 mb-1">OG Title (optional)</label>
              <Input
                value={editForm.ogTitle}
                onChange={(e) => setEditForm((f) => ({ ...f, ogTitle: e.target.value }))}
                placeholder="Defaults to title tag"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-50 mb-1">OG Image URL (optional)</label>
              <Input
                value={editForm.ogImage}
                onChange={(e) => setEditForm((f) => ({ ...f, ogImage: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-50 mb-1">OG Description (optional)</label>
            <textarea
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-90 placeholder:text-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={2}
              value={editForm.ogDescription}
              onChange={(e) => setEditForm((f) => ({ ...f, ogDescription: e.target.value }))}
              placeholder="Defaults to meta description"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-50 mb-1">Keywords (comma-separated)</label>
            <Input
              value={editForm.keywords}
              onChange={(e) => setEditForm((f) => ({ ...f, keywords: e.target.value }))}
              placeholder="virtual assistant, business services, ..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editForm.noIndex}
              onChange={(e) => setEditForm((f) => ({ ...f, noIndex: e.target.checked }))}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-70">No-index this page (hide from search engines)</span>
          </label>

          {/* Search preview */}
          <DashboardSection title="Google Search Preview">
            <div className="rounded-lg bg-card border border-border p-4">
              <p className="text-lg text-[#1a0dab] font-medium truncate">
                {editForm.title || "Page Title"} | CreedaVA
              </p>
              <p className="text-sm text-[#006621] truncate">
                creedava.com{editForm.path}
              </p>
              <p className="text-sm text-gray-60 line-clamp-2 mt-0.5">
                {editForm.description || "Page description will appear here..."}
              </p>
            </div>
          </DashboardSection>
        </div>
      </Modal>

      {/* ─── Audit Detail Modal ───────────────────── */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="SEO Audit Report"
        size="lg"
        footer={
          <>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${scoreColor(selected.score)}`}>{selected.score}</div>
              <div>
                <p className="text-sm font-medium text-gray-90">{selected.url}</p>
                <p className="text-xs text-gray-50">SEO Score out of 100</p>
              </div>
            </div>
            <DashboardSection title="Recommended Changes">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-50">Title Tag:</span>
                  <p className="font-medium text-gray-90">{selected.suggestedTitle}</p>
                </div>
                <div>
                  <span className="text-gray-50">Meta Description:</span>
                  <p className="font-medium text-gray-90">{selected.suggestedDescription}</p>
                </div>
                <div>
                  <span className="text-gray-50">H1 Heading:</span>
                  <p className="font-medium text-gray-90">{selected.suggestedH1}</p>
                </div>
              </div>
            </DashboardSection>
            {selected.issues?.length > 0 && (
              <DashboardSection title="Issues Found">
                <div className="divide-y divide-border">
                  {selected.issues.map((issue, i) => (
                    <div key={i} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={issue.severity} variant={severityVariant[issue.severity]} />
                        <span className="text-sm font-medium text-gray-90">{issue.issue}</span>
                      </div>
                      <p className="text-xs text-gray-60 ml-17">{issue.fix || issue.suggestion}</p>
                    </div>
                  ))}
                </div>
              </DashboardSection>
            )}
            {selected.missingElements?.length > 0 && (
              <DashboardSection title="Missing Elements">
                <ul className="list-disc list-inside text-sm text-gray-70 space-y-1">
                  {selected.missingElements.map((el, i) => (
                    <li key={i}>{el}</li>
                  ))}
                </ul>
              </DashboardSection>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Audit"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteAudit} isLoading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-70">
          Delete the SEO audit for <strong>{selected?.url}</strong>?
        </p>
      </Modal>
    </div>
  );
}
