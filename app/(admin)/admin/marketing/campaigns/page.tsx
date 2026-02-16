"use client";

import { useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  AdminTabs,
  DataTable,
  StatusBadge,
  Modal,
  AIPromptButton,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { cloudSyncCampaignData } from "@/lib/firebase/cloud-functions";
import type { Campaign } from "@/lib/types/content";

const platformColors: Record<string, string> = {
  google: "bg-blue-100 text-blue-700",
  facebook: "bg-indigo-100 text-indigo-700",
  linkedin: "bg-sky-100 text-sky-700",
  instagram: "bg-pink-100 text-pink-700",
  twitter: "bg-gray-100 text-gray-700",
};

export default function CampaignsPage() {
  const { data: campaigns, loading, add, edit, del } = useCollection<Campaign>("campaigns", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("google");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function handleSyncAds() {
    setSyncing(true);
    try {
      const result = await cloudSyncCampaignData();
      if (result.success) {
        toast(`Synced ${result.campaignsSynced} campaign(s) from Google Ads`, "success");
      } else {
        toast("Sync failed — check Google Ads integration in Settings", "error");
      }
    } catch {
      toast("Failed to sync — ensure Google Ads is configured in Settings → Integrations", "error");
    } finally {
      setSyncing(false);
    }
  }

  const filtered = campaigns.filter((c) => tab === "all" || c.status === tab);

  const tabs = [
    { label: "All", value: "all", badge: campaigns.length },
    { label: "Active", value: "active", badge: campaigns.filter((c) => c.status === "active").length },
    { label: "Paused", value: "paused", badge: campaigns.filter((c) => c.status === "paused").length },
    { label: "Completed", value: "completed", badge: campaigns.filter((c) => c.status === "completed").length },
    { label: "Draft", value: "draft", badge: campaigns.filter((c) => c.status === "draft").length },
  ];

  function resetForm() {
    setName("");
    setPlatform("google");
    setBudget("");
    setNotes("");
  }

  function openModal(campaign?: Campaign) {
    if (campaign) {
      setSelected(campaign);
      setName(campaign.name);
      setPlatform(campaign.platform);
      setBudget(campaign.budget.toString());
      setNotes(campaign.notes || "");
    } else {
      setSelected(null);
      resetForm();
    }
    setModalOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (selected) {
        await edit(selected.id, {
          name,
          platform,
          budget: parseFloat(budget) || 0,
          notes,
        });
        toast("Campaign updated");
      } else {
        await add({
          name,
          platform,
          status: "draft" as const,
          budget: parseFloat(budget) || 0,
          spent: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          notes,
        });
        toast("Campaign created");
      }
      setModalOpen(false);
      resetForm();
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(campaign: Campaign, status: Campaign["status"]) {
    try {
      await edit(campaign.id, { status });
      toast(`Campaign ${status}`);
      setModalOpen(false);
    } catch {
      toast("Failed to update", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Campaign deleted");
      setDeleteOpen(false);
      setModalOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  function ctr(c: Campaign) {
    return c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";
  }

  const columns: Column<Campaign>[] = [
    {
      key: "name",
      header: "Campaign",
      render: (c) => (
        <div>
          <p className="text-sm font-medium text-gray-90">{c.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${platformColors[c.platform] || "bg-gray-100 text-gray-600"}`}>
            {c.platform}
          </span>
        </div>
      ),
    },
    {
      key: "budget",
      header: "Budget",
      render: (c) => (
        <div className="text-sm">
          <p className="text-gray-80">${c.budget.toLocaleString()}</p>
          <p className="text-xs text-gray-40">${c.spent.toLocaleString()} spent</p>
        </div>
      ),
    },
    {
      key: "clicks",
      header: "Performance",
      render: (c) => (
        <div className="text-sm">
          <p className="text-gray-80">{c.clicks.toLocaleString()} clicks</p>
          <p className="text-xs text-gray-40">{ctr(c)}% CTR</p>
        </div>
      ),
    },
    {
      key: "conversions",
      header: "Conversions",
      render: (c) => (
        <span className="text-sm text-gray-80">{c.conversions}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <StatusBadge
          status={c.status}
          variant={
            c.status === "active" ? "success" :
            c.status === "paused" ? "warning" :
            c.status === "completed" ? "info" : "default"
          }
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
        title="Campaigns"
        description="Track ad campaigns and their performance"
        actions={
          <div className="flex items-center gap-2">
            <AIPromptButton
              section="Campaigns AI"
              description="Optimise campaigns and boost ROI"
              placeholder="e.g. Suggest campaign ideas for targeting startups, review campaign performance..."
              presets={[
                { label: "Campaign Ideas", prompt: "Suggest 3 campaign ideas. For each: name, platform (Google/Facebook/LinkedIn), target audience, ad copy (headline + description), suggested budget, and expected results." },
                { label: "Performance Review", prompt: "Review campaign performance and suggest optimizations. For each active campaign: assess ROI, identify problems, and give 2-3 specific optimisations. Then give overall budget reallocation recommendation." },
                { label: "Ad Copy", prompt: "Write compelling ad copy. Provide 3 variations, each with: headline (max 30 chars), description (max 90 chars), and CTA. Then one long-form version (2-3 sentences)." },
              ]}
              dataContext={(() => {
                const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
                const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
                const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
                const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
                const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
                const activeCampaigns = campaigns.filter(c => c.status === "active").map(c => `${c.name} (${c.platform}, $${c.spent}/$${c.budget}, ${c.clicks} clicks, ${c.conversions} conversions)`).join("; ");
                return `CreedaVA Campaigns (${campaigns.length} total):\nBudget: $${totalBudget} total, $${totalSpent} spent\nPerformance: ${totalImpressions} impressions, ${totalClicks} clicks, ${totalConversions} conversions\nCTR: ${totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%\nActive: ${activeCampaigns || "none"}`;
              })()}
              buildPrompt={(input, ctx) =>
                `You are a digital marketing strategist for CreedaVA (virtual assistant services).\n${input}\n\nCampaign data:\n${ctx}\n\nBuild on what's already working. Be professional and actionable.`
              }
            />
            <Button size="sm" onClick={() => openModal()}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Campaign
            </Button>
            <Button variant="outline" size="sm" onClick={handleSyncAds} isLoading={syncing}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              Sync Ads
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Budget", value: `$${campaigns.reduce((s, c) => s + c.budget, 0).toLocaleString()}` },
          { label: "Total Spent", value: `$${campaigns.reduce((s, c) => s + c.spent, 0).toLocaleString()}` },
          { label: "Total Clicks", value: campaigns.reduce((s, c) => s + c.clicks, 0).toLocaleString() },
          { label: "Total Conversions", value: campaigns.reduce((s, c) => s + c.conversions, 0).toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs text-gray-50">{stat.label}</p>
            <p className="text-lg font-semibold text-gray-90 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => openModal(c)}
        emptyMessage="No campaigns yet — create one to get started"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? `Edit: ${selected.name}` : "New Campaign"}
        size="lg"
        footer={
          <>
            {selected && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
            {selected?.status === "draft" && (
              <Button size="sm" onClick={() => selected && handleStatusChange(selected, "active")}>
                Activate
              </Button>
            )}
            {selected?.status === "active" && (
              <Button variant="outline" size="sm" onClick={() => selected && handleStatusChange(selected, "paused")}>
                Pause
              </Button>
            )}
            {selected?.status === "paused" && (
              <Button size="sm" onClick={() => selected && handleStatusChange(selected, "active")}>
                Resume
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={saving}>
              {selected ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Editable fields */}
          <Input
            label="Campaign Name"
            placeholder="e.g. Q1 Google Ads"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="block text-xs font-medium text-gray-70 mb-1">Platform</label>
            <select
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-gray-80"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="google">Google Ads</option>
              <option value="facebook">Facebook / Meta</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter / X</option>
            </select>
          </div>
          <Input
            label="Budget ($)"
            type="number"
            placeholder="1000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <Input
            label="Notes"
            placeholder="Campaign goals or notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Performance stats — only when editing an existing campaign */}
          {selected && (
            <>
              <hr className="border-border" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Spent", value: `$${selected.spent.toLocaleString()}` },
                  { label: "Impressions", value: selected.impressions.toLocaleString() },
                  { label: "Clicks", value: selected.clicks.toLocaleString() },
                  { label: "CTR", value: `${ctr(selected)}%` },
                  { label: "Conversions", value: selected.conversions.toString() },
                  { label: "Status", value: selected.status },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xs text-gray-50">{s.label}</p>
                    <p className="text-sm font-medium text-gray-90 capitalize">{s.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Campaign"
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
          Delete &ldquo;{selected?.name}&rdquo;? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
