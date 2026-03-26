"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import React, { useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  DashboardSection,
  StatCard,
  Modal,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { AIPromptButton } from "@/components/admin";
import { lazySuggestKeywords as suggestKeywords } from "@/lib/firebase/ai-lazy";
import { cloudFetchSearchConsoleData } from "@/lib/firebase/cloud-functions";
import type { SEOKeyword } from "@/lib/types/content";

const intentVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  informational: "info",
  commercial: "warning",
  transactional: "success",
  navigational: "default",
};

const difficultyVariant: Record<string, "default" | "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
};

export default function KeywordsPage() {
  const { data: keywords, loading, add, edit, del } = useCollection<SEOKeyword>("keywords", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<SEOKeyword | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ keyword: "", searchIntent: "informational" as string, difficulty: "medium" as string, suggestedTitle: "" });
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ keyword: "", searchIntent: "informational", difficulty: "medium", suggestedTitle: "" });

  // AI generation
  const [suggestions, setSuggestions] = useState<
    { keyword: string; searchIntent: string; difficulty: string; suggestedTitle: string }[]
  >([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [fetchingConsole, setFetchingConsole] = useState(false);
  const [consoleData, setConsoleData] = useState<{
    queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
    summary: { totalClicks: number; totalImpressions: number; avgCTR: number; avgPosition: number };
  } | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);

  async function handleFetchConsole() {
    setFetchingConsole(true);
    try {
      const result = await cloudFetchSearchConsoleData(28);
      if (result.success) {
        setConsoleData({ queries: result.queries, summary: result.summary });
        setConsoleOpen(true);
        // Persist metrics to existing keyword records
        const now = new Date().toISOString();
        let synced = 0;
        for (const q of result.queries) {
          const match = keywords.find((k) => k.keyword.toLowerCase() === q.query.toLowerCase());
          if (match) {
            await edit(match.id, {
              clicks: q.clicks,
              impressions: q.impressions,
              ctr: q.ctr,
              position: q.position,
              lastSynced: now,
            });
            synced++;
          }
        }
        const msg = synced > 0
          ? `Fetched ${result.queries.length} queries, synced metrics to ${synced} keywords`
          : `Fetched ${result.queries.length} search queries from Google Search Console`;
        toast(msg, "success");
      } else {
        toast("Fetch failed — check Search Console integration", "error");
      }
    } catch {
      toast("Failed to fetch — ensure Search Console is configured in Settings → Integrations", "error");
    } finally {
      setFetchingConsole(false);
    }
  }

  async function handleAddConsoleKeyword(q: { query: string; clicks: number; impressions: number; ctr: number; position: number }) {
    try {
      await add({
        keyword: q.query,
        searchIntent: q.ctr > 0.05 ? "transactional" as const : "informational" as const,
        difficulty: q.position < 10 ? "low" as const : q.position < 30 ? "medium" as const : "high" as const,
        suggestedTitle: `Optimize for "${q.query}" — ${q.clicks} clicks, position ${q.position.toFixed(1)}`,
        tracked: true,
      });
      toast(`Added "${q.query}" from Search Console`);
      setConsoleData((prev) =>
        prev ? { ...prev, queries: prev.queries.filter((x) => x.query !== q.query) } : null,
      );
    } catch {
      toast("Failed to add keyword", "error");
    }
  }

  const filtered = keywords.filter((k) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return k.keyword.toLowerCase().includes(q) || k.suggestedTitle?.toLowerCase().includes(q);
  });

  async function handleAddKeyword(kw: {
    keyword: string;
    searchIntent: string;
    difficulty: string;
    suggestedTitle: string;
  }) {
    try {
      await add({
        keyword: kw.keyword,
        searchIntent: kw.searchIntent as SEOKeyword["searchIntent"],
        difficulty: kw.difficulty as SEOKeyword["difficulty"],
        suggestedTitle: kw.suggestedTitle,
        tracked: true,
      });
      toast(`Added "${kw.keyword}"`);
      // Remove from suggestions
      setSuggestions((prev) => prev.filter((s) => s.keyword !== kw.keyword));
    } catch {
      toast("Failed to add keyword", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Keyword removed");
      setDeleteOpen(false);
      setEditOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete keyword", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(kw: SEOKeyword) {
    setSelected(kw);
    setEditForm({
      keyword: kw.keyword,
      searchIntent: kw.searchIntent,
      difficulty: kw.difficulty,
      suggestedTitle: kw.suggestedTitle || "",
    });
    setEditOpen(true);
  }

  async function handleUpdateKeyword() {
    if (!selected) return;
    setSaving(true);
    try {
      await edit(selected.id, {
        keyword: editForm.keyword,
        searchIntent: editForm.searchIntent as SEOKeyword["searchIntent"],
        difficulty: editForm.difficulty as SEOKeyword["difficulty"],
        suggestedTitle: editForm.suggestedTitle,
      });
      toast("Keyword updated");
      setEditOpen(false);
    } catch {
      toast("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateKeyword() {
    if (!createForm.keyword.trim()) return;
    setSaving(true);
    try {
      await add({
        keyword: createForm.keyword,
        searchIntent: createForm.searchIntent as SEOKeyword["searchIntent"],
        difficulty: createForm.difficulty as SEOKeyword["difficulty"],
        suggestedTitle: createForm.suggestedTitle,
        tracked: true,
      });
      toast(`Added "${createForm.keyword}"`);
      setCreateOpen(false);
      setCreateForm({ keyword: "", searchIntent: "informational", difficulty: "medium", suggestedTitle: "" });
    } catch {
      toast("Failed to add keyword", "error");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<SEOKeyword>[] = [
    {
      key: "keyword",
      header: "Keyword",
      render: (k) => <span className="font-medium text-gray-90">{k.keyword}</span>,
    },
    {
      key: "searchIntent",
      header: "Intent",
      render: (k) => (
        <StatusBadge status={k.searchIntent} variant={intentVariant[k.searchIntent]} />
      ),
    },
    {
      key: "difficulty",
      header: "Difficulty",
      render: (k) => (
        <StatusBadge status={k.difficulty} variant={difficultyVariant[k.difficulty]} />
      ),
    },
    {
      key: "suggestedTitle",
      header: "Suggested Title",
      render: (k) => <span className="text-sm text-gray-70 truncate max-w-xs block">{k.suggestedTitle}</span>,
    },
    {
      key: "clicks",
      header: "Clicks",
      sortable: true,
      render: (k) => <span className="text-sm tabular-nums">{k.clicks ?? "—"}</span>,
    },
    {
      key: "impressions",
      header: "Impr.",
      sortable: true,
      render: (k) => <span className="text-sm tabular-nums">{k.impressions ?? "—"}</span>,
    },
    {
      key: "ctr",
      header: "CTR",
      sortable: true,
      render: (k) => <span className="text-sm tabular-nums">{k.ctr != null ? `${(k.ctr * 100).toFixed(1)}%` : "—"}</span>,
    },
    {
      key: "position",
      header: "Pos.",
      sortable: true,
      render: (k) => <span className="text-sm tabular-nums">{k.position != null ? k.position.toFixed(1) : "—"}</span>,
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
        title="Keywords"
        description="Track SEO keywords and get AI-powered suggestions"
        actions={
          <div className="flex items-center gap-2">
          <AIPromptButton
            section="Keyword AI"
            description="Enter a topic to get AI-powered keyword suggestions with search intent, difficulty, and suggested titles."
            placeholder="e.g. virtual assistant services, remote work, business outsourcing"
            presets={[
              { label: "VA Services", prompt: "virtual assistant services for small businesses" },
              { label: "Remote Work", prompt: "remote work productivity and tools" },
              { label: "Outsourcing", prompt: "business process outsourcing benefits" },
              { label: "Executive Support", prompt: "executive assistant services for CEOs and founders" },
              { label: "Cost Savings", prompt: "cost of hiring virtual assistant vs full-time employee" },
              { label: "Admin Tasks", prompt: "administrative tasks to delegate to virtual assistants" },
              { label: "Industry Specific", prompt: "virtual assistant for real estate agents and brokers" },
              { label: "Scaling Business", prompt: "scaling small business with virtual assistants and automation" },
            ]}
            onResult={(raw) => {
              try {
                const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
                const result = JSON.parse(cleaned);
                setSuggestions(result.keywords || []);
                setSuggestOpen(true);
              } catch {
                // Try direct suggestKeywords call
                suggestKeywords(raw.slice(0, 100)).then((r) => {
                  setSuggestions(r.keywords);
                  setSuggestOpen(true);
                }).catch(() => toast("AI generation failed", "error"));
              }
            }}
            buildPrompt={(input) =>
              buildTrainedPrompt("SEO Keywords", `Suggest 8-10 SEO keywords related to: "${input}"\n\nReturn ONLY valid JSON: { "keywords": [{ "keyword": string, "searchIntent": "informational"|"commercial"|"transactional"|"navigational", "difficulty": "low"|"medium"|"high", "suggestedTitle": string }] }\n\nNo markdown fences.`, "", { includeCompetitors: true })
            }
          />
          <Button variant="outline" size="sm" onClick={handleFetchConsole} isLoading={fetchingConsole}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            Search Console
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Keyword
          </Button>
          </div>
        }
      />

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Tracked" value={keywords.length.toString()} badge="keywords" />
        <StatCard
          label="Top Intent"
          value={(() => {
            const counts: Record<string, number> = {};
            keywords.forEach((k) => { counts[k.searchIntent] = (counts[k.searchIntent] || 0) + 1; });
            const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
            return top ? top[0] : "N/A";
          })()}
          badge="most common"
        />
        <StatCard
          label="High Difficulty"
          value={keywords.filter((k) => k.difficulty === "high").length.toString()}
          badge={`${keywords.filter((k) => k.difficulty === "low").length} easy`}
        />
        <StatCard
          label="Commercial"
          value={keywords.filter((k) => k.searchIntent === "commercial" || k.searchIntent === "transactional").length.toString()}
          badge="conversion intent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardSection title="By Intent">
          {(() => {
            const intents = ["informational", "commercial", "transactional", "navigational"];
            const colors = { informational: "#4589FF", commercial: "#F1C21B", transactional: "#198038", navigational: "#878D96" };
            return (
              <div className="space-y-3">
                {intents.map((intent) => {
                  const count = keywords.filter((k) => k.searchIntent === intent).length;
                  const pct = keywords.length > 0 ? Math.round((count / keywords.length) * 100) : 0;
                  return (
                    <div key={intent}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-80 capitalize">{intent}</span>
                        <span className="text-xs font-medium text-gray-60">{count} ({pct}%)</span>
                      </div>
                      <div className="h-3 bg-gray-10 rounded-full overflow-hidden">
                        <div className="bar-segment" style={{ '--bar-w': `${Math.max(pct, 2)}%`, '--bar-c': colors[intent as keyof typeof colors] || "#A2A9B0" } as React.CSSProperties} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </DashboardSection>

        <DashboardSection title="By Difficulty">
          {(() => {
            const diffs = ["low", "medium", "high"];
            const colors = { low: "#198038", medium: "#F1C21B", high: "#DA1E28" };
            return (
              <div className="space-y-3">
                {diffs.map((diff) => {
                  const count = keywords.filter((k) => k.difficulty === diff).length;
                  const pct = keywords.length > 0 ? Math.round((count / keywords.length) * 100) : 0;
                  return (
                    <div key={diff}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-80 capitalize">{diff}</span>
                        <span className="text-xs font-medium text-gray-60">{count} ({pct}%)</span>
                      </div>
                      <div className="h-3 bg-gray-10 rounded-full overflow-hidden">
                        <div className="bar-segment" style={{ '--bar-w': `${Math.max(pct, 2)}%`, '--bar-c': colors[diff as keyof typeof colors] } as React.CSSProperties} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </DashboardSection>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search tracked keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(k) => k.id}
        onRowClick={(k) => openEdit(k)}
        emptyMessage="No keywords tracked — use AI to suggest some"
      />

      {/* Create Keyword Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Keyword"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateKeyword} isLoading={saving}>
              Add Keyword
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Keyword" placeholder="e.g. virtual assistant services" value={createForm.keyword} onChange={(e) => setCreateForm({ ...createForm, keyword: e.target.value })} />
          <div>
            <label className="block text-xs font-medium text-gray-70 mb-1">Search Intent</label>
            <select
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80"
              value={createForm.searchIntent}
              onChange={(e) => setCreateForm({ ...createForm, searchIntent: e.target.value })}
              aria-label="Search intent"
            >
              <option value="informational">Informational</option>
              <option value="commercial">Commercial</option>
              <option value="transactional">Transactional</option>
              <option value="navigational">Navigational</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-70 mb-1">Difficulty</label>
            <select
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80"
              value={createForm.difficulty}
              onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value })}
              aria-label="Difficulty"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <Input label="Suggested Title" placeholder="Blog post title for this keyword" value={createForm.suggestedTitle} onChange={(e) => setCreateForm({ ...createForm, suggestedTitle: e.target.value })} />
        </div>
      </Modal>

      {/* Edit Keyword Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit: ${selected?.keyword || "Keyword"}`}
        footer={
          <>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdateKeyword} isLoading={saving}>
              Update
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Keyword" value={editForm.keyword} onChange={(e) => setEditForm({ ...editForm, keyword: e.target.value })} />
          <div>
            <label className="block text-xs font-medium text-gray-70 mb-1">Search Intent</label>
            <select
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80"
              value={editForm.searchIntent}
              onChange={(e) => setEditForm({ ...editForm, searchIntent: e.target.value })}
              aria-label="Search intent"
            >
              <option value="informational">Informational</option>
              <option value="commercial">Commercial</option>
              <option value="transactional">Transactional</option>
              <option value="navigational">Navigational</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-70 mb-1">Difficulty</label>
            <select
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80"
              value={editForm.difficulty}
              onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
              aria-label="Difficulty"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <Input label="Suggested Title" value={editForm.suggestedTitle} onChange={(e) => setEditForm({ ...editForm, suggestedTitle: e.target.value })} />
        </div>
      </Modal>

      {/* AI Suggestions Modal */}
      <Modal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        title="AI Keyword Suggestions"
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setSuggestOpen(false)}>
            Close
          </Button>
        }
      >
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-50 text-center py-6">All keywords added!</p>
        ) : (
          <div className="divide-y divide-border">
            {suggestions.map((kw) => (
              <div key={kw.keyword} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-90">{kw.keyword}</p>
                  <p className="text-xs text-gray-50 truncate">{kw.suggestedTitle}</p>
                </div>
                <StatusBadge status={kw.searchIntent} variant={intentVariant[kw.searchIntent]} />
                <StatusBadge status={kw.difficulty} variant={difficultyVariant[kw.difficulty]} />
                <Button size="sm" variant="outline" onClick={() => handleAddKeyword(kw)}>
                  + Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Remove Keyword"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-70">
          Remove <strong>{selected?.keyword}</strong> from tracked keywords?
        </p>
      </Modal>

      {/* Search Console Results Modal */}
      <Modal
        open={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        title="Google Search Console Data"
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setConsoleOpen(false)}>
            Close
          </Button>
        }
      >
        {consoleData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-gray-50">Total Clicks</p>
                <p className="text-lg font-semibold text-gray-90">{consoleData.summary.totalClicks.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-gray-50">Impressions</p>
                <p className="text-lg font-semibold text-gray-90">{consoleData.summary.totalImpressions.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-gray-50">Avg CTR</p>
                <p className="text-lg font-semibold text-gray-90">{(consoleData.summary.avgCTR * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-gray-50">Avg Position</p>
                <p className="text-lg font-semibold text-gray-90">{consoleData.summary.avgPosition.toFixed(1)}</p>
              </div>
            </div>
            <p className="text-xs text-gray-50">Top search queries — click + Add to track</p>
            {consoleData.queries.length === 0 ? (
              <p className="text-sm text-gray-50 text-center py-6">All queries imported!</p>
            ) : (
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {consoleData.queries.map((q) => (
                  <div key={q.query} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-90 truncate">{q.query}</p>
                      <p className="text-xs text-gray-50">{q.clicks} clicks · {q.impressions} impr · pos {q.position.toFixed(1)}</p>
                    </div>
                    <span className="text-xs text-gray-40">{(q.ctr * 100).toFixed(1)}% CTR</span>
                    <Button size="sm" variant="outline" onClick={() => handleAddConsoleKeyword(q)}>
                      + Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
