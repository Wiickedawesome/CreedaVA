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
  AIPromptButton,
  RichTextEditor,
  Select,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input, Textarea } from "@/components/ui";
import { cloudSyncCampaignData, cloudSendBulkEmail } from "@/lib/firebase/cloud-functions";
import type { Campaign, EmailCampaign } from "@/lib/types/content";

const platformColors: Record<string, string> = {
  google: "bg-blue-100 text-blue-700",
  facebook: "bg-indigo-100 text-indigo-700",
  linkedin: "bg-sky-100 text-sky-700",
  instagram: "bg-pink-100 text-pink-700",
  twitter: "bg-gray-100 text-gray-700",
  email: "bg-emerald-100 text-emerald-700",
};

const BUSINESS_EMAILS = [
  { label: "contact@creedava.com", value: "contact@creedava.com" },
  { label: "sales@creedava.com", value: "sales@creedava.com" },
  { label: "info@creedava.com", value: "info@creedava.com" },
  { label: "privacy@creedava.com", value: "privacy@creedava.com" },
  { label: "legal@creedava.com", value: "legal@creedava.com" },
];

export default function CampaignsPage() {
  const { data: campaigns, loading, add, edit, del } = useCollection<Campaign>("campaigns", {
    orderByField: "createdAt",
  });
  const { data: emailCampaigns, loading: ecLoading, add: addEC, edit: editEC, del: delEC } = useCollection<EmailCampaign>("email-campaigns", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();

  // ─── Section toggle ────────────
  const [section, setSection] = useState<"ads" | "email">("ads");

  const [tab, setTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);

  // Ad campaigns form
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("google");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // ─── Email Campaigns State ────────
  const [ecModalOpen, setEcModalOpen] = useState(false);
  const [ecDeleteOpen, setEcDeleteOpen] = useState(false);
  const [ecDeleting, setEcDeleting] = useState(false);
  const [selectedEC, setSelectedEC] = useState<EmailCampaign | null>(null);
  const [ecTab, setEcTab] = useState("all");
  const [ecSaving, setEcSaving] = useState(false);
  const [ecSending, setEcSending] = useState(false);
  const recipientRef = useRef<HTMLTextAreaElement>(null);

  // Email campaign form
  const emptyECForm = {
    name: "",
    subject: "",
    body: "",
    previewText: "",
    fromAddress: BUSINESS_EMAILS[0].value,
    recipients: [] as string[],
    recipientSource: "manual" as string,
    notes: "",
    tags: [] as string[],
  };
  const [ecForm, setEcForm] = useState(emptyECForm);

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

  // ─── Email Campaign Handlers ──────

  function openECModal(ec?: EmailCampaign) {
    if (ec) {
      setSelectedEC(ec);
      setEcForm({
        name: ec.name,
        subject: ec.subject,
        body: ec.body,
        previewText: ec.previewText,
        fromAddress: ec.fromAddress,
        recipients: ec.recipients || [],
        recipientSource: ec.recipientSource || "manual",
        notes: ec.notes || "",
        tags: ec.tags || [],
      });
    } else {
      setSelectedEC(null);
      setEcForm({ ...emptyECForm });
    }
    setEcModalOpen(true);
  }

  async function handleECSave() {
    if (!ecForm.name.trim() || !ecForm.subject.trim()) {
      toast("Name and subject are required", "error");
      return;
    }
    setEcSaving(true);
    try {
      const data = {
        name: ecForm.name,
        subject: ecForm.subject,
        body: ecForm.body,
        previewText: ecForm.previewText,
        fromAddress: ecForm.fromAddress,
        recipients: ecForm.recipients,
        recipientSource: ecForm.recipientSource,
        notes: ecForm.notes,
        tags: ecForm.tags,
      };
      if (selectedEC) {
        await editEC(selectedEC.id, data);
        toast("Email campaign updated");
      } else {
        await addEC({
          ...data,
          status: "draft" as const,
          stats: { total: 0, sent: 0, failed: 0, opened: 0, clicked: 0 },
        });
        toast("Email campaign created");
      }
      setEcModalOpen(false);
    } catch {
      toast("Failed to save", "error");
    } finally {
      setEcSaving(false);
    }
  }

  async function handleECSend() {
    if (ecForm.recipients.length === 0) {
      toast("Add at least one recipient", "error");
      return;
    }
    if (!ecForm.subject.trim()) {
      toast("Subject is required", "error");
      return;
    }
    setEcSending(true);
    try {
      const result = await cloudSendBulkEmail({
        recipients: ecForm.recipients,
        subject: ecForm.subject,
        html: ecForm.body,
      });
      if (result.success) {
        const ecId = selectedEC?.id;
        if (ecId) {
          await editEC(ecId, {
            status: "sent" as const,
            sentAt: new Date().toISOString(),
            stats: { total: ecForm.recipients.length, sent: result.sent, failed: result.failed, opened: 0, clicked: 0 },
          });
        }
        toast(`Sent to ${result.sent} of ${ecForm.recipients.length} recipients`, "success");
        setEcModalOpen(false);
      } else {
        toast(`${result.sent} sent, ${result.failed} failed`, "error");
      }
    } catch {
      toast("Send failed — check SMTP config in Settings", "error");
    } finally {
      setEcSending(false);
    }
  }

  async function handleECDelete() {
    if (!selectedEC) return;
    setEcDeleting(true);
    try {
      await delEC(selectedEC.id);
      toast("Email campaign deleted");
      setEcDeleteOpen(false);
      setEcModalOpen(false);
      setSelectedEC(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setEcDeleting(false);
    }
  }

  async function handleECStatusChange(ec: EmailCampaign, status: EmailCampaign["status"]) {
    try {
      await editEC(ec.id, { status });
      toast(`Campaign ${status}`);
      setEcModalOpen(false);
    } catch {
      toast("Failed to update", "error");
    }
  }

  const filteredEC = emailCampaigns.filter((ec) => ecTab === "all" || ec.status === ecTab);

  const ecTabs = [
    { label: "All", value: "all", badge: emailCampaigns.length },
    { label: "Draft", value: "draft", badge: emailCampaigns.filter((ec) => ec.status === "draft").length },
    { label: "Scheduled", value: "scheduled", badge: emailCampaigns.filter((ec) => ec.status === "scheduled").length },
    { label: "Sent", value: "sent", badge: emailCampaigns.filter((ec) => ec.status === "sent").length },
  ];

  const ecColumns: Column<EmailCampaign>[] = [
    {
      key: "name",
      header: "Campaign",
      render: (ec) => (
        <div>
          <p className="text-sm font-medium text-gray-90">{ec.name}</p>
          <p className="text-xs text-gray-50 truncate max-w-xs">{ec.subject}</p>
        </div>
      ),
    },
    {
      key: "fromAddress",
      header: "From",
      render: (ec) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
          {ec.fromAddress?.split("@")[0] || "—"}
        </span>
      ),
    },
    {
      key: "recipients",
      header: "Recipients",
      render: (ec) => (
        <span className="text-sm text-gray-70">{ec.recipients?.length || 0}</span>
      ),
    },
    {
      key: "stats",
      header: "Performance",
      render: (ec) => (
        <div className="text-sm">
          <p className="text-gray-80">{ec.stats.sent} sent</p>
          <p className="text-xs text-gray-40">{ec.stats.opened} opened · {ec.stats.clicked} clicked</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (ec) => (
        <StatusBadge
          status={ec.status}
          variant={
            ec.status === "sent" ? "success" :
            ec.status === "sending" ? "info" :
            ec.status === "scheduled" ? "warning" : "default"
          }
        />
      ),
    },
  ];

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

  if (loading || ecLoading) {
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
        description="Ad campaigns and email campaigns"
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
                { label: "A/B Test Ideas", prompt: "Suggest 5 A/B test ideas for current campaigns. For each: what to test, hypothesis, how to measure, and expected impact on conversions." },
                { label: "Budget Optimizer", prompt: "Analyze current campaign spending vs results. Recommend an optimal budget allocation across platforms to maximize ROI. Include specific dollar reallocation suggestions." },
                { label: "Audience Targeting", prompt: "Define 4 ideal audience segments for VA services. For each: demographics, pain points, preferred platform, messaging angle, and estimated audience size." },
                { label: "Retargeting Plan", prompt: "Design a retargeting campaign strategy. Include: audience segments to retarget, ad creative suggestions, frequency caps, and expected conversion improvement." },
                { label: "Monthly Report", prompt: "Write a monthly campaign performance report. Cover: spend vs budget, key metrics (CPC, CTR, conversions), winning and underperforming campaigns, and recommended actions for next month." },
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
                buildTrainedPrompt("Campaigns", input, ctx, { includeCompetitors: true, includeKPIs: true })
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

      {/* Section Toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-gray-10 w-fit">
        <button
          onClick={() => setSection("ads")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            section === "ads" ? "bg-white text-gray-90 shadow-sm" : "text-gray-50 hover:text-gray-70"
          }`}
        >
          <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
          </svg>
          Ad Campaigns
        </button>
        <button
          onClick={() => setSection("email")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            section === "email" ? "bg-white text-gray-90 shadow-sm" : "text-gray-50 hover:text-gray-70"
          }`}
        >
          <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
          </svg>
          Email Campaigns
          {emailCampaigns.length > 0 && (
            <span className="ml-1.5 text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">{emailCampaigns.length}</span>
          )}
        </button>
      </div>

      {/* ═══════ AD CAMPAIGNS SECTION ═══════ */}
      {section === "ads" && (
        <>

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

        </>
      )}

      {/* ═══════ EMAIL CAMPAIGNS SECTION ═══════ */}
      {section === "email" && (
        <>
          <div className="flex items-center justify-between">
            <div />
            <Button size="sm" onClick={() => openECModal()}>
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Email Campaign
            </Button>
          </div>

          {/* Email Campaign Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Campaigns", value: emailCampaigns.length.toString() },
              { label: "Total Recipients", value: emailCampaigns.reduce((s, ec) => s + (ec.recipients?.length || 0), 0).toLocaleString() },
              { label: "Total Sent", value: emailCampaigns.reduce((s, ec) => s + ec.stats.sent, 0).toLocaleString() },
              { label: "Total Opened", value: emailCampaigns.reduce((s, ec) => s + ec.stats.opened, 0).toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-white p-4">
                <p className="text-xs text-gray-50">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-90 mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <AdminTabs tabs={ecTabs} defaultValue="all" onChange={setEcTab} />

          <DataTable
            columns={ecColumns}
            data={filteredEC}
            keyExtractor={(ec) => ec.id}
            onRowClick={(ec) => openECModal(ec)}
            emptyMessage="No email campaigns yet — create one to reach your audience"
          />

          {/* Email Campaign Create/Edit Modal */}
          <Modal
            open={ecModalOpen}
            onClose={() => setEcModalOpen(false)}
            title={selectedEC ? `Edit: ${selectedEC.name}` : "New Email Campaign"}
            size="lg"
            footer={
              <>
                {selectedEC && (
                  <Button variant="danger" size="sm" onClick={() => setEcDeleteOpen(true)}>
                    Delete
                  </Button>
                )}
                {selectedEC?.status === "draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleECSend}
                    isLoading={ecSending}
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send Now
                  </Button>
                )}
                {selectedEC?.status === "sending" && (
                  <Button variant="outline" size="sm" onClick={() => selectedEC && handleECStatusChange(selectedEC, "paused")}>
                    Pause
                  </Button>
                )}
                {selectedEC?.status === "paused" && (
                  <Button size="sm" onClick={() => selectedEC && handleECStatusChange(selectedEC, "draft")}>
                    Resume as Draft
                  </Button>
                )}
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={() => setEcModalOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleECSave} isLoading={ecSaving}>
                  {selectedEC ? "Update" : "Create"}
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <Input
                label="Campaign Name"
                placeholder="e.g. January Newsletter"
                value={ecForm.name}
                onChange={(e) => setEcForm({ ...ecForm, name: e.target.value })}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <Select
                  label="From Address"
                  options={BUSINESS_EMAILS}
                  value={ecForm.fromAddress}
                  onChange={(e) => setEcForm({ ...ecForm, fromAddress: e.target.value })}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-70 mb-1">Recipient Source</label>
                  <select
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-gray-80"
                    value={ecForm.recipientSource}
                    onChange={(e) => setEcForm({ ...ecForm, recipientSource: e.target.value })}
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="leads">Leads</option>
                    <option value="customers">Customers</option>
                    <option value="contacts">Contacts</option>
                  </select>
                </div>
              </div>
              <Input
                label="Subject"
                placeholder="Email subject line"
                value={ecForm.subject}
                onChange={(e) => setEcForm({ ...ecForm, subject: e.target.value })}
              />
              <Input
                label="Preview Text"
                placeholder="Short preview text (50–80 chars)"
                value={ecForm.previewText}
                onChange={(e) => setEcForm({ ...ecForm, previewText: e.target.value })}
              />
              <RichTextEditor
                label="Email Body"
                value={ecForm.body}
                onChange={(val) => setEcForm({ ...ecForm, body: val })}
                placeholder="Compose your campaign email..."
                minHeight="180px"
              />
              <div>
                <label className="block text-xs font-medium text-gray-70 mb-1">
                  Recipients ({ecForm.recipients.length})
                </label>
                <Textarea
                  ref={recipientRef}
                  placeholder={"email1@example.com\nemail2@example.com\n\nOne per line or separated by commas"}
                  rows={4}
                  value={ecForm.recipients.join("\n")}
                  onChange={(e) =>
                    setEcForm({
                      ...ecForm,
                      recipients: e.target.value.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
              <Input
                label="Notes"
                placeholder="Internal notes about this campaign"
                value={ecForm.notes}
                onChange={(e) => setEcForm({ ...ecForm, notes: e.target.value })}
              />

              {/* Performance stats — existing campaign only */}
              {selectedEC && selectedEC.status === "sent" && (
                <>
                  <hr className="border-border" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Total", value: selectedEC.stats.total.toString() },
                      { label: "Sent", value: selectedEC.stats.sent.toString() },
                      { label: "Failed", value: selectedEC.stats.failed.toString() },
                      { label: "Opened", value: selectedEC.stats.opened.toString() },
                      { label: "Clicked", value: selectedEC.stats.clicked.toString() },
                      { label: "Sent At", value: selectedEC.sentAt ? new Date(selectedEC.sentAt).toLocaleDateString() : "—" },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-xs text-gray-50">{s.label}</p>
                        <p className="text-sm font-medium text-gray-90">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Modal>

          {/* Email Campaign Delete Confirm */}
          <Modal
            open={ecDeleteOpen}
            onClose={() => setEcDeleteOpen(false)}
            title="Delete Email Campaign"
            size="sm"
            footer={
              <>
                <Button variant="outline" size="sm" onClick={() => setEcDeleteOpen(false)}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={handleECDelete} isLoading={ecDeleting}>Delete</Button>
              </>
            }
          >
            <p className="text-sm text-gray-70">
              Delete &ldquo;{selectedEC?.name}&rdquo;? This cannot be undone.
            </p>
          </Modal>
        </>
      )}
    </div>
  );
}
