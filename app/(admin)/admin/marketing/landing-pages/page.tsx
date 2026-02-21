"use client";

import { useState, useRef } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  AdminTabs,
  DataTable,
  StatusBadge,
  Modal,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { AIPromptButton, RichTextEditor } from "@/components/admin";
import { lazyGenerateLandingPage as generateLandingPage } from "@/lib/firebase/ai-lazy";
import { buildLandingPagePrompt } from "@/lib/utils/ai-system-prompt";
import type { LandingPage } from "@/lib/types/content";
import { uploadImage, uploadFile } from "@/lib/firebase/storage";
import { cloudListDriveFiles } from "@/lib/firebase/cloud-functions";
import Image from "next/image";

const emptyForm = {
  title: "",
  slug: "",
  headline: "",
  subheadline: "",
  ctaText: "Get Started",
  ctaEmail: "contact@creedava.com",
  bodyHtml: "",
  status: "draft" as "draft" | "published",
  images: [] as string[],
  attachments: [] as { name: string; url: string; type: string }[],
};

export default function LandingPagesPage() {
  const { data: pages, loading, add, edit, del } = useCollection<LandingPage>("landing-pages", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState<LandingPage | null>(null);
  const [surveyPreviewOpen, setSurveyPreviewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<LandingPage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Image/attachment/Drive state
  const [uploading, setUploading] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<{ id: string; name: string; mimeType: string; thumbnail?: string; webLink?: string }[]>([]);
  const lpImageRef = useRef<HTMLInputElement>(null);
  const lpAttachRef = useRef<HTMLInputElement>(null);

  const filtered = pages.filter((p) => tab === "all" || p.status === tab);

  const tabs = [
    { label: "All", value: "all", badge: pages.length },
    { label: "Draft", value: "draft", badge: pages.filter((p) => p.status === "draft").length },
    { label: "Published", value: "published", badge: pages.filter((p) => p.status === "published").length },
  ];

  function openModal(page?: LandingPage) {
    if (page) {
      setSelected(page);
      setForm({
        title: page.title,
        slug: page.slug,
        headline: page.headline,
        subheadline: page.subheadline,
        ctaText: page.ctaText,
        ctaEmail: page.ctaEmail || "contact@creedava.com",
        bodyHtml: page.bodyHtml,
        status: page.status,
        images: page.images || [],
        attachments: page.attachments || [],
      });
    } else {
      setSelected(null);
      setForm({ ...emptyForm });
    }
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() && !form.headline.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: form.title,
        slug: form.slug,
        headline: form.headline,
        subheadline: form.subheadline,
        ctaText: form.ctaText,
        ctaEmail: form.ctaEmail,
        bodyHtml: form.bodyHtml,
        status: form.status,
        images: form.images,
        attachments: form.attachments,
      };
      if (selected) {
        await edit(selected.id, data);
        toast("Landing page updated");
      } else {
        await add({ ...data, views: 0, conversions: 0 });
        toast("Landing page saved as draft");
      }
      setModalOpen(false);
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!selected) return;
    try {
      await edit(selected.id, { status: "published" as const });
      toast("Published!");
      setModalOpen(false);
    } catch {
      toast("Failed to publish", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Page deleted");
      setDeleteOpen(false);
      setModalOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  // ── Landing page image/attachment handlers ──
  async function handleLpImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const folder = `landing-pages/${selected?.id || "new_" + Date.now()}`;
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadImage(file, folder);
        urls.push(result.url);
      }
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      toast(`${urls.length} image(s) uploaded`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleLpAttachUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const folder = `landing-pages/${selected?.id || "new_" + Date.now()}/attachments`;
      const newAtts: { name: string; url: string; type: string }[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadFile(file, folder);
        newAtts.push({ name: result.name, url: result.url, type: result.type });
      }
      setForm(f => ({ ...f, attachments: [...f.attachments, ...newAtts] }));
      toast(`${newAtts.length} file(s) attached`);
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeLpImage(index: number) {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  function removeLpAttachment(index: number) {
    setForm(f => ({ ...f, attachments: f.attachments.filter((_, i) => i !== index) }));
  }

  async function handleLpBrowseDrive() {
    setDriveLoading(true);
    try {
      const res = await cloudListDriveFiles();
      if (res.success) {
        setDriveFiles(res.files || []);
        setDriveOpen(true);
      } else {
        toast("Failed to load Drive files", "error");
      }
    } catch {
      toast("Drive connection failed", "error");
    } finally {
      setDriveLoading(false);
    }
  }

  async function handleLpImportDrive(file: { id: string; name: string; mimeType: string; webLink?: string }) {
    if (!file.webLink) return;
    if (file.mimeType?.startsWith("image/")) {
      setForm(f => ({ ...f, images: [...f.images, file.webLink!] }));
      toast(`Imported image: ${file.name}`);
    } else {
      setForm(f => ({
        ...f,
        attachments: [...f.attachments, { name: file.name, url: file.webLink!, type: file.mimeType }],
      }));
      toast(`Imported: ${file.name}`);
    }
    setDriveOpen(false);
  }

  function cvr(p: LandingPage) {
    return p.views > 0 ? ((p.conversions / p.views) * 100).toFixed(1) : "0.0";
  }

  const columns: Column<LandingPage>[] = [
    {
      key: "title",
      header: "Page",
      render: (p) => (
        <div>
          <p className="text-sm font-medium text-gray-90">{p.title}</p>
          <p className="text-xs text-gray-40">/{p.slug}</p>
        </div>
      ),
    },
    {
      key: "headline",
      header: "Headline",
      render: (p) => (
        <p className="text-sm text-gray-70 truncate max-w-xs">{p.headline}</p>
      ),
    },
    {
      key: "views",
      header: "Views",
      render: (p) => <span className="text-sm text-gray-80">{p.views.toLocaleString()}</span>,
    },
    {
      key: "conversions",
      header: "CVR",
      render: (p) => <span className="text-sm text-gray-80">{cvr(p)}%</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusBadge
          status={p.status}
          variant={p.status === "published" ? "success" : "default"}
        />
      ),
    },
    {
      key: "slug",
      header: "",
      render: (p) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setPreviewPage(p); setPreviewOpen(true); }}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-light font-medium"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            Preview
          </button>
          {p.slug && p.status === "published" && (
            <a
              href={`/lp/${p.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-50 hover:text-primary font-medium"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              Live
            </a>
          )}
        </div>
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
        title="Landing Pages"
        description="AI-generated landing pages for marketing campaigns"
        actions={
          <div className="flex items-center gap-2">
          <AIPromptButton
            section="Landing Page AI"
            description="Generate a complete landing page with headline, content, and call-to-action. Preview the page live in a new tab."
            placeholder="Page topic (e.g. Virtual assistant for startups) and CTA text"
            presets={[
              { label: "Lead Capture", prompt: "Create a landing page to capture leads for virtual assistant services with a free consultation offer" },
              { label: "Service Promo", prompt: "Create a landing page promoting CreedaVA's executive assistant services with 'Get Started' CTA" },
              { label: "Event Signup", prompt: "Create a landing page for a free webinar about how VAs can transform your business" },
              { label: "Case Study LP", prompt: "Create a landing page showcasing a client success story with key metrics, testimonial, and a CTA to book a consultation" },
              { label: "Pricing Page", prompt: "Create a landing page comparing VA service plans (Basic, Professional, Enterprise) with features, pricing, and a CTA for each tier" },
              { label: "Free Trial", prompt: "Create a landing page offering a free 1-week virtual assistant trial. Highlight zero-risk, no commitment, and immediate value" },
              { label: "Industry Focus", prompt: "Create a landing page targeting real estate agents who need virtual assistant support. Address their specific pain points and workflows" },
              { label: "Seasonal Offer", prompt: "Create a limited-time promotional landing page with urgency elements, a special discount, and countdown-style messaging for VA services" },
            ]}
            previewable
            previewLabel="Preview Page"
            onResult={(raw) => {
              try {
                const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
                const result = JSON.parse(cleaned);
                setSelected(null);
                setForm({
                  title: result.title || "",
                  slug: result.slug || "",
                  headline: result.headline || "",
                  subheadline: result.subheadline || "",
                  ctaText: result.ctaText || "Get Started",
                  ctaEmail: "contact@creedava.com",
                  bodyHtml: result.bodyHtml || "",
                  status: "draft",
                  images: [],
                  attachments: [],
                });
                setModalOpen(true);
                toast("AI content loaded \u2014 edit and save when ready", "success");
              } catch {
                generateLandingPage(raw.slice(0, 200), "Get Started").then((r) => {
                  setSelected(null);
                  setForm({
                    title: r.title || "",
                    slug: r.slug || "",
                    headline: r.headline || "",
                    subheadline: r.subheadline || "",
                    ctaText: r.ctaText || "Get Started",
                    ctaEmail: "contact@creedava.com",
                    bodyHtml: r.bodyHtml || "",
                    status: "draft",
                    images: [],
                    attachments: [],
                  });
                  setModalOpen(true);
                  toast("AI content loaded \u2014 edit and save when ready", "success");
                }).catch(() => toast("AI generation failed", "error"));
              }
            }}
            buildPrompt={(input) => buildLandingPagePrompt(input)}
          />
          <Button size="sm" onClick={() => openModal()}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Page
          </Button>
          </div>
        }
      />

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      {/* System Pages — Satisfaction Survey */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-10 border-b border-border">
          <p className="text-xs font-medium text-gray-50 uppercase tracking-wider">System Pages</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" /><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-90">Customer Satisfaction Survey</p>
              <p className="text-xs text-gray-40">/satisfaction/[token] — Customer feedback collection page</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300">Active</span>
            <button
              onClick={() => setSurveyPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-primary-light hover:bg-primary/5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              Preview
            </button>
            <a
              href="/satisfaction/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-50 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              Open
            </a>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => openModal(p)}
        emptyMessage="No landing pages yet — try the AI builder or create one manually"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? `Edit: ${selected.title}` : "New Landing Page"}
        size="lg"
        footer={
          <>
            {selected && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
            {selected?.status === "draft" && (
              <Button variant="outline" size="sm" onClick={handlePublish}>
                Publish
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLpBrowseDrive} isLoading={driveLoading}>
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
              Drive
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={saving}>
              {selected ? "Update" : "Save Draft"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* View link for published pages */}
          {selected?.status === "published" && selected.slug && (
            <a
              href={`/lp/${selected.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-10 text-sm text-primary hover:text-primary-light hover:bg-primary/5 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              <span className="font-medium">View Page</span>
              <span className="text-gray-40">creedava.com/lp/{selected.slug}</span>
            </a>
          )}

          {/* Stats row (edit mode only) */}
          {selected && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-50">Views</p>
                <p className="text-sm font-medium text-gray-90">{selected.views.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-50">Conversions</p>
                <p className="text-sm font-medium text-gray-90">{selected.conversions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-50">CVR</p>
                <p className="text-sm font-medium text-gray-90">{cvr(selected)}%</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Page Title"
              placeholder="e.g. VA Startup Package"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              label="URL Slug"
              placeholder="e.g. va-startup-package"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <Input
            label="Headline"
            placeholder="Compelling main headline"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
          <Input
            label="Subheadline"
            placeholder="Supporting text"
            value={form.subheadline}
            onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
          />
          <Input
            label="CTA Button Text"
            placeholder="e.g. Get Started"
            value={form.ctaText}
            onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-70 mb-1">Send Inquiries To</label>
            <select
              value={form.ctaEmail}
              onChange={(e) => setForm({ ...form, ctaEmail: e.target.value })}
              className="w-full rounded-lg border border-gray-20 bg-gray-10/50 px-3 py-2 text-sm text-gray-90 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              aria-label="Send inquiries to"
            >
              <option value="contact@creedava.com">contact@creedava.com</option>
              <option value="sales@creedava.com">sales@creedava.com</option>
              <option value="info@creedava.com">info@creedava.com</option>
              <option value="john@creedava.com">john@creedava.com</option>
            </select>
            <p className="text-xs text-gray-40 mt-1">Form submissions from this page will be sent to this email</p>
          </div>
          <RichTextEditor
            label="Page Body"
            value={form.bodyHtml}
            onChange={(val) => setForm({ ...form, bodyHtml: val })}
            placeholder="Page content..."
            minHeight="200px"
          />

          {/* ── Images ──────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-50">Images</p>
              <Button variant="outline" size="sm" onClick={() => lpImageRef.current?.click()} isLoading={uploading}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                Upload
              </Button>
              <input ref={lpImageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleLpImageUpload} />
            </div>
            {form.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group w-full h-20">
                    <Image src={url} alt="" fill className="rounded-lg object-cover" />
                    <button
                      onClick={() => removeLpImage(i)}
                      className="absolute top-1 right-1 bg-gray-10/90 text-gray-60 rounded p-0.5 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-40">No images &mdash; upload or import from Drive</p>
            )}
          </div>

          {/* ── Attachments ─────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-50">Attachments</p>
              <Button variant="outline" size="sm" onClick={() => lpAttachRef.current?.click()} isLoading={uploading}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                Attach
              </Button>
              <input ref={lpAttachRef} type="file" multiple className="hidden" onChange={handleLpAttachUpload} />
            </div>
            {form.attachments.length > 0 ? (
              <div className="space-y-1">
                {form.attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-10 text-sm">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 text-gray-70 hover:text-primary">
                      <svg className="w-4 h-4 text-gray-40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      <span className="truncate">{att.name}</span>
                    </a>
                    <button
                      onClick={() => removeLpAttachment(i)}
                      className="text-gray-40 hover:text-red-500 shrink-0 ml-2"
                      aria-label="Remove attachment"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-40">No attachments</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Page"
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
          Delete &ldquo;{selected?.title}&rdquo;? This cannot be undone.
        </p>
      </Modal>

      {/* Drive Import Modal */}
      <Modal open={driveOpen} onClose={() => setDriveOpen(false)} title="Import from Google Drive" size="lg">
        {driveLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : driveFiles.length === 0 ? (
          <p className="text-sm text-gray-40 text-center py-12">No files found in Drive</p>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {driveFiles.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-10 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {f.mimeType?.startsWith("image/") && f.thumbnail ? (
                    <div className="relative w-8 h-8 shrink-0">
                      <Image src={f.thumbnail} alt="" fill className="rounded object-cover" />
                    </div>
                  ) : (
                    <svg className="w-8 h-8 text-gray-30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-100 truncate">{f.name}</p>
                    <p className="text-xs text-gray-40">{f.mimeType}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleLpImportDrive(f)}>
                  Import
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Landing Page Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewPage?.title || "Page Preview"}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => { setPreviewOpen(false); if (previewPage) openModal(previewPage); }}>
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit
            </Button>
            {previewPage?.slug && previewPage.status === "published" && (
              <a
                href={`/lp/${previewPage.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-light"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                Open Live
              </a>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {previewPage && (
          <div className="space-y-6">
            {/* Hero preview */}
            <div className="rounded-xl bg-linear-to-b from-gray-10 to-white p-8 text-center">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-100 mb-3 leading-tight">
                {previewPage.headline}
              </h1>
              <p className="text-base text-gray-60 leading-relaxed mb-6 max-w-lg mx-auto">
                {previewPage.subheadline}
              </p>
              <span className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-semibold text-sm">
                {previewPage.ctaText || "Get Started"}
              </span>
            </div>

            {/* Body preview */}
            {previewPage.bodyHtml && (
              <div className="rounded-xl border border-border p-6">
                <p className="text-xs font-medium text-gray-40 uppercase tracking-wider mb-3">Page Body</p>
                <div
                  className="prose prose-sm max-w-none prose-headings:text-gray-100 prose-p:text-gray-70 prose-a:text-primary prose-strong:text-gray-90"
                  dangerouslySetInnerHTML={{ __html: previewPage.bodyHtml }}
                />
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-gray-10 p-3">
                <p className="text-xs text-gray-50">Status</p>
                <p className="text-sm font-medium text-gray-90 capitalize">{previewPage.status}</p>
              </div>
              <div className="rounded-lg bg-gray-10 p-3">
                <p className="text-xs text-gray-50">Views</p>
                <p className="text-sm font-medium text-gray-90">{previewPage.views.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-gray-10 p-3">
                <p className="text-xs text-gray-50">Conversions</p>
                <p className="text-sm font-medium text-gray-90">{previewPage.conversions}</p>
              </div>
              <div className="rounded-lg bg-gray-10 p-3">
                <p className="text-xs text-gray-50">CVR</p>
                <p className="text-sm font-medium text-gray-90">{cvr(previewPage)}%</p>
              </div>
            </div>

            {/* Slug */}
            {previewPage.slug && (
              <div className="flex items-center gap-2 text-sm text-gray-50">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                /lp/{previewPage.slug}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Satisfaction Survey Preview Modal */}
      <Modal
        open={surveyPreviewOpen}
        onClose={() => setSurveyPreviewOpen(false)}
        title="Customer Satisfaction Survey"
        size="lg"
        footer={
          <>
            <a
              href="/satisfaction/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-light"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
              Open in New Tab
            </a>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setSurveyPreviewOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-border overflow-hidden">
            <iframe
              src="/satisfaction/demo"
              className="w-full border-0"
              style={{ height: "600px" }}
              title="Satisfaction Survey Preview"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-10 p-3">
              <p className="text-xs text-gray-50">Type</p>
              <p className="text-sm font-medium text-gray-90">System Page</p>
            </div>
            <div className="rounded-lg bg-gray-10 p-3">
              <p className="text-xs text-gray-50">Route</p>
              <p className="text-sm font-medium text-gray-90">/satisfaction/[token]</p>
            </div>
            <div className="rounded-lg bg-gray-10 p-3">
              <p className="text-xs text-gray-50">Status</p>
              <p className="text-sm font-medium text-green-600">Active</p>
            </div>
          </div>
          <p className="text-xs text-gray-40">
            This page is generated from code. To edit its design, modify the component at <code className="text-primary">app/(marketing)/satisfaction/[token]/page.tsx</code>.
            The email template can be edited from Emails → Drafts.
          </p>
        </div>
      </Modal>
    </div>
  );
}
