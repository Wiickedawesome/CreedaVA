"use client";

import { useState, useMemo } from "react";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  AdminTabs,
  DataTable,
  StatusBadge,
  Modal,
  Select,
  DashboardSection,
  StatCard,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input, Textarea } from "@/components/ui";
import { exportToCsv } from "@/lib/utils/csv";
import type { Lead, LeadFormData } from "@/lib/types/crm";
import type { Contact } from "@/lib/types/crm";
import {
  statusVariant,
  LEAD_SOURCES,
  CRM_STATUSES,
} from "@/lib/types/crm";

const emptyLead: LeadFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "website",
  status: "new",
  value: 0,
  notes: "",
};

export default function LeadsPage() {
  const { data: leads, loading, add, edit, del } = useCollection<Lead>("leads", {
    orderByField: "createdAt",
  });
  const { data: contacts, add: addContact } = useCollection<Contact>("contacts", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormData>(emptyLead);

  // Filtering
  const filtered = useMemo(() => leads
    .filter((l) => tab === "all" || l.status === tab)
    .filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company?.toLowerCase().includes(q) ?? false)
      );
    }), [leads, tab, search]);

  // ─── Metrics ────────────────────────────────────────
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === "won").length;
  const lostLeads = leads.filter((l) => l.status === "lost").length;
  const winRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";
  const pipeline = leads.reduce((s, l) => s + (l.value || 0), 0);

  // Conversion funnel data
  const conversionData = useMemo(() => {
    const stages = ["new", "contacted", "qualified", "proposal", "won"] as const;
    const labels: Record<string, string> = {
      new: "New", contacted: "Contacted", qualified: "Qualified",
      proposal: "Proposal", won: "Won",
    };
    const colors: Record<string, string> = {
      new: "var(--chart-8)", contacted: "var(--chart-2)", qualified: "var(--chart-3)",
      proposal: "var(--chart-4)", won: "var(--chart-5)",
    };
    // Count leads that reached each stage or beyond
    const stageIndex = (s: string) => stages.indexOf(s as typeof stages[number]);
    const reached = stages.map((stage) => {
      const idx = stageIndex(stage);
      return {
        stage,
        label: labels[stage],
        color: colors[stage],
        count: leads.filter((l) => l.status !== "lost" && stageIndex(l.status) >= idx).length,
        current: leads.filter((l) => l.status === stage).length,
      };
    });
    // Calculate conversion rates between stages
    return reached.map((r, i) => ({
      ...r,
      rate: i === 0 ? 100 : (reached[i - 1].count > 0 ? Math.round((r.count / reached[i - 1].count) * 100) : 0),
    }));
  }, [leads]);

  // Source breakdown for horizontal bars
  const sourceData = useMemo(() => {
    const acc: Record<string, number> = {};
    leads.forEach((l) => { acc[l.source || "other"] = (acc[l.source || "other"] || 0) + 1; });
    const srcColors: Record<string, string> = {
      website: "var(--chart-1)", referral: "var(--chart-7)", social: "var(--chart-2)",
      ad: "var(--chart-6)", email: "var(--chart-8)", "cold-call": "var(--gray-60)", other: "var(--gray-50)",
    };
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).map(([src, count]) => ({
      label: src.replace(/[-_]/g, " "),
      value: count,
      pct: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
      color: srcColors[src] || "var(--gray-50)",
    }));
  }, [leads, totalLeads]);

  const tabs = [
    { label: "All", value: "all", badge: leads.length },
    ...CRM_STATUSES.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s,
      badge: leads.filter((l) => l.status === s).length,
    })),
  ];

  // Open create / edit modal
  function openModal(lead?: Lead) {
    if (lead) {
      setSelected(lead);
      setForm({
        name: lead.name,
        email: lead.email,
        phone: lead.phone || "",
        company: lead.company || "",
        source: lead.source,
        status: lead.status,
        value: lead.value || 0,
        notes: lead.notes || "",
      });
    } else {
      setSelected(null);
      setForm(emptyLead);
    }
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast("Name is required", "error");
      return;
    }
    if (!form.email.trim()) {
      toast("Email is required", "error");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast("Enter a valid email address", "error");
      return;
    }

    setSaving(true);
    try {
      if (selected) {
        await edit(selected.id, form);
        toast("Lead updated successfully");
      } else {
        await add(form);
        // Cross-sync to contacts — only if email not already in contacts
        const alreadyInContacts = contacts.some(
          (c) => c.email.toLowerCase() === form.email.toLowerCase(),
        );
        if (!alreadyInContacts && form.email) {
          await addContact({
            name: form.name,
            email: form.email,
            phone: form.phone || "",
            company: form.company || "",
            role: "",
            tags: ["lead"],
            notes: form.notes || "",
          });
        }
        toast("Lead created & synced to Contacts");
      }
      setModalOpen(false);
    } catch {
      toast("Failed to save lead", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Lead deleted");
      setDeleteOpen(false);
      setModalOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete lead", "error");
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    exportToCsv("leads", filtered, [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "company", header: "Company" },
      { key: "source", header: "Source" },
      { key: "status", header: "Status" },
      { key: "value", header: "Value" },
      { key: "notes", header: "Notes" },
    ]);
    toast("CSV exported", "info");
  }

  const columns: Column<Lead>[] = [
    { key: "name", header: "Name", render: (l) => <span className="font-medium text-gray-90">{l.name}</span> },
    { key: "email", header: "Email" },
    { key: "company", header: "Company" },
    { key: "source", header: "Source", render: (l) => <span className="capitalize">{l.source}</span> },
    {
      key: "status",
      header: "Status",
      render: (l) => <StatusBadge status={l.status} variant={statusVariant[l.status]} />,
    },
    {
      key: "value",
      header: "Value",
      render: (l) => (l.value ? `$${l.value.toLocaleString()}` : "—"),
      className: "text-right",
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
        title="Leads"
        description="Track and manage your sales pipeline"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleExport} className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export
            </Button>
            <Button size="sm" onClick={() => openModal()} className="w-full sm:w-auto">
              + Add Lead
            </Button>
          </div>
        }
      />

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={totalLeads.toString()} badge={`${filtered.length} shown`} />
        <StatCard label="Win Rate" value={`${winRate}%`} badge={`${wonLeads} won`} trend={wonLeads > 0 ? { value: Number(winRate), positive: true } : undefined} />
        <StatCard label="Lost" value={lostLeads.toString()} badge={totalLeads > 0 ? `${((lostLeads / totalLeads) * 100).toFixed(0)}%` : "0%"} />
        <StatCard label="Pipeline Value" value={`$${pipeline.toLocaleString()}`} badge="total" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardSection title="Lead Conversion">
          {totalLeads > 0 ? (
            <div className="space-y-3">
              {conversionData.map((d, i) => (
                <div key={d.stage}>
                  {i > 0 && (
                    <div className="flex items-center gap-2 py-1 pl-4">
                      <svg className="w-3.5 h-3.5 text-gray-30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                      <span className="text-xs font-medium" style={{ color: d.rate >= 50 ? "var(--chart-5)" : d.rate >= 25 ? "var(--chart-6)" : "var(--error)" }}>
                        {d.rate}% conversion
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-gray-80 w-24">{d.label}</span>
                    <div className="flex-1 h-2.5 bg-gray-10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${totalLeads > 0 ? Math.max((d.count / totalLeads) * 100, 2) : 0}%`,
                          backgroundColor: d.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-90 w-8 text-right">{d.count}</span>
                  </div>
                </div>
              ))}
              {lostLeads > 0 && (
                <div className="flex items-center gap-3 pt-2 border-t border-gray-10">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-error" />
                  <span className="text-sm text-gray-80 w-24">Lost</span>
                  <div className="flex-1 h-2.5 bg-gray-10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-error transition-all duration-700"
                      style={{ width: `${Math.max((lostLeads / totalLeads) * 100, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-90 w-8 text-right">{lostLeads}</span>
                </div>
              )}
            </div>
          ) : <p className="text-sm text-gray-50 text-center py-8">No leads yet</p>}
        </DashboardSection>

        <DashboardSection title="Lead Sources">
          {sourceData.length > 0 ? (
            <div className="space-y-3">
              {sourceData.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-80 capitalize">{d.label}</span>
                    <span className="text-xs font-medium text-gray-60">{d.value} ({d.pct}%)</span>
                  </div>
                  <div className="h-3 bg-gray-10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(d.pct, 2)}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-50 text-center py-8">No source data</p>}
        </DashboardSection>
      </div>

      {/* Search */}
      <div className="max-w-sm w-full">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(l) => l.id}
        onRowClick={(l) => openModal(l)}
        emptyMessage="No leads found"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? "Edit Lead" : "New Lead"}
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            {selected && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto">
                Delete
              </Button>
            )}
            <div className="flex-1 hidden sm:block" />
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={saving} className="w-full sm:w-auto">
              {selected ? "Save Changes" : "Create Lead"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              options={LEAD_SOURCES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Lead["status"] })}
              options={CRM_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
          </div>
          <Input
            label="Estimated Value ($)"
            type="number"
            value={String(form.value || "")}
            onChange={(e) => setForm({ ...form, value: Number(e.target.value) || 0 })}
          />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Lead"
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
          Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
