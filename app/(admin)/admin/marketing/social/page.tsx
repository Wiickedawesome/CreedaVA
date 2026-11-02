"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { parseAiJson } from "@/lib/utils/ai-json";
import { useState } from "react";
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
import type { SocialPost } from "@/lib/types/content";

const platformIcon: Record<string, string> = {
  linkedin: "in",
  twitter: "𝕏",
  facebook: "f",
  instagram: "ig",
};

export default function SocialMediaPage() {
  const { data: posts, loading, add, edit, del } = useCollection<SocialPost>("social-posts", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<SocialPost | null>(null);
  const [editForm, setEditForm] = useState({ content: "", hashtags: "" });
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ platform: "linkedin", content: "", hashtags: "" });

  // AI generation
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previews, setPreviews] = useState<
    { platform: string; content: string; hashtags: string[]; characterCount: number }[]
  >([]);

  const filtered = posts.filter((p) => tab === "all" || p.status === tab);

  const tabs = [
    { label: "All", value: "all", badge: posts.length },
    { label: "Draft", value: "draft", badge: posts.filter((p) => p.status === "draft").length },
    { label: "Scheduled", value: "scheduled", badge: posts.filter((p) => p.status === "scheduled").length },
    { label: "Published", value: "published", badge: posts.filter((p) => p.status === "published").length },
  ];

  async function handleSavePost(preview: {
    platform: string;
    content: string;
    hashtags: string[];
  }) {
    try {
      await add({
        topic: "AI Generated Content",
        platform: preview.platform,
        content: preview.content,
        hashtags: preview.hashtags,
        status: "draft" as const,
      });
      toast(`${preview.platform} post saved as draft`);
      setPreviews((prev) => prev.filter((p) => p.platform !== preview.platform));
    } catch {
      toast("Failed to save post", "error");
    }
  }

  async function handlePublish() {
    if (!selected) return;
    try {
      await edit(selected.id, { status: "published" as const });
      toast("Marked as published");
      setDetailOpen(false);
    } catch {
      toast("Failed to update", "error");
    }
  }

  async function handleSaveEdit() {
    if (!selected) return;
    setSaving(true);
    try {
      await edit(selected.id, {
        content: editForm.content,
        hashtags: editForm.hashtags.split(",").map(h => h.trim().replace(/^#/, "")).filter(Boolean),
      });
      toast("Post updated");
      setDetailOpen(false);
    } catch {
      toast("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Post deleted");
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCreatePost() {
    if (!createForm.content.trim()) return;
    setSaving(true);
    try {
      await add({
        topic: "",
        platform: createForm.platform,
        content: createForm.content,
        hashtags: createForm.hashtags.split(",").map(h => h.trim().replace(/^#/, "")).filter(Boolean),
        status: "draft" as const,
      });
      toast("Post created as draft");
      setCreateOpen(false);
      setCreateForm({ platform: "linkedin", content: "", hashtags: "" });
    } catch {
      toast("Failed to create", "error");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<SocialPost>[] = [
    {
      key: "platform",
      header: "Platform",
      className: "w-20",
      render: (p) => (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {platformIcon[p.platform] || p.platform.charAt(0).toUpperCase()}
        </span>
      ),
    },
    {
      key: "content",
      header: "Content",
      render: (p) => (
        <p className="text-sm text-gray-80 truncate max-w-md">{p.content}</p>
      ),
    },
    {
      key: "hashtags",
      header: "Hashtags",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.hashtags?.slice(0, 3).map((h) => (
            <span key={h} className="text-xs text-primary">#{h}</span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusBadge
          status={p.status}
          variant={p.status === "published" ? "success" : p.status === "scheduled" ? "info" : "default"}
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
        title="Social Media"
        description="AI-generated social posts for all your platforms"
        actions={
          <div className="flex items-center gap-2">
          <AIPromptButton
            section="Social AI"
            description="Generate social media posts for LinkedIn, Twitter, Facebook, and Instagram. AI creates platform-optimized content with hashtags."
            placeholder="What should the posts be about? e.g. 'Benefits of hiring a virtual assistant'"
            presets={[
              { label: "VA Benefits", prompt: "Top benefits of hiring a virtual assistant for small businesses" },
              { label: "Client Success", prompt: "Share a client success story about how virtual assistants transformed their business" },
              { label: "Tips & Tricks", prompt: "Quick productivity tips for entrepreneurs who work with virtual teams" },
              { label: "Behind the Scenes", prompt: "A behind-the-scenes look at how CreedaVA's virtual assistants handle daily operations for clients" },
              { label: "Industry Stats", prompt: "Share compelling statistics about the virtual assistant industry growth and remote work trends in 2026" },
              { label: "FAQ Post", prompt: "Answer a common question about virtual assistant services in an engaging social media post format" },
              { label: "Holiday Campaign", prompt: "Create a seasonal or holiday-themed social media post promoting virtual assistant services during busy business periods" },
              { label: "Poll / Engagement", prompt: "Create an engaging poll or question post that sparks conversation about delegation, productivity, or business growth" },
            ]}
            onResult={(raw) => {
              try {
                setPreviews(parseAiJson<{ posts?: typeof previews }>(raw).posts || []);
                setPreviewOpen(true);
              } catch {
                toast("AI returned an unreadable response — try again", "error");
              }
            }}
            buildPrompt={(input) =>
              buildTrainedPrompt("Social Media", `Create social media posts about: "${input}"\n\nReturn ONLY valid JSON: { "posts": [{ "platform": "linkedin"|"twitter"|"facebook"|"instagram", "content": string, "hashtags": string[], "characterCount": number }] }\nGenerate one post per platform. No markdown fences.`, "", { includeCompetitors: true })
            }
          />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Post
          </Button>
          </div>
        }
      />

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => {
          setSelected(p);
          setEditForm({
            content: p.content,
            hashtags: (p.hashtags || []).join(", "),
          });
          setDetailOpen(true);
        }}
        emptyMessage="No social posts yet — let AI create some"
      />

      {/* AI Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Generated Social Posts"
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)}>
            Close
          </Button>
        }
      >
        {previews.length === 0 ? (
          <p className="text-sm text-gray-50 text-center py-6">All posts saved!</p>
        ) : (
          <div className="space-y-4">
            {previews.map((p, idx) => (
              <div key={p.platform} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {platformIcon[p.platform] || p.platform.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-90 capitalize">{p.platform}</span>
                    <span className="text-xs text-gray-50">{p.content.length} chars</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleSavePost(previews[idx])}>
                    Save Draft
                  </Button>
                </div>
                <textarea
                  className="w-full rounded-lg border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80 placeholder:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={3}
                  value={p.content}
                  onChange={(e) => {
                    setPreviews(prev => prev.map((item, i) => i === idx ? { ...item, content: e.target.value, characterCount: e.target.value.length } : item));
                  }}
                />
                <div className="mt-2">
                  <input
                    className="w-full rounded-lg border border-border bg-gray-10/50 px-3 py-1.5 text-xs text-primary placeholder:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={p.hashtags.map(h => `#${h}`).join(" ")}
                    onChange={(e) => {
                      const tags = e.target.value.split(/[\s,]+/).map(h => h.replace(/^#/, "")).filter(Boolean);
                      setPreviews(prev => prev.map((item, i) => i === idx ? { ...item, hashtags: tags } : item));
                    }}
                    placeholder="#hashtag1 #hashtag2"
                    aria-label="Hashtags for this post"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Detail / Edit Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Edit Post"
        footer={
          <>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            {selected?.status === "draft" && (
              <Button variant="outline" size="sm" onClick={handlePublish}>
                Mark Published
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} isLoading={saving}>
              Update
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {platformIcon[selected.platform] || selected.platform.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium capitalize">{selected.platform}</span>
              <StatusBadge
                status={selected.status}
                variant={selected.status === "published" ? "success" : "default"}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-70 mb-1">Content</label>
              <textarea
                className="w-full rounded-lg border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80 placeholder:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={4}
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-70 mb-1">Hashtags (comma-separated)</label>
              <input
                className="w-full rounded-lg border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80 placeholder:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={editForm.hashtags}
                onChange={(e) => setEditForm({ ...editForm, hashtags: e.target.value })}
                placeholder="e.g. VirtualAssistant, Productivity, Business"
                aria-label="Hashtags (comma-separated)"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Create Post Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Social Post"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreatePost} isLoading={saving}>
              Save Draft
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-70 mb-1">Platform</label>
            <select
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80"
              value={createForm.platform}
              onChange={(e) => setCreateForm({ ...createForm, platform: e.target.value })}
              aria-label="Platform"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter / X</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-70 mb-1">Content</label>
            <textarea
              className="w-full rounded-lg border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80 placeholder:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              rows={4}
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              placeholder="Write your social post..."
            />
          </div>
          <Input
            label="Hashtags (comma-separated)"
            value={createForm.hashtags}
            onChange={(e) => setCreateForm({ ...createForm, hashtags: e.target.value })}
            placeholder="e.g. VirtualAssistant, Productivity, Business"
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Post"
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
          Delete this {selected?.platform} post? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
