"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
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
import { uploadImage, uploadFile } from "@/lib/firebase/storage";
import { cloudListDriveFiles } from "@/lib/firebase/cloud-functions";
import type { BlogPost, BlogPostFormData } from "@/lib/types/content";
import Image from "next/image";
import { translateBlogInBackground } from "@/lib/firebase/translate";
import { parseAiJson } from "@/lib/utils/ai-json";
import { slugify } from "@/lib/utils/slug";
import { pickFeaturedImage, thumbnailPromptList } from "@/lib/constants/blog-images";

const emptyPost: BlogPostFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  tags: [],
  metaDescription: "",
  status: "draft",
  featuredImage: "",
  images: [],
  attachments: [],
  references: [],
};

export default function BlogPage() {
  const { data: posts, loading, add, edit, del } = useCollection<BlogPost>("blog", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogPostFormData>(emptyPost);
  const [uploading, setUploading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  // Drive import
  const [driveOpen, setDriveOpen] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<{ id: string; name: string; type: string; mimeType: string; webLink: string; modifiedAt: string; thumbnail: string }[]>([]);

  // AI generation (state reserved for future inline AI prompt UI)

  const filtered = posts.filter((p) => tab === "all" || p.status === tab);

  const tabs = [
    { label: "All", value: "all", badge: posts.length },
    { label: "Draft", value: "draft", badge: posts.filter((p) => p.status === "draft").length },
    { label: "Published", value: "published", badge: posts.filter((p) => p.status === "published").length },
  ];

  function openModal(post?: BlogPost) {
    if (post) {
      setSelected(post);
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags || [],
        metaDescription: post.metaDescription || "",
        status: post.status,
        featuredImage: post.featuredImage || "",
        images: post.images || [],
        attachments: post.attachments || [],
      });
    } else {
      setSelected(null);
      setForm(emptyPost);
    }
    setModalOpen(true);
  }

  // ── Image upload handler ──────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const folder = `blog/${selected?.id || "new_" + Date.now()}`;
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadImage(file, folder);
        uploaded.push(result.url);
      }
      const currentImages = form.images || [];
      setForm({
        ...form,
        images: [...currentImages, ...uploaded],
        featuredImage: form.featuredImage || uploaded[0] || "",
      });
      toast(`${uploaded.length} image(s) uploaded`, "success");
    } catch (err) {
      toast((err as Error).message || "Upload failed", "error");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  // ── Attachment upload handler ─────────────────────
  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const folder = `blog/${selected?.id || "new_" + Date.now()}/attachments`;
      const currentAttachments = form.attachments || [];
      const newAttachments = [...currentAttachments];
      for (const file of Array.from(files)) {
        const result = await uploadFile(file, folder);
        newAttachments.push({ name: result.name, url: result.url, type: result.type });
      }
      setForm({ ...form, attachments: newAttachments });
      toast(`${files.length} file(s) attached`, "success");
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
      if (attachInputRef.current) attachInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    const imgs = [...(form.images || [])];
    const removed = imgs.splice(index, 1)[0];
    setForm({
      ...form,
      images: imgs,
      featuredImage: form.featuredImage === removed ? (imgs[0] || "") : form.featuredImage,
    });
  }

  function removeAttachment(index: number) {
    const atts = [...(form.attachments || [])];
    atts.splice(index, 1);
    setForm({ ...form, attachments: atts });
  }

  // ── Drive import ──────────────────────────────────
  async function handleBrowseDrive() {
    setDriveLoading(true);
    try {
      const result = await cloudListDriveFiles();
      if (result.success) {
        setDriveFiles(result.files);
        setDriveOpen(true);
      }
    } catch {
      toast("Failed — ensure Google Drive is configured in Settings → Integrations", "error");
    } finally {
      setDriveLoading(false);
    }
  }

  function handleImportDriveFile(file: { name: string; webLink: string; mimeType: string }) {
    if (file.mimeType.startsWith("image/")) {
      setForm({
        ...form,
        images: [...(form.images || []), file.webLink],
        featuredImage: form.featuredImage || file.webLink,
      });
      toast(`Image "${file.name}" imported from Drive`, "success");
    } else {
      setForm({
        ...form,
        attachments: [...(form.attachments || []), { name: file.name, url: file.webLink, type: file.mimeType }],
      });
      toast(`File "${file.name}" attached from Drive`, "success");
    }
  }

  // ── Thumbnail backfill ────────────────────────────
  // Gives posts that were written before thumbnail support a deterministic
  // featured image. Only touches posts where the field is empty, so any
  // manually uploaded image is never overwritten.
  async function handleBackfillThumbnails() {
    const missing = posts.filter((p) => !p.featuredImage);
    if (missing.length === 0) {
      toast("All posts already have a thumbnail", "success");
      return;
    }
    setBackfilling(true);
    let updated = 0;
    try {
      for (const post of missing) {
        const seed = [post.title, ...(post.tags ?? []), post.excerpt]
          .filter(Boolean)
          .join(" ");
        await edit(post.id, { featuredImage: pickFeaturedImage(seed) });
        updated++;
      }
      toast(`Added thumbnails to ${updated} post(s)`, "success");
    } catch {
      toast(`Thumbnails added to ${updated} post(s), then failed`, "error");
    } finally {
      setBackfilling(false);
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast("Title is required", "error");
      return;
    }
    // Derive a URL-safe slug from the title when none was typed — a raw title
    // saved as the slug produced unreachable URLs like /news/My%20Post.
    const slug = slugify(form.slug || form.title);
    if (!slug) {
      toast("Slug is required", "error");
      return;
    }

    setSaving(true);
    try {
      if (selected) {
        await edit(selected.id, { ...form, slug });
        toast("Post updated");
      } else {
        await add({ ...form, slug });
        toast("Post created");
      }
      setModalOpen(false);
    } catch {
      toast("Failed to save post", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!selected) return;
    try {
      await edit(selected.id, { status: "published", publishedAt: new Date().toISOString() });
      // Fire-and-forget: translate the post to Spanish in the background
      translateBlogInBackground(
        selected.id,
        selected.title,
        selected.excerpt ?? "",
        selected.content ?? "",
        selected.lang ?? "en",
      );
      toast("Post published!");
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
      toast("Post deleted");
      setDeleteOpen(false);
      setModalOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete post", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<BlogPost>[] = [
    {
      key: "title",
      header: "Title",
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.featuredImage ? (
            <div className="relative w-10 h-10 shrink-0">
              <Image src={p.featuredImage} alt={`${p.title} featured image`} fill className="rounded-lg object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-10 shrink-0 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-gray-90">{p.title}</p>
            <p className="text-xs text-gray-50 mt-0.5 truncate max-w-xs">{p.excerpt}</p>
          </div>
        </div>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      render: (p) =>
        p.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {p.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          "—"
        ),
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
      key: "publishedAt",
      header: "Published",
      render: (p) => (p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : "—"),
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
        title="Blog"
        description="Create and manage blog posts — AI-assisted writing included"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackfillThumbnails}
              isLoading={backfilling}
              title="Assign a thumbnail to any post that does not have one"
            >
              Add missing thumbnails
            </Button>
            <AIPromptButton
              section="Blog AI"
              description="Generate a full blog post from a topic description. The AI will create a title, slug, excerpt, content, tags, and meta description."
              placeholder="Describe your blog post topic... e.g. 'How virtual assistants can save startups 20 hours per week'"
              presets={[
                { label: "Business Tips", prompt: "Write a blog post about practical business tips for small business owners looking to delegate tasks to virtual assistants." },
                { label: "Industry Trends", prompt: "Write a blog post about the latest trends in virtual assistant services and remote work for 2026." },
                { label: "Case Study", prompt: "Write a blog post case study about how a startup scaled their operations using CreedaVA's virtual assistant services." },
                { label: "How-To Guide", prompt: "Write a step-by-step how-to guide on hiring and onboarding your first virtual assistant. Include tips for setting expectations and communication." },
                { label: "Cost Savings", prompt: "Write a blog post breaking down how much money businesses save by using virtual assistants vs full-time employees. Include real calculations." },
                { label: "Common Mistakes", prompt: "Write a blog post about the top 7 mistakes businesses make when working with virtual assistants and how to avoid them." },
                { label: "Tools & Tech", prompt: "Write a blog post reviewing the best tools and tech stack for managing virtual assistant teams effectively in 2026." },
                { label: "Client FAQ", prompt: "Write a blog post answering the 10 most frequently asked questions about virtual assistant services from potential clients." },
              ]}
              previewable
              previewLabel="Preview Post"
              onResult={(raw) => {
                try {
                  const result = parseAiJson<Partial<BlogPostFormData>>(raw);
                  setSelected(null);
                  setForm({
                    ...emptyPost,
                    ...result,
                    status: "draft",
                    tags: result.tags ?? [],
                    featuredImage:
                      result.featuredImage ||
                      pickFeaturedImage(
                        [result.title, ...(result.tags ?? []), result.excerpt]
                          .filter(Boolean)
                          .join(" "),
                      ),
                  });
                  setModalOpen(true);
                  toast("AI content loaded — edit and save when ready", "success");
                } catch {
                  toast("AI returned an unreadable response — try again", "error");
                }
              }}
              buildPrompt={(input) =>
                // The body rules live in BLOG_BODY_RULES_2026 and are injected by
                // `includeBlogRules`. This string only describes the JSON envelope
                // — it used to restate the old `<style>` / gradient / wave-divider
                // instructions, which the renderer strips and which produced the
                // dashboard-looking bodies this page is supposed to avoid.
                buildTrainedPrompt("Blog", `Write a complete blog post about: "${input}"

Return ONLY valid JSON with these fields:
- title: compelling blog title (SEO-optimized, under 60 chars)
- slug: URL-friendly slug
- excerpt: 1-2 sentence summary used as the lede
- content: the full article body as semantic HTML, following BLOG BODY RULES.
  1,200-1,600 words, 6-9 <h2> sections, <h3> for sub-points, and a numbered
  [1]-style link (<a href="#source-1">[1]</a>) on every factual claim.
  NEVER use <h1> — the page renders the post title as the only H1.
  Semantic structure only: <p>, <h2>, <h3>, <ul>/<ol>/<li>, <table>, <blockquote>,
  <details>/<summary>, <strong>, <em>, <a>. The article renderer rebuilds this
  body from that whitelist and discards everything else — no <div> wrappers, no
  class names, no inline styles, no SVG, and any styling you add is dropped.
  Express hierarchy with headings and lists, never with markup or styling.
- references: array of the sources cited above, in citation order:
  [{ "label": "Title of the page or report", "url": "https://…", "source": "Publisher", "year": "2025" }]
  Only sources you were given or can name as a primary publisher. If a claim
  cannot be sourced, remove the claim rather than inventing a citation.
- tags: array of 3-5 relevant tags
- metaDescription: SEO meta description (150-160 chars)
- featuredImage: thumbnail used on the listing card and social preview. Copy EXACTLY ONE full URL from the approved list below, choosing the best topical match:
${thumbnailPromptList()}

Return ONLY valid JSON, no markdown fences.`, "", { includeCompetitors: true, includeDesignSystem: true, includeBlogRules: true, includeCRO: true })
              }
            />
            <Button size="sm" onClick={() => openModal()}>
              + New Post
            </Button>
          </div>
        }
      />

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => openModal(p)}
        emptyMessage="No posts yet — create one or let AI generate a draft"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? "Edit Post" : "New Post"}
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            {selected && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto">
                Delete
              </Button>
            )}
            {selected?.status === "draft" && (
              <Button variant="outline" size="sm" onClick={handlePublish} className="w-full sm:w-auto">
                Publish
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleBrowseDrive} isLoading={driveLoading} className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
              Drive
            </Button>
            <div className="flex-1 hidden sm:block" />
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={saving} className="w-full sm:w-auto">
              {selected ? "Save Changes" : "Save Draft"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input label="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          <Input label="Meta Description" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
          <RichTextEditor
            label="Content"
            value={form.content}
            onChange={(val) => setForm({ ...form, content: val })}
            placeholder="Write your blog post content..."
            minHeight="250px"
          />
          <Input
            label="Tags (comma-separated)"
            value={form.tags?.join(", ") || ""}
            onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
          />

          {/* ── Images ──────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-100">Images</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} isLoading={uploading}>
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  Upload
                </Button>
                <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" aria-label="Upload blog post images" onChange={handleImageUpload} />
              </div>
            </div>
            {(form.images?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {form.images!.map((url, i) => (
                  <div key={i} className="relative group w-full h-20">
                    <Image src={url} alt={`Blog image ${i + 1}`} fill className="rounded-lg object-cover" />
                    {url === form.featuredImage && (
                      <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">Featured</span>
                    )}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                      {url !== form.featuredImage && (
                        <button
                          onClick={() => setForm({ ...form, featuredImage: url })}
                          className="bg-gray-10/90 text-gray-60 rounded p-0.5 hover:text-primary"
                          title="Set as featured"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(i)}
                        className="bg-gray-10/90 text-gray-60 rounded p-0.5 hover:text-error-text"
                        title="Remove"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-50">No images — upload or import from Drive</p>
            )}
          </div>

          {/* ── Attachments ─────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-100">Attachments</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => attachInputRef.current?.click()} isLoading={uploading}>
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                  Attach
                </Button>
                <input ref={attachInputRef} type="file" multiple className="hidden" aria-label="Upload blog post attachments" onChange={handleAttachmentUpload} />
              </div>
            </div>
            {(form.attachments?.length ?? 0) > 0 ? (
              <div className="space-y-1">
                {form.attachments!.map((att, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-10 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-gray-50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-gray-70 hover:text-primary truncate">{att.name}</a>
                    </div>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="text-gray-50 hover:text-error-text shrink-0 ml-2"
                      aria-label="Remove attachment"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-50">No attachments</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Post"
        size="sm"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting} className="w-full sm:w-auto">
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-70">
          Are you sure you want to delete <strong>{selected?.title}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* Drive Import Modal */}
      <Modal open={driveOpen} onClose={() => setDriveOpen(false)} title="Import from Google Drive" size="lg">
        {driveLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : driveFiles.length === 0 ? (
          <p className="text-sm text-gray-50 text-center py-12">No files found in Drive</p>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {driveFiles.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-10 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {f.mimeType?.startsWith("image/") && f.thumbnail ? (
                    <div className="relative w-8 h-8 shrink-0">
                      <Image src={f.thumbnail} alt={`${f.name} preview`} fill className="rounded object-cover" />
                    </div>
                  ) : (
                    <svg className="w-8 h-8 text-gray-30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-100 truncate">{f.name}</p>
                    <p className="text-xs text-gray-50">{f.mimeType}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleImportDriveFile(f)}>
                  Import
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
