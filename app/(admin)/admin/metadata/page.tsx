"use client";

import { useState, useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  Modal,
  DashboardSection,
  StatCard,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import type { PageSEO } from "@/lib/types/content";

// ─── Default page metadata ───────────────────────────
// Mirrors the in-code fallbacks in each marketing page's metadata() call, so an
// unedited page still ships a sensible title and description.
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

interface EditForm {
  id?: string;
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string;
  noIndex: boolean;
}

const EMPTY_FORM: EditForm = {
  path: "",
  title: "",
  description: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  keywords: "",
  noIndex: false,
};

export default function PageMetadataSection() {
  const { data: seoEntries, loading, add: addSeo, edit: editSeo } = useCollection<PageSEO>(
    "page-seo",
    { orderByField: "path" },
  );
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_FORM);
  const [seeding, setSeeding] = useState(false);

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

  // ─── Handlers ──────────────────────────────────────
  function openEdit(page: (typeof mergedPages)[0]) {
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
    setEditForm(EMPTY_FORM);
    setEditOpen(true);
  }

  async function handleSave() {
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
      toast("Saved — live on the site within 60 seconds", "success");
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
      toast(`Created ${created} entries`, "success");
    } catch {
      toast("Failed to seed pages", "error");
    } finally {
      setSeeding(false);
    }
  }

  // ─── Table columns ─────────────────────────────────
  const columns: Column<(typeof mergedPages)[0]>[] = [
    {
      key: "path",
      header: "Page",
      render: (p) => (
        <div>
          <span className="font-medium text-gray-90">
            {p.path === "/"
              ? "Homepage"
              : p.path.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
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
        title="Page Metadata"
        description="Title tags, meta descriptions and social cards served on the live site. Edits go live within 60 seconds — no deploy needed."
        actions={
          pagesWithSeo >= mergedPages.length ? (
            <Button variant="outline" size="sm" onClick={openNewPage}>
              + New Page
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Pages" value={mergedPages.length.toString()} badge="tracked" />
        <StatCard
          label="Custom"
          value={pagesWithSeo.toString()}
          badge={`${mergedPages.length - pagesWithSeo} defaults`}
        />
        <StatCard
          label="Coverage"
          value={`${mergedPages.length > 0 ? Math.round((pagesWithSeo / mergedPages.length) * 100) : 0}%`}
          badge="customized"
        />
        <StatCard label="In Sitemap" value={mergedPages.length.toString()} badge="pages" />
      </div>

      {pagesWithSeo < mergedPages.length && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              {mergedPages.length - pagesWithSeo} pages using default metadata
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

      <DataTable
        columns={columns}
        data={mergedPages}
        keyExtractor={(p) => p.path}
        onRowClick={(p) => openEdit(p)}
        emptyMessage="No pages found"
      />

      {/* ─── Edit modal ───────────────────────────── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={
          editForm.id
            ? `Edit — ${editForm.path === "/" ? "Homepage" : editForm.path}`
            : "New Page Metadata"
        }
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
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

          {/* Search preview — deliberately stays Google-white in both themes.
              #1a0dab / #006621 are Google's own SERP colours; on a dark card
              they drop to ~1.2:1, so the panel keeps its own light surface. */}
          <DashboardSection title="Google Search Preview">
            <div className="rounded-lg bg-mk-white border border-border p-4">
              <p className="text-lg text-[#1a0dab] font-medium truncate">
                {editForm.title || "Page Title"} | CreedaVA
              </p>
              <p className="text-sm text-[#006621] truncate">creedava.com{editForm.path}</p>
              <p className="text-sm text-[#4d5156] line-clamp-2 mt-0.5">
                {editForm.description || "Page description will appear here..."}
              </p>
            </div>
          </DashboardSection>
        </div>
      </Modal>
    </div>
  );
}
