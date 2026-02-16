"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCollection } from "@/hooks/useCollection";
import {
  PageHeader,
  AdminTabs,
  DataTable,
  StatusBadge,
  Modal,
  Select,
  AIPromptButton,
  useToast,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import type { Project, ProjectFormData } from "@/lib/types/crm";
import { statusVariant, PROJECT_STATUSES } from "@/lib/types/crm";
import type { EmailDraft } from "@/lib/types/content";

const emptyProject: ProjectFormData = {
  name: "",
  description: "",
  status: "planning",
  clientName: "",
  startDate: "",
  endDate: "",
  budget: 0,
  tags: [],
};

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, loading, add, edit, del } = useCollection<Project>("projects", {
    orderByField: "createdAt",
  });
  const { add: addEmail } = useCollection<EmailDraft>("emails", { orderByField: "createdAt" });
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormData>(emptyProject);

  /** Save AI output — emails go to Emails, project plans populate the form */
  async function handleAIResult(result: string) {
    const text = result.trim();
    const subjectMatch = text.match(/Subject\s*:\s*(.+)/i);
    const isEmail = !!subjectMatch;

    if (isEmail) {
      // Status update emails → save to emails collection
      const subject = subjectMatch![1].trim();
      const bodyStart = text.indexOf(subjectMatch![0]) + subjectMatch![0].length;
      const body = text.slice(bodyStart).trim();
      try {
        await addEmail({
          purpose: "project-update",
          subject,
          body,
          previewText: body.slice(0, 120).replace(/\n/g, " "),
          status: "draft",
        });
        toast("Status update saved to Emails", "success");
      } catch {
        toast("Failed to save email draft", "error");
      }
    } else {
      // Project plans / risk assessments → open modal with AI content
      setSelected(null);
      setForm({
        ...emptyProject,
        name: "AI Generated Project",
        description: text,
      });
      setModalOpen(true);
      toast("AI content loaded into form — review and save", "info");
    }
  }

  const filtered = projects.filter((p) => tab === "all" || p.status === tab);

  const tabs = [
    { label: "All", value: "all", badge: projects.length },
    ...PROJECT_STATUSES.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s,
      badge: projects.filter((p) => p.status === s).length,
    })),
  ];

  function openModal(project?: Project) {
    if (project) {
      setSelected(project);
      setForm({
        name: project.name,
        description: project.description || "",
        status: project.status,
        clientName: project.clientName || "",
        startDate: project.startDate || "",
        endDate: project.endDate || "",
        budget: project.budget || 0,
        tags: project.tags || [],
      });
    } else {
      setSelected(null);
      setForm(emptyProject);
    }
    setModalOpen(true);
  }

  async function handleSave() {
    try {
      if (selected) {
        await edit(selected.id, form);
        toast("Project updated successfully");
      } else {
        await add(form);
        toast("Project created successfully");
      }
      setModalOpen(false);
    } catch {
      toast("Failed to save project", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Project deleted");
      setDeleteOpen(false);
      setModalOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete project", "error");
    } finally {
      setDeleting(false);
    }
  }

  function formatRange(start?: string, end?: string) {
    if (!start) return "—";
    const s = new Date(start).toLocaleDateString();
    return end ? `${s} → ${new Date(end).toLocaleDateString()}` : `${s} →`;
  }

  const columns: Column<Project>[] = [
    { key: "name", header: "Project", render: (p) => <span className="font-medium text-gray-90">{p.name}</span> },
    { key: "clientName", header: "Client", render: (p) => p.clientName || "—" },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge status={p.status} variant={statusVariant[p.status]} />,
    },
    {
      key: "startDate",
      header: "Timeline",
      render: (p) => <span className="text-sm">{formatRange(p.startDate, p.endDate)}</span>,
    },
    {
      key: "budget",
      header: "Budget",
      render: (p) => (p.budget ? `$${p.budget.toLocaleString()}` : "—"),
      className: "text-right",
    },
    {
      key: "tags",
      header: "Tags",
      render: (p) =>
        p.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {p.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          "—"
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
        title="Projects"
        description="Track project timelines, budgets, and deliverables"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <AIPromptButton
              section="Projects AI"
              description="Plan projects and track deliverables"
              placeholder="e.g. Create a project plan for website redesign, assess risks across projects..."
              presets={[
                { label: "Project Plan", prompt: "Create a project plan with 6-10 milestones, timeline, deliverables, resource needs, and risk factors. Consider the current project load." },
                { label: "Risk Assessment", prompt: "Assess risks across all active projects. For each: list top 2 risks, likelihood, impact, and mitigation strategy. Give an overall portfolio risk summary." },
                { label: "Status Update", prompt: "Write a professional status update email covering all projects. For each project: status, progress, next steps. End with action items." },
                { label: "Capacity Planning", prompt: "Analyze current project load and team capacity. Identify overallocated resources, upcoming availability gaps, and recommend adjustments." },
                { label: "Portfolio Health", prompt: "Rate portfolio health across all projects. For each: on-track/at-risk/off-track with reasoning. Give an overall portfolio health score and top 3 actions." },
                { label: "Budget Review", prompt: "Review budget utilization across all projects. Identify overspend risks, underutilized budgets, and recommend reallocations." },
                { label: "Client Priorities", prompt: "Rank active projects by client importance and revenue impact. Suggest which projects deserve more attention and resources." },
                { label: "New Project Scope", prompt: "Draft a scope document template for a new VA services project. Include objectives, deliverables, timeline, success criteria, and assumptions." },
              ]}
              dataContext={(() => {
                const byStatus = Object.entries(projects.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }), {} as Record<string, number>)).map(([s, c]) => `${s}: ${c}`).join(", ");
                const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
                const activeProjects = projects.filter(p => p.status === "active").map(p => `${p.name} (${p.clientName || "no client"}, $${p.budget || 0})`).join("; ");
                return `CreedaVA Projects (${projects.length} total):\nBy status: ${byStatus}\nTotal budget: $${totalBudget}\nActive: ${activeProjects || "none"}`;
              })()}
              buildPrompt={(input, ctx) =>
                buildTrainedPrompt("Projects", input, ctx, { includeKPIs: true })
              }
              onResult={handleAIResult}
            />
            <Button size="sm" onClick={() => openModal()} className="w-full sm:w-auto">
              + Add Project
            </Button>
          </div>
        }
      />

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => router.push(`/admin/projects/${p.id}`)}
        emptyMessage="No projects found"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? "Edit Project" : "New Project"}
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
            <Button size="sm" onClick={handleSave} className="w-full sm:w-auto">
              {selected ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Project Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Client Name" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })}
              options={PROJECT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <Input
            label="Budget ($)"
            type="number"
            value={String(form.budget || "")}
            onChange={(e) => setForm({ ...form, budget: Number(e.target.value) || 0 })}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Project"
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
