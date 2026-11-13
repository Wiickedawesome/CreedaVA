"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import type { TrainedPrompt } from "@/lib/utils/ai-system-prompt";
import React, { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  DashboardSection,
  StatCard,
  Modal,
  AdminTabs,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { AIPromptButton } from "@/components/admin";
import { cloudFetchSearchConsoleData } from "@/lib/firebase/cloud-functions";
import { createWithId } from "@/lib/firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import type { SEOKeyword } from "@/lib/types/content";
import type { KeywordGap } from "@/lib/types/seo-agent";
import { parseAiJson } from "@/lib/utils/ai-json";
import {
  latestMetricsByKeyword,
  rankDayKey,
  rankHistoryId,
  type RankHistoryRow,
} from "@/lib/utils/rank-history";
import { RankingsTable } from "./rankings-table";
// The agent's `keyword-gaps` skill output. It renders as a sub-tab here because
// gaps are keyword data — they were a separate hub tab, which split one subject
// across two screens.
import KeywordGapsSection from "./keyword-gaps-section";

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

/** Fallback prompts for a site with no gap data yet. */
const DEFAULT_PRESETS = [
  { label: "VA Services", prompt: "virtual assistant services for small businesses" },
  { label: "Remote Work", prompt: "remote work productivity and tools" },
  { label: "Outsourcing", prompt: "business process outsourcing benefits" },
  { label: "Executive Support", prompt: "executive assistant services for CEOs and founders" },
  { label: "Cost Savings", prompt: "cost of hiring virtual assistant vs full-time employee" },
  { label: "Admin Tasks", prompt: "administrative tasks to delegate to virtual assistants" },
  { label: "Industry Specific", prompt: "virtual assistant for real estate agents and brokers" },
  { label: "Scaling Business", prompt: "scaling small business with virtual assistants and automation" },
];

/** Instructions that keep suggestions anchored to observed demand. */
function buildKeywordPrompt(topic: string, dataContext: string): TrainedPrompt {
  return buildTrainedPrompt(
    "SEO Keywords",
    `Suggest 8-10 SEO keywords related to: "${topic}"

` +
      `Ground every suggestion in the data above. Prefer terms that extend the KEYWORD GAPS and ` +
      `SEO KEYWORDS already listed, and reuse the business's real services and locations. Do not ` +
      `propose unrelated industries, generic marketing buzzwords, or terms already in the tracked ` +
      `keyword list.

` +
      `Return ONLY valid JSON: { "keywords": [{ "keyword": string, "searchIntent": "informational"|"commercial"|"transactional"|"navigational", "difficulty": "low"|"medium"|"high", "suggestedTitle": string }] }

No markdown fences.`,
    dataContext,
    { includeCompetitors: true },
  );
}

export default function KeywordsSection() {
  const { data: keywords, loading, add, edit, del } = useCollection<SEOKeyword>("keywords", {
    orderByField: "createdAt",
  });
  // The agent's gap findings. They become the AI's starting points so suggestions
  // extend real demand instead of drifting into unrelated industries.
  const { data: gaps } = useCollection<KeywordGap>("keyword-gaps", {
    orderByField: "priority",
    orderDirection: "desc",
  });
  // Measurements. `rank-history` is the single source of truth for clicks,
  // impressions, CTR and position — written by both the agent's `rank-history`
  // skill and the Search Console button below, in the same shape.
  const { data: rankRows, refetch: refetchRankRows } = useCollection<RankHistoryRow>("rank-history", {
    orderByField: "dayKey",
    orderDirection: "desc",
  });
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") ?? "keywords";
  const [tab, setTab] = useState(initialTab);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<SEOKeyword | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ keyword: "", searchIntent: "informational" as string, difficulty: "medium" as string, suggestedTitle: "" });
  const [saving, setSaving] = useState(false);
  const [addingAll, setAddingAll] = useState(false);
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
      if (!result.success) {
        toast("Fetch failed — check Search Console integration", "error");
        return;
      }

      setConsoleData({ queries: result.queries, summary: result.summary });
      setConsoleOpen(true);

      // Persist as rank-history rows, not onto the keyword docs.
      //
      // The agent's `rank-history` skill already writes this collection as a
      // time series. Flattening the same numbers onto `keywords` meant two
      // stores of one measurement, with this button silently overwriting the
      // agent's. Same shape, same id format, so both upsert the same rows.
      const dayKey = rankDayKey();
      const trackedByKeyword = new Map(
        keywords.map((k) => [k.keyword.toLowerCase(), k] as const),
      );

      let synced = 0;

      // Prefer the (query, page) rows: they carry the landing page, so each
      // measurement maps to the agent's rank-history key exactly. Older cloud
      // deployments return no `queryPages`, so fall back to the aggregated
      // `queries` rows with an empty page rather than dropping the sync.
      const measurements = result.queryPages?.length
        ? result.queryPages.map((row) => ({
            keyword: row.query,
            page: row.page,
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          }))
        : result.queries.map((row) => ({
            keyword: row.query,
            page: "",
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          }));

      for (const measurement of measurements) {
        if (!trackedByKeyword.has(measurement.keyword.toLowerCase())) continue;
        // `createWithId` merges on a stable id — `add()` would use addDoc and
        // mint a random id, appending a duplicate row on every sync.
        await createWithId<DocumentData>(
          "rank-history",
          rankHistoryId(dayKey, measurement.keyword, measurement.page),
          {
            keyword: measurement.keyword,
            page: measurement.page,
            position: measurement.position,
            clicks: measurement.clicks,
            impressions: measurement.impressions,
            ctr: measurement.ctr,
            dayKey,
            capturedAt: new Date().toISOString(),
          },
        );
        synced++;
      }
      if (synced > 0) refetchRankRows();

      toast(
        synced > 0
          ? `Fetched ${measurements.length} rows · saved ${synced} measurements`
          : `Fetched ${measurements.length} rows — none match a tracked keyword yet`,
        "success",
      );
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

  // Presets come from the agent's highest-priority gaps once it has data, so the
  // quick-start chips point at real opportunities instead of a fixed list.
  const aiPresets = useMemo(() => {
    const fromGaps = gaps
      .filter((g) => g.keyword && !keywords.some((k) => k.keyword.toLowerCase() === g.keyword.toLowerCase()))
      .slice(0, 8)
      .map((g) => ({
        label: g.keyword.length > 22 ? `${g.keyword.slice(0, 21)}…` : g.keyword,
        prompt: g.keyword,
      }));
    return fromGaps.length > 0 ? fromGaps : DEFAULT_PRESETS;
  }, [gaps, keywords]);

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

  /**
   * Accept every remaining suggestion at once.
   *
   * Suggestions used to require one click each, so a good set of ten was ten
   * round trips and usually abandoned halfway — which left the agent's gap and
   * SERP skills with a thinner keyword list than the operator intended.
   */
  async function handleAddAllSuggestions() {
    if (suggestions.length === 0) return;
    setAddingAll(true);
    try {
      const tracked = new Set(keywords.map((k) => k.keyword.toLowerCase()));
      let added = 0;
      const remaining = [...suggestions];

      for (const suggestion of remaining) {
        if (tracked.has(suggestion.keyword.toLowerCase())) continue;
        await add({
          keyword: suggestion.keyword,
          searchIntent: suggestion.searchIntent as SEOKeyword["searchIntent"],
          difficulty: suggestion.difficulty as SEOKeyword["difficulty"],
          suggestedTitle: suggestion.suggestedTitle,
          tracked: true,
        });
        tracked.add(suggestion.keyword.toLowerCase());
        added++;
      }

      setSuggestions([]);
      toast(added > 0 ? `Added ${added} keywords` : "All of those are already tracked");
    } catch {
      toast("Failed to add keywords", "error");
    } finally {
      setAddingAll(false);
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

  // Latest measured position/clicks per keyword, from the shared store.
  const metrics = useMemo(() => latestMetricsByKeyword(rankRows), [rankRows]);

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
      render: (k) => (
        <span className="text-sm tabular-nums">
          {metrics.get(k.keyword.toLowerCase())?.clicks ?? "—"}
        </span>
      ),
    },
    {
      key: "impressions",
      header: "Impr.",
      sortable: true,
      render: (k) => (
        <span className="text-sm tabular-nums">
          {metrics.get(k.keyword.toLowerCase())?.impressions ?? "—"}
        </span>
      ),
    },
    {
      key: "ctr",
      header: "CTR",
      sortable: true,
      render: (k) => {
        const ctr = metrics.get(k.keyword.toLowerCase())?.ctr;
        return (
          <span className="text-sm tabular-nums">
            {ctr != null ? `${(ctr * 100).toFixed(1)}%` : "—"}
          </span>
        );
      },
    },
    {
      key: "position",
      header: "Pos.",
      sortable: true,
      render: (k) => {
        const position = metrics.get(k.keyword.toLowerCase())?.position;
        return (
          <span className="text-sm tabular-nums">
            {position != null ? position.toFixed(1) : "—"}
          </span>
        );
      },
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
        title="Keywords"
        description="Track SEO keywords and get AI-powered suggestions"
        actions={
          <div className="flex items-center gap-2">
          <AIPromptButton
            section="Keyword AI"
            description="Suggests keywords grounded in what the agent already measured — your gaps, tracked keywords and page audits."
            placeholder="e.g. virtual assistant services, remote work, business outsourcing"
            presets={aiPresets}
            onResult={(raw) => {
              try {
                setSuggestions(
                  parseAiJson<{ keywords?: { keyword: string; searchIntent: string; difficulty: string; suggestedTitle: string }[] }>(raw).keywords || [],
                );
                setSuggestOpen(true);
              } catch {
                toast("AI returned an unreadable response — try again", "error");
              }
            }}
            buildPrompt={(input, dataContext) => buildKeywordPrompt(input, dataContext)}
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

      <AdminTabs
        tabs={[
          { label: "Keywords", value: "keywords", badge: keywords.length },
          { label: "Gaps", value: "gaps" },
          { label: "Rankings", value: "rankings" },
        ]}
        defaultValue={initialTab}
        onChange={setTab}
      />

      {keywords.length === 0 && tab === "keywords" && !loading && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-gray-70">
          <p className="font-medium text-foreground mb-1">No keywords tracked yet — three ways to add some:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li><strong>AI suggestions</strong> — describe a topic and get 8–10 ideas grounded in your gaps (Keyword AI button).</li>
            <li><strong>Search Console</strong> — pull the last 28 days of real queries (top-right button).</li>
            <li><strong>Manual entry</strong> — add a keyword you know you want to rank for (New Keyword button).</li>
          </ul>
          <p className="mt-2 text-xs text-gray-60">
            <strong className="text-gray-80">This list is the agent&apos;s input.</strong>{" "}
            <code>keyword-gaps</code> uses it to skip terms you already track, and{" "}
            <code>serp-analysis</code> returns <em>skipped</em> without it — so competitor-gap
            detection stays off until at least one keyword exists here.
          </p>
        </div>
      )}

      {tab === "gaps" && <KeywordGapsSection />}
      {tab === "rankings" && <RankingsTable />}

      {tab === "keywords" && (
        <>
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
            const colors = { informational: "var(--chart-8)", commercial: "var(--chart-6)", transactional: "var(--chart-5)", navigational: "var(--gray-60)" };
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
                        <div className="bar-segment" style={{ '--bar-w': `${Math.max(pct, 2)}%`, '--bar-c': colors[intent as keyof typeof colors] || "var(--gray-50)" } as React.CSSProperties} />
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
            const colors = { low: "var(--chart-5)", medium: "var(--chart-6)", high: "var(--error)" };
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
        </>
      )}

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
          <>
            {suggestions.length > 0 && (
              <Button size="sm" onClick={handleAddAllSuggestions} isLoading={addingAll}>
                Add all {suggestions.length}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setSuggestOpen(false)}>
              Close
            </Button>
          </>
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
                    <span className="text-xs text-gray-50">{(q.ctr * 100).toFixed(1)}% CTR</span>
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
