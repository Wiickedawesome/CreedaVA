"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import React, { useState, useMemo } from "react";
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
import { cloudCreateClientFolder, cloudExportToSheets, cloudListDriveFiles, cloudSendEmail } from "@/lib/firebase/cloud-functions";
import type { Customer, CustomerFormData, BillingCycle } from "@/lib/types/crm";
import type { Contact } from "@/lib/types/crm";
import type { EmailDraft } from "@/lib/types/content";
import { computeLTV } from "@/lib/utils/ltv";
import { statusVariant, CUSTOMER_PLANS, BILLING_CYCLES, REFERRAL_SOURCES } from "@/lib/types/crm";
import { lazyAnalyzeCustomerHealth } from "@/lib/firebase/ai-lazy";
import type { CustomerHealthReport } from "@/lib/firebase/ai-engine";

const BUSINESS_EMAILS = [
  { label: "contact@creedava.com", value: "contact@creedava.com" },
  { label: "sales@creedava.com", value: "sales@creedava.com" },
  { label: "info@creedava.com", value: "info@creedava.com" },
];

const DEFAULT_SURVEY_SUBJECT = "We'd love your feedback — CreedaVA Satisfaction Survey";
const CUSTOMER_STATS_NOW_MS = Date.now();

// Escalation step between "needs attention" (yellow) and "critical" (red).
// Derived from the live tokens so it lightens with them — a fixed #FF832B read
// as near-black on the dark card, and reusing --warning collapsed this into the
// bucket above it, losing the four-step ladder.
const AT_RISK_COLOR = "color-mix(in srgb, var(--warning) 55%, var(--error))";
const DEFAULT_SURVEY_HTML = `
<div style="max-width:600px;margin:0 auto;font-family:'Roboto',Arial,sans-serif;color:#0B2135;">
  <div style="text-align:center;padding:24px 0;">
    <img src="/logo.webp" alt="CreedaVA" width="120" style="margin-bottom:12px;height: auto;" />
  </div>
  <div style="background:#F7F7F2;border-radius:12px;padding:32px;border:1px solid #e8edf5;">
    <h2 style="margin:0 0 8px;color:#005148;font-size:22px;">How are we doing?</h2>
    <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.6;">
      Hi {{CUSTOMER_NAME}},<br/><br/>
      Your feedback helps us improve the services we provide. Please take a moment to rate your experience — it only takes 30 seconds.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="{{SURVEY_LINK}}" style="display:inline-block;background:#005148;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;">
        Share Your Feedback →
      </a>
    </div>
    <p style="margin:20px 0 0;color:#888;font-size:13px;text-align:center;">
      This link is unique to you and will expire in 30 days.
    </p>
  </div>
  <div style="text-align:center;padding:24px 0;color:#888;font-size:12px;">
    <p>CreedaVA — Virtual Assistant Services</p>
    <p><a href="https://creedava.com" style="color:#005148;">creedava.com</a></p>
  </div>
</div>`;

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
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormData>(emptyCustomer);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [exportingSheets, setExportingSheets] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<{ id: string; name: string; type: string; mimeType: string; webLink: string; modifiedAt: string }[]>([]);
  const [sendingSurvey, setSendingSurvey] = useState(false);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [surveyEmail, setSurveyEmail] = useState({ subject: "", html: "" });
  const [surveySender, setSurveySender] = useState(BUSINESS_EMAILS[0].value);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [healthReport, setHealthReport] = useState<CustomerHealthReport | null>(null);
  const [healthOpen, setHealthOpen] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);

  // Load satisfaction email template from emails collection
  const { data: emailDrafts, add: addEmail, edit: editEmail } = useCollection<EmailDraft>("emails", {
    orderByField: "createdAt",
  });
  const surveyTemplate = useMemo(
    () => emailDrafts.find((e) => e.purpose === "satisfaction-survey"),
    [emailDrafts],
  );


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
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.company?.toLowerCase().includes(q) ?? false)
      );
    });

  const active = customers.filter((c) => c.status === "active");
  const churned = customers.filter((c) => c.status === "churned");
  const mrr = useMemo(
    () => active.reduce((sum, c) => sum + (c.monthlyValue || 0), 0),
    [active],
  );
  const customerLtvMap = useMemo(
    () => new Map(customers.map((c) => [c.id, computeLTV(c)])),
    [customers],
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
    const totalMonths = withStart.reduce((s, c) => {
      const diff = CUSTOMER_STATS_NOW_MS - new Date(c.startDate!).getTime();
      return s + diff / (1000 * 60 * 60 * 24 * 30);
    }, 0);
    return Math.round(totalMonths / withStart.length);
  }, [active]);
  const churnRate = customers.length > 0 ? ((churned.length / customers.length) * 100).toFixed(1) : "0";

  // ─── Contact Health (based on days since last contact + satisfaction) ───
  const contactHealthData = useMemo(() => {
    const segments = [
      { label: "Healthy", sublabel: "≤ 60 days", color: "var(--chart-5)", count: 0 },
      { label: "Needs Attention", sublabel: "61–90 days", color: "var(--chart-6)", count: 0 },
      { label: "At Risk", sublabel: "91–120 days", color: AT_RISK_COLOR, count: 0 },
      { label: "Critical", sublabel: "120+ days", color: "var(--error)", count: 0 },
    ];
    active.forEach((c) => {
      if (!c.lastContactDate) { segments[3].count++; return; }
      const days = Math.floor((CUSTOMER_STATS_NOW_MS - new Date(c.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 60) segments[0].count++;
      else if (days <= 90) segments[1].count++;
      else if (days <= 120) segments[2].count++;
      else segments[3].count++;
    });
    return segments;
  }, [active]);

  const avgHealthScore = useMemo(() => {
    if (active.length === 0) return 0;
    let totalScore = 0;
    active.forEach((c) => {
      let contactScore = 0;
      if (c.lastContactDate) {
        const days = Math.floor((CUSTOMER_STATS_NOW_MS - new Date(c.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 60) contactScore = 100;
        else if (days <= 90) contactScore = 60;
        else if (days <= 120) contactScore = 30;
        else contactScore = 10;
      }
      const satScore = c.satisfaction ? (c.satisfaction / 5) * 100 : 50;
      totalScore += contactScore * 0.6 + satScore * 0.4;
    });
    return Math.round(totalScore / active.length);
  }, [active]);

  // ─── Customer Source Distribution ───
  const sourceDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach((c) => {
      const src = c.referralSource || "Unknown";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }, [customers]);
  const maxSourceCount = sourceDistribution.length > 0 ? sourceDistribution[0].count : 1;
  // Categorical ramp — every entry is a live token so the bars survive the
  // theme switch. #0B2135 and #A56EFF were fixed values that vanished on a
  // dark card.
  const sourceColors = [
    "var(--chart-1)", "var(--chart-7)", "var(--chart-3)",
    "var(--chart-5)", "var(--chart-8)", "var(--chart-4)",
    "var(--chart-6)", "var(--chart-2)",
  ];

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
        toast("Customer updated successfully");
      } else {
        await add(form);
        // Cross-sync to contacts — only if email not already in contacts
        const alreadyInContacts = contacts.some(
          (c) => (c.email ?? "").toLowerCase() === form.email.toLowerCase(),
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
    } finally {
      setSaving(false);
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

  async function handleLogContact() {
    if (!selected) return;
    const today = new Date().toISOString().split("T")[0];
    try {
      await edit(selected.id, { lastContactDate: today } as Partial<Customer>);
      setForm({ ...form, lastContactDate: today });
      toast(`Contact logged for ${selected.name}`, "success");
    } catch {
      toast("Failed to log contact", "error");
    }
  }

  function openSurveyModal() {
    if (!selected) return;
    // Load from saved template in emails collection, or use default
    if (surveyTemplate) {
      setSurveyEmail({ subject: surveyTemplate.subject, html: surveyTemplate.body });
    } else {
      setSurveyEmail({ subject: DEFAULT_SURVEY_SUBJECT, html: DEFAULT_SURVEY_HTML });
    }
    setSurveySender(BUSINESS_EMAILS[0].value);
    setSurveyModalOpen(true);
  }

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    try {
      const data = {
        purpose: "satisfaction-survey",
        subject: surveyEmail.subject,
        body: surveyEmail.html,
        previewText: "Customer satisfaction survey template",
        status: "draft" as const,
      };
      if (surveyTemplate) {
        await editEmail(surveyTemplate.id, data);
        toast("Template updated — visible in Emails → Drafts", "success");
      } else {
        await addEmail(data);
        toast("Template saved to Emails → Drafts", "success");
      }
    } catch {
      toast("Failed to save template", "error");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleHealthAnalysis() {
    setHealthLoading(true);
    try {
      const report = await lazyAnalyzeCustomerHealth();
      setHealthReport(report);
      setHealthOpen(true);
    } catch {
      toast("Health analysis failed — check data and try again", "error");
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleSendSurvey() {
    if (!selected) return;
    setSendingSurvey(true);
    try {
      // Generate token and store in Firestore with token as doc ID
      const token = crypto.randomUUID();
      const { createWithId } = await import("@/lib/firebase/firestore");
      await createWithId("satisfaction-tokens", token, {
        customerId: selected.id,
        customerName: selected.name,
        customerEmail: selected.email,
        used: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Build the survey link (uses current origin so it works in dev & prod)
      const surveyLink = `${window.location.origin}/satisfaction/${token}`;
      const finalHtml = surveyEmail.html
        .replace(/\{\{CUSTOMER_NAME\}\}/g, selected.name)
        .replace(/\{\{SURVEY_LINK\}\}/g, surveyLink);

      await cloudSendEmail({
        to: selected.email,
        from: surveySender || undefined,
        subject: surveyEmail.subject,
        html: finalHtml,
      });

      toast(`Satisfaction survey sent to ${selected.email}`, "success");
      setSurveyModalOpen(false);
    } catch {
      toast("Failed to send survey — check email integration in Settings", "error");
    } finally {
      setSendingSurvey(false);
    }
  }

  const columns: Column<Customer>[] = [
    { key: "name", header: "Name", render: (c) => {
      const now = Date.now();
      let healthColor = "var(--error)"; // critical / never contacted
      if (c.lastContactDate) {
        const days = Math.floor((now - new Date(c.lastContactDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 60) healthColor = "var(--chart-5)";
        else if (days <= 90) healthColor = "var(--chart-6)";
        else if (days <= 120) healthColor = AT_RISK_COLOR;
      }
      return (
        <span className="flex items-center gap-2 font-medium text-gray-90">
          <span className="w-2 h-2 rounded-full shrink-0 color-dot" style={{ '--dot-c': healthColor } as React.CSSProperties} title={`Last contacted: ${c.lastContactDate || "Never"}`} />
          {c.name}
        </span>
      );
    } },
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
                { label: "QBR Template", prompt: "Create a quarterly business review template for a client meeting. Include: accomplishments, KPIs, hours saved, ROI summary, and recommendations for next quarter." },
                { label: "Churn Analysis", prompt: "Analyze churned customers for patterns. Identify common churn reasons, time-to-churn, plan types most at risk, and 3 specific actions to reduce future churn." },
                { label: "NPS Survey", prompt: "Draft a Net Promoter Score survey email for customers. Include subject line, brief intro, the NPS question, and a follow-up open-ended question. Keep it short." },
                { label: "Win-Back Campaign", prompt: "Design a 3-email win-back sequence for churned customers. Each email should offer increasing value and a compelling reason to return. Include subject lines." },
                { label: "LTV Analysis", prompt: "Analyze customer lifetime value by plan type and tenure. Identify the most valuable customer segments and suggest strategies to increase LTV across all tiers." },
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
                buildTrainedPrompt("Customers", input, ctx, { includeCompetitors: true, includeKPIs: true })
              }
            />
            <Button variant="outline" size="sm" onClick={handleHealthAnalysis} isLoading={healthLoading} className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              AI Health
            </Button>
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

      {/* Contact Health & Customer Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSection title="Contact Health">
          <div className="space-y-3">
            {/* Health Score Badge */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-50 uppercase tracking-wide">Health Score</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                avgHealthScore >= 70 ? "bg-success-soft text-success-text" :
                avgHealthScore >= 40 ? "bg-warning-soft text-warning-text" :
                "bg-error-soft text-error-text"
              }`}>{avgHealthScore}%</span>
            </div>
            {contactHealthData.map((seg) => {
              const pct = active.length > 0 ? Math.round((seg.count / active.length) * 100) : 0;
              return (
                <div key={seg.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 color-dot" style={{ '--dot-c': seg.color } as React.CSSProperties} />
                      <span className="text-sm font-medium text-gray-80">{seg.label}</span>
                      <span className="text-xs text-gray-50">{seg.sublabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-90">{seg.count}</span>
                      <span className="text-xs text-gray-50">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-10 rounded-full overflow-hidden">
                    <div
                      className="bar-segment"
                      style={{ '--bar-w': `${pct}%`, '--bar-c': seg.color } as React.CSSProperties}
                    />
                  </div>
                </div>
              );
            })}
            {/* Satisfaction avg */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                <span className="text-sm text-gray-70">Avg Satisfaction</span>
              </div>
              <span className="text-sm font-semibold text-gray-90">{avgSatisfaction}/5</span>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Customer Source">
          <div className="space-y-3">
            {sourceDistribution.length === 0 ? (
              <p className="text-sm text-gray-50 text-center py-4">No source data yet</p>
            ) : (
              sourceDistribution.map((item, i) => {
                const pct = customers.length > 0 ? Math.round((item.count / customers.length) * 100) : 0;
                return (
                  <div key={item.source} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-80">{item.source}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-90">{item.count}</span>
                        <span className="text-xs text-gray-50">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-10 rounded-full overflow-hidden">
                      <div
                        className="bar-segment"
                        style={{ '--bar-w': `${(item.count / maxSourceCount) * 100}%`, '--bar-c': sourceColors[i % sourceColors.length] } as React.CSSProperties}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DashboardSection>
      </div>

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
          <div className="flex flex-col gap-2 w-full">
            {/* Action buttons row */}
            {selected && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleLogContact}>
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                  Log Contact
                </Button>
                <Button variant="outline" size="sm" onClick={openSurveyModal}>
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  Send Survey
                </Button>
                <Button variant="outline" size="sm" onClick={handleCreateDriveFolder} isLoading={creatingFolder}>
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                  Drive
                </Button>
                {(selected as Customer & { driveFolderId?: string }).driveFolderId && (
                  <Button variant="outline" size="sm" onClick={handleBrowseDriveFiles} isLoading={driveLoading}>
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    Files
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                </Button>
              </div>
            )}
            {/* Save / Cancel row */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} isLoading={saving}>
                {selected ? "Save Changes" : "Create Customer"}
              </Button>
            </div>
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
              <label className="mb-1 block text-sm font-medium text-gray-80">Lifetime Value ($)</label>
              <div className="flex h-10 items-center rounded-lg border border-border bg-gray-20 px-3 text-sm text-gray-70">
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
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm min-h-16 resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  <svg className="w-4 h-4 text-gray-50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {f.type === "folder"
                      ? <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                      : <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>
                    }
                  </svg>
                  <span className="text-sm text-gray-80 truncate">{f.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-50">{new Date(f.modifiedAt).toLocaleDateString()}</span>
                  <a href={f.webLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Satisfaction Survey Email Modal */}
      <Modal
        open={surveyModalOpen}
        onClose={() => setSurveyModalOpen(false)}
        title="Send Satisfaction Survey"
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            <Button variant="outline" size="sm" onClick={handleSaveTemplate} isLoading={savingTemplate} className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              Save Template
            </Button>
            <div className="flex-1 hidden sm:block" />
            <Button variant="outline" size="sm" onClick={() => setSurveyModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendSurvey} isLoading={sendingSurvey} className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              Send to {selected?.email}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {surveyTemplate && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success-soft text-success-text text-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              Template loaded from Emails → Drafts. Changes here update the template.
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <Select
              label="From"
              options={BUSINESS_EMAILS}
              value={surveySender}
              onChange={(e) => setSurveySender(e.target.value)}
            />
            <Input
              label="To"
              value={selected?.email || ""}
              disabled
            />
          </div>
          <Input
            label="Subject"
            value={surveyEmail.subject}
            onChange={(e) => setSurveyEmail({ ...surveyEmail, subject: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-70 mb-1">Email Body (HTML)</label>
            <textarea
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 min-h-48 resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
              value={surveyEmail.html}
              aria-label="Email Body HTML"
              onChange={(e) => setSurveyEmail({ ...surveyEmail, html: e.target.value })}
            />
            <p className="text-xs text-gray-50 mt-1">
              Use <code className="text-primary">{"{{CUSTOMER_NAME}}"}</code> and <code className="text-primary">{"{{SURVEY_LINK}}"}</code> as placeholders.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-70 mb-1">Preview</label>
            <div
              className="border border-border rounded-lg p-4 bg-card max-h-64 overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html: surveyEmail.html
                  .replace(/\{\{CUSTOMER_NAME\}\}/g, selected?.name || "Customer")
                  .replace(/\{\{SURVEY_LINK\}\}/g, "#preview"),
              }}
            />
          </div>
        </div>
      </Modal>
      <Modal open={healthOpen} onClose={() => setHealthOpen(false)} title="Customer Health Analysis — SCOUT" size="lg">
        {healthReport && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl border border-border p-4 bg-card">
              <div className={`text-4xl font-bold tabular-nums ${
                healthReport.overallHealth >= 75 ? "text-success-text" :
                healthReport.overallHealth >= 50 ? "text-warning-text" : "text-error-text"
              }`}>{healthReport.overallHealth}<span className="text-lg font-normal text-gray-50">/100</span></div>
              <div>
                <p className="text-sm font-semibold text-gray-80">Overall Health Score</p>
                <p className="text-xs text-gray-50 mt-0.5">Retention: {healthReport.retentionScore}/100 · {healthReport.mrrTrend}</p>
              </div>
            </div>
            {healthReport.churnRisk && healthReport.churnRisk.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-80 mb-2">Churn Risk</h4>
                <div className="space-y-2">
                  {healthReport.churnRisk.map((r, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border border-border p-3 text-sm">
                      <StatusBadge status={r.risk} variant={r.risk === "high" ? "error" : r.risk === "medium" ? "warning" : "success"} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-80">{r.customer}</p>
                        <p className="text-xs text-gray-50 mt-0.5">{r.signals?.join(" · ")}</p>
                        <p className="text-xs text-primary mt-1">{r.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {healthReport.upsellOpportunities && healthReport.upsellOpportunities.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-80 mb-2">Upsell Opportunities</h4>
                <div className="space-y-2">
                  {healthReport.upsellOpportunities.map((u, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-80">{u.customer}</span>
                        <span className="text-primary font-semibold">+${u.estimatedValue}/mo</span>
                      </div>
                      <p className="text-xs text-gray-60 mt-1">{u.opportunity}</p>
                      <p className="text-xs text-gray-50 mt-1 italic">{u.approach}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {healthReport.recommendations && healthReport.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-80 mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {healthReport.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-gray-60 flex gap-2">
                      <span className="text-primary shrink-0">&rarr;</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
