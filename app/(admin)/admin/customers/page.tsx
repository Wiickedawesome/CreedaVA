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
  AIPromptButton,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { exportToCsv } from "@/lib/utils/csv";
import { cloudCreateClientFolder, cloudExportToSheets, cloudListDriveFiles } from "@/lib/firebase/cloud-functions";
import type { Customer, CustomerFormData, BillingCycle, Project } from "@/lib/types/crm";
import type { Contact } from "@/lib/types/crm";
import { computeLTV } from "@/lib/utils/ltv";
import { statusVariant, CUSTOMER_PLANS, BILLING_CYCLES, REFERRAL_SOURCES } from "@/lib/types/crm";

const CUSTOMER_STATUSES = ["active", "inactive", "churned"] as const;

const emptyCustomer: CustomerFormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  plan: "",
  monthlyValue: 0,
  billingCycle: "monthly",
  hoursPerMonth: 0,
  startDate: "",
  contractEndDate: "",
  lifetimeValue: 0,
  lastContactDate: "",
  satisfaction: 0,
  referralSource: "",
  assignedTo: "",
  status: "active",
  notes: "",
};

export default function CustomersPage() {
  const { data: customers, loading, add, edit, del } = useCollection<Customer>("customers", {
    orderByField: "createdAt",
  });
  const { data: contacts, add: addContact } = useCollection<Contact>("contacts", {
    orderByField: "createdAt",
  });
  const { data: projects } = useCollection<Project>("projects", {
    orderByField: "createdAt",
  });
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormData>(emptyCustomer);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [exportingSheets, setExportingSheets] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<{ id: string; name: string; type: string; mimeType: string; webLink: string; modifiedAt: string }[]>([]);

  async function handleCreateDriveFolder() {
    if (!selected) return;
    setCreatingFolder(true);
    try {
      const result = await cloudCreateClientFolder(selected.name, selected.id);
      if (result.success) {
        await edit(selected.id, { driveFolderId: result.folderId } as Partial<Customer>);
        toast("Drive folder created with 5 subfolders", "success");
        window.open(result.folderUrl, "_blank");
      } else {
        toast("Failed to create folder", "error");
      }
    } catch {
      toast("Failed — ensure Google Drive is configured in Settings → Integrations", "error");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleExportCustomersToSheets() {
    setExportingSheets(true);
    try {
      const result = await cloudExportToSheets("customers");
      if (result.success) {
        toast(`Exported ${result.rowCount} customers to Google Sheets`, "success");
        window.open(result.spreadsheetUrl, "_blank");
      } else {
        toast("Export failed", "error");
      }
    } catch {
      toast("Failed — ensure Google Sheets is configured in Settings → Integrations", "error");
    } finally {
      setExportingSheets(false);
    }
  }

  async function handleBrowseDriveFiles() {
    if (!selected) return;
    const folderId = (selected as Customer & { driveFolderId?: string }).driveFolderId;
    if (!folderId) {
      toast("Create a Drive folder first", "error");
      return;
    }
    setDriveLoading(true);
    try {
      const result = await cloudListDriveFiles(folderId);
      if (result.success) {
        setDriveFiles(result.files);
        setDriveOpen(true);
      } else {
        toast("Could not list files", "error");
      }
    } catch {
      toast("Failed — ensure Google Drive is configured in Settings → Integrations", "error");
    } finally {
      setDriveLoading(false);
    }
  }

  const filtered = customers
    .filter((c) => tab === "all" || c.status === tab)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company?.toLowerCase().includes(q) ?? false)
      );
    });

  const active = customers.filter((c) => c.status === "active");
  const inactive = customers.filter((c) => c.status === "inactive");
  const churned = customers.filter((c) => c.status === "churned");
  const mrr = useMemo(
    () => active.reduce((sum, c) => sum + (c.monthlyValue || 0), 0),
    [active],
  );
  const customerLtvMap = useMemo(
    () => new Map(customers.map((c) => [c.id, computeLTV(c, projects)])),
    [customers, projects],
  );
  const totalLtv = useMemo(
    () => Array.from(customerLtvMap.values()).reduce((sum, v) => sum + v, 0),
    [customerLtvMap],
  );
  const avgLtv = active.length > 0 ? Math.round(totalLtv / active.length) : 0;
  const totalHours = useMemo(
    () => active.reduce((sum, c) => sum + (c.hoursPerMonth || 0), 0),
    [active],
  );
  const revenuePerHour = totalHours > 0 ? Math.round(mrr / totalHours) : 0;
  const avgSatisfaction = useMemo(() => {
    const rated = active.filter((c) => c.satisfaction && c.satisfaction > 0);
    return rated.length > 0 ? (rated.reduce((s, c) => s + (c.satisfaction || 0), 0) / rated.length).toFixed(1) : "—";
  }, [active]);
  const renewingSoon = useMemo(() => {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return active.filter((c) => c.contractEndDate && new Date(c.contractEndDate) <= thirtyDays).length;
  }, [active]);
  const avgTenure = useMemo(() => {
    const withStart = active.filter((c) => c.startDate);
    if (withStart.length === 0) return 0;
    const now = Date.now();
    const totalMonths = withStart.reduce((s, c) => {
      const diff = now - new Date(c.startDate!).getTime();
      return s + diff / (1000 * 60 * 60 * 24 * 30);
    }, 0);
    return Math.round(totalMonths / withStart.length);
  }, [active]);
  const churnRate = customers.length > 0 ? ((churned.length / customers.length) * 100).toFixed(1) : "0";
  const churnSegments = useMemo(() => [
    { label: "Active", value: active.length, color: "#198038" },
    { label: "Inactive", value: inactive.length, color: "#F1C21B" },
    { label: "Churned", value: churned.length, color: "#DA1E28" },
  ], [active.length, inactive.length, churned.length]);

  const tabs = [
    { label: "All", value: "all", badge: customers.length },
    ...CUSTOMER_STATUSES.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s,
      badge: customers.filter((c) => c.status === s).length,
    })),
  ];

  function openModal(customer?: Customer) {
    if (customer) {
      setSelected(customer);
      setForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        company: customer.company || "",
        plan: customer.plan || "",
        monthlyValue: customer.monthlyValue || 0,
        billingCycle: customer.billingCycle || "monthly",
        hoursPerMonth: customer.hoursPerMonth || 0,
        startDate: customer.startDate || "",
        contractEndDate: customer.contractEndDate || "",
        lifetimeValue: customer.lifetimeValue || 0,
        lastContactDate: customer.lastContactDate || "",
        satisfaction: customer.satisfaction || 0,
        referralSource: customer.referralSource || "",
        assignedTo: customer.assignedTo || "",
        status: customer.status,
        notes: customer.notes || "",
      });
    } else {
      setSelected(null);
      setForm(emptyCustomer);
    }
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      if (selected) {
        await edit(selected.id, form);
        toast("Customer updated successfully");
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
            tags: ["customer"],
            notes: form.notes || "",
          });
        }
        toast("Customer created & synced to Contacts");
      }
      setModalOpen(false);
    } catch {
      toast("Failed to save customer", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Customer deleted");
      setDeleteOpen(false);
      setModalOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete customer", "error");
    } finally {
      setDeleting(false);
    }
  }

  function handleExport() {
    exportToCsv("customers", filtered, [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "company", header: "Company" },
      { key: "plan", header: "Plan" },
      { key: "monthlyValue", header: "Monthly Value" },
      { key: "billingCycle", header: "Billing Cycle" },
      { key: "hoursPerMonth", header: "Hours/Month" },
      { key: "ltv", header: "Lifetime Value", render: (c: Customer) => `$${(customerLtvMap.get(c.id) || 0).toLocaleString()}` },
      { key: "satisfaction", header: "Satisfaction" },
      { key: "referralSource", header: "Referral Source" },
      { key: "assignedTo", header: "Assigned To" },
      { key: "status", header: "Status" },
      { key: "startDate", header: "Start Date" },
      { key: "contractEndDate", header: "Contract End" },
      { key: "lastContactDate", header: "Last Contact" },
    ]);
    toast("CSV exported", "info");
  }

  const columns: Column<Customer>[] = [
    { key: "name", header: "Name", render: (c) => <span className="font-medium text-gray-90">{c.name}</span> },
    { key: "email", header: "Email" },
    { key: "company", header: "Company" },
    { key: "plan", header: "Plan", render: (c) => c.plan || "—" },
    {
      key: "monthlyValue",
      header: "MRR",
      render: (c) => (c.monthlyValue ? `$${c.monthlyValue.toLocaleString()}` : "—"),
      className: "text-right",
    },
    {
      key: "lifetimeValue",
      header: "LTV",
      render: (c) => {
        const ltv = customerLtvMap.get(c.id) || 0;
        return ltv ? `$${ltv.toLocaleString()}` : "—";
      },
      className: "text-right",
    },
    {
      key: "contractEndDate",
      header: "Renewal",
      render: (c) => c.contractEndDate ? new Date(c.contractEndDate).toLocaleDateString() : "—",
    },
    {
      key: "satisfaction",
      header: "Rating",
      render: (c) => c.satisfaction ? `${c.satisfaction}/5` : "—",
      className: "text-center",
    },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge status={c.status} variant={statusVariant[c.status]} />,
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
        title="Customers"
        description={`${customers.filter((c) => c.status === "active").length} active · MRR $${mrr.toLocaleString()}`}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <AIPromptButton
              section="Customers AI"
              description="Retain customers and grow revenue"
              placeholder="e.g. Suggest churn prevention tactics, find upsell opportunities..."
              presets={[
                { label: "Retention Strategy", prompt: "Analyze customer data and suggest a churn prevention strategy. Provide 5 specific retention tactics, early warning signs, and a re-engagement plan for churned customers." },
                { label: "Upsell Opportunities", prompt: "Identify upsell opportunities. For each customer with upsell potential: explain why they're ready, what to offer, and draft a 2-sentence pitch. Prioritize by revenue impact." },
                { label: "Client Email", prompt: "Draft a professional email to the customer base announcing updates. Include subject line and HTML body. Personalise for the audience with a clear CTA." },
              ]}
              dataContext={(() => {
                const active = customers.filter(c => c.status === "active");
                const churned = customers.filter(c => c.status === "churned");
                const mrr = active.reduce((s, c) => s + (c.monthlyValue || 0), 0);
                const plans = [...new Set(customers.map(c => c.plan).filter(Boolean))];
                const topCustomers = active.sort((a, b) => (b.monthlyValue || 0) - (a.monthlyValue || 0)).slice(0, 5).map(c => `${c.name} ($${c.monthlyValue || 0}/mo, ${c.plan || "no plan"})`);
                return `CreedaVA Customers (${customers.length} total, ${active.length} active, ${churned.length} churned):\nMRR: $${mrr}, ARR: $${mrr * 12}\nPlans: ${plans.join(", ")}\nTop customers: ${topCustomers.join("; ")}`;
              })()}
              buildPrompt={(input, ctx) =>
                `You are a customer success manager for CreedaVA (virtual assistant services).\n${input}\n\nCustomer data:\n${ctx}\n\nUse the actual data. Be professional and actionable.`
              }
            />
            <Button variant="outline" size="sm" onClick={handleExport} className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCustomersToSheets} isLoading={exportingSheets} className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
              Sheets
            </Button>
            <Button size="sm" onClick={() => openModal()} className="w-full sm:w-auto">
              + Add Customer
            </Button>
          </div>
        }
      />

      {/* Revenue & Customer Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active" value={active.length.toString()} badge="customers" />
        <StatCard label="MRR" value={`$${mrr.toLocaleString()}`} badge={`$${(mrr * 12).toLocaleString()} ARR`} />
        <StatCard label="Churn Rate" value={`${churnRate}%`} badge={`${churned.length} churned`} trend={churned.length > 0 ? { value: Number(churnRate), positive: false } : undefined} />
        <StatCard label="Avg Value" value={active.length > 0 ? `$${Math.round(mrr / active.length).toLocaleString()}` : "$0"} badge="per customer" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Lifetime Value" value={`$${avgLtv.toLocaleString()}`} badge={`$${totalLtv.toLocaleString()} total`} />
        <StatCard label="Revenue / Hour" value={totalHours > 0 ? `$${revenuePerHour}` : "—"} badge={`${totalHours} hrs/mo`} />
        <StatCard label="Satisfaction" value={String(avgSatisfaction)} badge="out of 5" />
        <StatCard label="Renewals" value={renewingSoon.toString()} badge={`within 30 days · ${avgTenure}mo avg tenure`} trend={renewingSoon > 0 ? { value: renewingSoon, positive: false } : undefined} />
      </div>

      <DashboardSection title="Customer Health">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0 flex justify-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
              {(() => {
                const total = churnSegments.reduce((s, d) => s + d.value, 0) || 1;
                let cum = -90;
                const cx = 70, cy = 70, r = 60, inner = 38;
                if (total <= 0) return <circle cx={cx} cy={cy} r={r} fill="var(--gray-20)" />;
                return churnSegments.filter(s => s.value > 0).map((seg, i) => {
                  const angle = (seg.value / total) * 360;
                  const start = cum; const end = start + angle; cum = end;
                  const large = angle > 180 ? 1 : 0;
                  const sr = (start * Math.PI) / 180; const er = (end * Math.PI) / 180;
                  return (
                    <path key={i} fill={seg.color}
                      d={`M ${cx + r * Math.cos(sr)} ${cy + r * Math.sin(sr)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(er)} ${cy + r * Math.sin(er)} L ${cx + inner * Math.cos(er)} ${cy + inner * Math.sin(er)} A ${inner} ${inner} 0 ${large} 0 ${cx + inner * Math.cos(sr)} ${cy + inner * Math.sin(sr)} Z`}
                    />
                  );
                });
              })()}
              <text x="70" y="75" textAnchor="middle" style={{ fontSize: "16px", fontWeight: 700, fill: "var(--gray-90)" }}>{customers.length}</text>
            </svg>
          </div>
          <div className="space-y-2 w-full">
            {churnSegments.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-sm text-gray-70 truncate">{d.label}</span>
                <span className="text-sm font-semibold text-gray-90 ml-auto">{d.value}</span>
                <span className="text-xs text-gray-40">
                  ({customers.length > 0 ? Math.round((d.value / customers.length) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </DashboardSection>

      <div className="max-w-sm w-full">
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(c) => c.id}
        onRowClick={(c) => openModal(c)}
        emptyMessage="No customers found"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? "Edit Customer" : "New Customer"}
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            {selected && (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto">
                Delete
              </Button>
            )}
            {selected && (
              <Button variant="outline" size="sm" onClick={handleCreateDriveFolder} isLoading={creatingFolder} className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                Drive Folder
              </Button>
            )}
            {selected && (selected as Customer & { driveFolderId?: string }).driveFolderId && (
              <Button variant="outline" size="sm" onClick={handleBrowseDriveFiles} isLoading={driveLoading} className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></</svg>
                Browse Files
              </Button>
            )}
            <div className="flex-1 hidden sm:block" />
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="w-full sm:w-auto">
              {selected ? "Save Changes" : "Create Customer"}
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
              label="Plan"
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              options={[{ value: "", label: "Select a plan" }, ...CUSTOMER_PLANS.map((p) => ({ value: p, label: p }))]}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Customer["status"] })}
              options={CUSTOMER_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
          </div>

          {/* Revenue */}
          <p className="text-xs font-medium text-gray-50 uppercase tracking-wide pt-2">Revenue</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Monthly Value ($)"
              type="number"
              value={String(form.monthlyValue || "")}
              onChange={(e) => setForm({ ...form, monthlyValue: Number(e.target.value) || 0 })}
            />
            <Select
              label="Billing Cycle"
              value={form.billingCycle}
              onChange={(e) => setForm({ ...form, billingCycle: e.target.value as BillingCycle })}
              options={BILLING_CYCLES.map((b) => ({ value: b, label: b.charAt(0).toUpperCase() + b.slice(1) }))}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Lifetime Value ($)</label>
              <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                {selected ? `$${(customerLtvMap.get(selected.id) || 0).toLocaleString()}` : "$0"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hours / Month"
              type="number"
              value={String(form.hoursPerMonth || "")}
              onChange={(e) => setForm({ ...form, hoursPerMonth: Number(e.target.value) || 0 })}
            />
            <Input
              label="Assigned To"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            />
          </div>

          {/* Dates */}
          <p className="text-xs font-medium text-gray-50 uppercase tracking-wide pt-2">Dates</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="Contract End"
              type="date"
              value={form.contractEndDate}
              onChange={(e) => setForm({ ...form, contractEndDate: e.target.value })}
            />
            <Input
              label="Last Contact"
              type="date"
              value={form.lastContactDate}
              onChange={(e) => setForm({ ...form, lastContactDate: e.target.value })}
            />
          </div>

          {/* Engagement */}
          <p className="text-xs font-medium text-gray-50 uppercase tracking-wide pt-2">Engagement</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Satisfaction (1–5)"
              value={String(form.satisfaction || "")}
              onChange={(e) => setForm({ ...form, satisfaction: Number(e.target.value) || 0 })}
              options={[{ value: "", label: "Not rated" }, ...([1,2,3,4,5].map((n) => ({ value: String(n), label: `${n} — ${["Poor","Fair","Good","Very Good","Excellent"][n-1]}` })))]}
            />
            <Select
              label="Referral Source"
              value={form.referralSource}
              onChange={(e) => setForm({ ...form, referralSource: e.target.value })}
              options={[{ value: "", label: "Select source" }, ...REFERRAL_SOURCES.map((s) => ({ value: s, label: s }))]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-70 mb-1">Notes</label>
            <textarea
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm min-h-16 resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Customer"
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

      {/* Drive Files Modal */}
      <Modal
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        title={`Files — ${selected?.name}`}
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setDriveOpen(false)}>
            Close
          </Button>
        }
      >
        {driveFiles.length === 0 ? (
          <p className="text-sm text-gray-50 text-center py-8">No files in this folder yet</p>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {driveFiles.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <svg className="w-4 h-4 text-gray-40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {f.type === "folder"
                      ? <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                      : <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>
                    }
                  </svg>
                  <span className="text-sm text-gray-80 truncate">{f.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-40">{new Date(f.modifiedAt).toLocaleDateString()}</span>
                  <a href={f.webLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
