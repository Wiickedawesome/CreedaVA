"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { parseAiJson } from "@/lib/utils/ai-json";
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
import { AIPromptButton } from "@/components/admin";
import type { ForumThread } from "@/lib/types/content";
import { useAuth } from "@/lib/firebase/auth-context";
import { uploadImage } from "@/lib/firebase/storage";
import { cloudListDriveFiles } from "@/lib/firebase/cloud-functions";
import { translateThreadInBackground } from "@/lib/firebase/translate";
import Image from "next/image";

export default function ForumPage() {
  const { data: threads, loading, add, edit, del } = useCollection<ForumThread>("forum", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const [tab, setTab] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<ForumThread | null>(null);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    title: string;
    content: string;
    tags: string;
    images: string[];
    links: string[];
  }>({ title: "", content: "", tags: "", images: [], links: [] });
  const [creating, setCreating] = useState(false);
  const [linkInput, setLinkInput] = useState("");

  const [uploading, setUploading] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<{ id: string; name: string; mimeType: string; thumbnail?: string; webLink?: string }[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const filtered = threads
    .filter((t) => tab === "all" || t.status === tab)
    .filter(
      (t) =>
        !search ||
        (t.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (t.author ?? "").toLowerCase().includes(search.toLowerCase()),
    );

  const tabs = [
    { label: "All", value: "all", badge: threads.length },
    { label: "Open", value: "open", badge: threads.filter((t) => t.status === "open").length },
    { label: "Flagged", value: "flagged", badge: threads.filter((t) => t.status === "flagged").length },
    { label: "Closed", value: "closed", badge: threads.filter((t) => t.status === "closed").length },
  ];

  async function handleCreate() {
    if (!createForm.title.trim()) {
      toast("Title is required", "error");
      return;
    }
    if (!createForm.content.trim()) {
      toast("Content is required", "error");
      return;
    }
    setCreating(true);
    try {
      const title = createForm.title.trim();
      const content = createForm.content.trim();
      const docId = await add({
        title,
        content,
        author: user?.displayName || "Admin",
        authorId: user?.uid || "",
        authorEmail: user?.email || "",
        status: "open" as const,
        replies: 0,
        likes: 0,
        likedBy: [],
        tags: createForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        images: createForm.images,
        links: createForm.links,
        lang: "en",
      });
      // Auto-translate in the background
      translateThreadInBackground(docId, title, content, "en");
      toast("Forum thread created");
      setCreateOpen(false);
      setCreateForm({ title: "", content: "", tags: "", images: [], links: [] });
    } catch {
      toast("Failed to create thread", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleForumImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadImage(file, "forum/new");
        urls.push(result.url);
      }
      setCreateForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      toast(`${urls.length} image(s) uploaded`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeForumImage(index: number) {
    setCreateForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  function addForumLink() {
    const url = linkInput.trim();
    if (!url) return;
    setCreateForm((prev) => ({ ...prev, links: [...prev.links, url] }));
    setLinkInput("");
  }

  function removeForumLink(index: number) {
    setCreateForm((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  }

  async function handleForumBrowseDrive() {
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

  function handleForumImportDrive(file: { id: string; name: string; mimeType: string; webLink?: string }) {
    if (file.mimeType?.startsWith("image/") && file.webLink) {
      setCreateForm((prev) => ({ ...prev, images: [...prev.images, file.webLink!] }));
      toast(`Imported image: ${file.name}`);
    } else if (file.webLink) {
      setCreateForm((prev) => ({ ...prev, links: [...prev.links, file.webLink!] }));
      toast(`Imported link: ${file.name}`);
    }
    setDriveOpen(false);
  }

  // ── Detail modal edit handlers (for existing threads) ──
  const detailImageRef = useRef<HTMLInputElement>(null);
  const [detailLinkInput, setDetailLinkInput] = useState("");

  async function handleDetailImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !selected) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadImage(file, `forum/${selected.id}`);
        urls.push(result.url);
      }
      const updated = [...(selected.images || []), ...urls];
      await edit(selected.id, { images: updated });
      setSelected({ ...selected, images: updated });
      toast(`${urls.length} image(s) uploaded`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function removeDetailImage(index: number) {
    if (!selected) return;
    const updated = (selected.images || []).filter((_, i) => i !== index);
    await edit(selected.id, { images: updated });
    setSelected({ ...selected, images: updated });
  }

  async function addDetailLink() {
    if (!selected || !detailLinkInput.trim()) return;
    const updated = [...(selected.links || []), detailLinkInput.trim()];
    await edit(selected.id, { links: updated });
    setSelected({ ...selected, links: updated });
    setDetailLinkInput("");
    toast("Link added");
  }

  async function removeDetailLink(index: number) {
    if (!selected) return;
    const updated = (selected.links || []).filter((_, i) => i !== index);
    await edit(selected.id, { links: updated });
    setSelected({ ...selected, links: updated });
  }

  async function handleDetailBrowseDrive() {
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

  async function handleDetailImportDrive(file: { id: string; name: string; mimeType: string; webLink?: string }) {
    if (!selected || !file.webLink) return;
    if (file.mimeType?.startsWith("image/")) {
      const updated = [...(selected.images || []), file.webLink];
      await edit(selected.id, { images: updated });
      setSelected({ ...selected, images: updated });
      toast(`Imported image: ${file.name}`);
    } else {
      const updated = [...(selected.links || []), file.webLink];
      await edit(selected.id, { links: updated });
      setSelected({ ...selected, links: updated });
      toast(`Imported link: ${file.name}`);
    }
    setDriveOpen(false);
  }

  // Context flag for whether drive import targets create form or detail
  const [driveTarget, setDriveTarget] = useState<"create" | "detail">("create");

  async function handleStatus(status: ForumThread["status"]) {
    if (!selected) return;
    try {
      await edit(selected.id, { status });
      toast(`Thread ${status}`);
      setDetailOpen(false);
    } catch {
      toast("Failed to update", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Thread deleted");
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<ForumThread>[] = [
    {
      key: "title",
      header: "Thread",
      render: (t) => (
        <div className="flex items-center gap-2">
          {(t.images?.length ?? 0) > 0 ? (
            <div className="relative w-8 h-8 shrink-0">
              <Image src={t.images![0]} alt={`${t.title} image`} fill className="rounded object-cover" />
            </div>
          ) : (t.links?.length ?? 0) > 0 ? (
            <svg className="w-5 h-5 text-gray-30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
          ) : null}
          <div>
            <p className="text-sm font-medium text-gray-90">{t.title}</p>
            <p className="text-xs text-gray-40">by {t.author}</p>
          </div>
        </div>
      ),
    },
    {
      key: "replies",
      header: "Replies",
      render: (t) => <span className="text-sm text-gray-80">{t.replies}</span>,
    },
    {
      key: "tags",
      header: "Tags",
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-gray-10 text-gray-60 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (t) => (
        <StatusBadge
          status={t.status}
          variant={t.status === "open" ? "success" : t.status === "flagged" ? "error" : "default"}
        />
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
        title="Forum"
        description="Moderate community discussions"
        actions={
          <div className="flex items-center gap-2">
            <AIPromptButton
              section="Forum AI"
              description="Generate a discussion-starter thread with AI. The post will spark community engagement around virtual assistant topics."
              placeholder="e.g. Best practices for delegating tasks to a virtual assistant"
              presets={[
                { label: "VA Tips", prompt: "Best practices for delegating tasks effectively to a virtual assistant" },
                { label: "Remote Work", prompt: "How remote work is changing the future of business operations" },
                { label: "Productivity", prompt: "Top productivity hacks for entrepreneurs working with virtual teams" },
                { label: "Hiring Guide", prompt: "What to look for when hiring a virtual assistant for the first time" },
                { label: "Time Management", prompt: "Time management strategies for business owners who work with VAs" },
                { label: "Tool Review", prompt: "Best collaboration tools for managing virtual assistant workflows in 2026" },
                { label: "Industry Q&A", prompt: "Common questions and misconceptions about the virtual assistant industry" },
                { label: "Success Stories", prompt: "How small businesses transformed their operations with virtual assistant support" },
              ]}
              onResult={(raw) => {
                try {
                  const result = parseAiJson<{ title: string; content: string; tags: string[] }>(raw);
                  setCreateForm({
                    title: result.title,
                    content: result.content,
                    tags: result.tags.join(", "),
                    images: [],
                    links: [],
                  });
                  setCreateOpen(true);
                } catch {
                  toast("AI generation failed — try again", "error");
                }
              }}
              buildPrompt={(input) =>
                buildTrainedPrompt("Forum", `Generate a forum discussion thread about: "${input}"\n\nReturn ONLY valid JSON with:\n- title: engaging discussion title (a question or provocative statement)\n- content: opening post body as rich HTML. Use <h3>, <p>, <strong>, <em>, <ul>, <li>, <blockquote> tags for structure.\n  Include: a compelling hook paragraph, 3-5 sections with bold subheadings, bullet lists for key points,\n  a blockquote with an insight or stat, and a closing paragraph with a discussion question.\n  Use inline styles for visual flair: colored borders on blockquotes (border-left:4px solid #005148),\n  highlighted key phrases (<strong style="color:#005148">), and well-spaced sections (margin-bottom:16px on paragraphs).\n- tags: array of 3-5 relevant tags (lowercase, no spaces — use hyphens)\n\nReturn ONLY valid JSON, no markdown fences.`, "", { includeCompetitors: true, includeForumRules: true })
              }
            />
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              + Create Forum
            </Button>
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search threads…"
            className="w-full rounded-lg border border-border bg-gray-10/50 py-2 pl-10 pr-3 text-sm text-gray-80 placeholder:text-gray-40 focus:border-primary focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(t) => t.id}
        onRowClick={(t) => {
          setSelected(t);
          setDetailOpen(true);
        }}
        emptyMessage="No forum threads yet — they&apos;ll appear here when users post"
      />

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected?.title || "Thread"}
        size="lg"
        footer={
          <>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            {selected?.status === "open" && (
              <Button variant="outline" size="sm" onClick={() => handleStatus("closed")}>
                Close Thread
              </Button>
            )}
            {selected?.status === "flagged" && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleStatus("open")}>
                  Unflag
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleStatus("closed")}>
                  Close
                </Button>
              </>
            )}
            {selected?.status === "closed" && (
              <Button variant="outline" size="sm" onClick={() => handleStatus("open")}>
                Reopen
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge
                status={selected.status}
                variant={selected.status === "flagged" ? "error" : selected.status === "open" ? "success" : "default"}
              />
              <span className="text-xs text-gray-40">{selected.replies} replies</span>
            </div>
            <div>
              <p className="text-xs text-gray-50">Author</p>
              <p className="text-sm text-gray-80">{selected.author} ({selected.authorEmail})</p>
            </div>
            <div>
              <p className="text-xs text-gray-50">Content</p>
              <div className="mt-1 rounded-lg border border-border p-4 text-sm text-gray-80 whitespace-pre-wrap">
                {selected.content}
              </div>
            </div>
            {selected.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-10 text-gray-60 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Images (editable) ──────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-50">Images</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => detailImageRef.current?.click()} isLoading={uploading}>
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    Upload
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setDriveTarget("detail"); handleDetailBrowseDrive(); }} isLoading={driveLoading}>
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                    Drive
                  </Button>
                  <input ref={detailImageRef} type="file" accept="image/*" multiple className="hidden" aria-label="Upload thread images" onChange={handleDetailImageUpload} />
                </div>
              </div>
              {(selected.images?.length ?? 0) > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {selected.images!.map((url, i) => (
                    <div key={i} className="relative group w-full h-20">
                      <Image src={url} alt={`Thread image ${i + 1}`} fill className="rounded-lg object-cover" />
                      <button
                        onClick={() => removeDetailImage(i)}
                        className="absolute top-1 right-1 bg-gray-10/90 text-gray-60 rounded p-0.5 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-40">No images</p>
              )}
            </div>

            {/* ── Links (editable) ────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-50">Links</p>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="url"
                  value={detailLinkInput}
                  onChange={(e) => setDetailLinkInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDetailLink(); } }}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-80 placeholder:text-gray-40 focus:border-primary focus:outline-none"
                />
                <Button variant="outline" size="sm" onClick={addDetailLink}>
                  + Add
                </Button>
              </div>
              {(selected.links?.length ?? 0) > 0 ? (
                <div className="space-y-1">
                  {selected.links!.map((url, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-10 text-sm">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 text-gray-70 hover:text-primary">
                        <svg className="w-4 h-4 text-gray-40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                        <span className="truncate">{url}</span>
                      </a>
                      <button
                        onClick={() => removeDetailLink(i)}
                        className="text-gray-40 hover:text-red-500 shrink-0 ml-2"
                        aria-label="Remove link"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-40">No links</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Thread"
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
          Delete this thread? This cannot be undone.
        </p>
      </Modal>

      {/* Create Forum Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Forum Thread"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => { setDriveTarget("create"); handleForumBrowseDrive(); }} isLoading={driveLoading}>
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
              Drive
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} isLoading={creating}>
              Create Thread
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            placeholder="Thread title"
          />
          <div>
            <label className="block text-sm font-medium text-gray-70 mb-1">Content</label>
            <textarea
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-gray-80 placeholder:text-gray-40 focus:border-primary focus:outline-none min-h-30"
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              placeholder="Thread content..."
            />
          </div>
          <Input
            label="Tags (comma-separated)"
            value={createForm.tags}
            onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
            placeholder="general, support, feature-request"
          />

          {/* ── Images ──────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-100">Images</label>
              <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} isLoading={uploading}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                Upload
              </Button>
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" aria-label="Upload forum thread images" onChange={handleForumImageUpload} />
            </div>
            {createForm.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {createForm.images.map((url, i) => (
                  <div key={i} className="relative group w-full h-20">
                    <Image src={url} alt={`Forum image ${i + 1}`} fill className="rounded-lg object-cover" />
                    <button
                      onClick={() => removeForumImage(i)}
                      className="absolute top-1 right-1 bg-gray-10/90 text-gray-60 rounded p-0.5 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-40">No images — upload or import from Drive</p>
            )}
          </div>

          {/* ── Links ──────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-100">Links</label>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addForumLink(); } }}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-80 placeholder:text-gray-40 focus:border-primary focus:outline-none"
              />
              <Button variant="outline" size="sm" onClick={addForumLink}>
                + Add
              </Button>
            </div>
            {createForm.links.length > 0 ? (
              <div className="space-y-1">
                {createForm.links.map((url, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-10 text-sm">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 text-gray-70 hover:text-primary">
                      <svg className="w-4 h-4 text-gray-40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                      <span className="truncate">{url}</span>
                    </a>
                    <button onClick={() => removeForumLink(i)} className="text-gray-40 hover:text-red-500 shrink-0 ml-2" aria-label="Remove link">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-40">No links</p>
            )}
          </div>
        </div>
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
                      <Image src={f.thumbnail} alt={`${f.name} preview`} fill className="rounded object-cover" />
                    </div>
                  ) : (
                    <svg className="w-8 h-8 text-gray-30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-100 truncate">{f.name}</p>
                    <p className="text-xs text-gray-40">{f.mimeType}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => driveTarget === "detail" ? handleDetailImportDrive(f) : handleForumImportDrive(f)}>
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
