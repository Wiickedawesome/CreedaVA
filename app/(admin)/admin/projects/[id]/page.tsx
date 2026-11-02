"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
import type {
  Project,
  ProjectGoal,
  ProjectHistoryEntry,
  Task,
  TaskFormData,
  Contact,
  Customer,
  GoalStatus,
} from "@/lib/types/crm";
import {
  statusVariant,
  PROJECT_STATUSES,
  TASK_STATUSES,
  PRIORITIES,
  GOAL_STATUSES,
} from "@/lib/types/crm";
import { cloudListDriveFiles, cloudCreateClientFolder } from "@/lib/firebase/cloud-functions";
import { computeLTV } from "@/lib/utils/ltv";

const emptyTask: TaskFormData = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
  projectId: "",
  projectName: "",
  goalId: "",
  goalName: "",
  tags: [],
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: allProjects, loading, edit } = useCollection<Project>("projects", {
    orderByField: "createdAt",
  });
  const {
    data: allTasks,
    add: addTask,
    edit: editTask,
    del: delTask,
  } = useCollection<Task>("tasks", { orderByField: "createdAt" });

  const project = allProjects.find((p) => p.id === id);
  const projectTasks = allTasks.filter((t) => t.projectId === id);

  const { data: contacts } = useCollection<Contact>("contacts", { orderByField: "name", orderDirection: "asc" });
  const { data: customers } = useCollection<Customer>("customers", { orderByField: "createdAt" });
  const { data: allProj } = useCollection<Project>("projects", { orderByField: "createdAt" });

  // Find the linked customer for this project
  const linkedCustomer = useMemo(() => {
    if (!project) return null;
    return customers.find((c) => c.id === project.clientId) || customers.find((c) => c.name === project.clientName) || null;
  }, [project, customers]);

  // ─── Tabs ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = [
    { label: "Overview", value: "overview" },
    { label: "Goals", value: "goals", badge: (project?.goals?.length) || undefined },
    { label: "Tasks", value: "tasks", badge: projectTasks.length },
    { label: "History", value: "history", badge: project?.history?.length || 0 },
    { label: "Notes", value: "notes" },
    { label: "Files", value: "files" },
  ];

  // ─── Modals ────────────────────────────────────────
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormData>(emptyTask);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: "", description: "", measurable: "", achievable: "", relevant: "",
    targetDate: "", status: "planning" as GoalStatus, priority: "medium" as ProjectGoal["priority"],
    value: 0, notes: "",
  });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [projForm, setProjForm] = useState({ name: "", description: "", clientName: "", status: "" as Project["status"], startDate: "", endDate: "", budget: 0 });
  const [descExpanded, setDescExpanded] = useState(false);

  // ─── Drive state ───────────────────────────────────
  const [driveOpen, setDriveOpen] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<{ id: string; name: string; type: string; mimeType: string; webLink: string; modifiedAt: string }[]>([]);
  const [creatingFolder, setCreatingFolder] = useState(false);

  // ─── Goals stats ───────────────────────────────────
  // Backwards compat: old goals have `completed` boolean but no `status`
  function resolveGoalStatus(g: ProjectGoal): GoalStatus {
    if (g.status) return g.status;
    // Backwards compat: old Firestore docs stored `completed` boolean
    return (g as unknown as Record<string, unknown>).completed ? "completed" : "planning";
  }
  const goals: ProjectGoal[] = (project?.goals || []).map((g) => ({ ...g, status: resolveGoalStatus(g) }));
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const activeGoals = goals.filter((g) => g.status === "active").length;

  // ─── Goal → Task helpers ──────────────────────────
  function tasksForGoal(goalId: string) {
    return projectTasks.filter((t) => t.goalId === goalId);
  }

  // ─── Goal status label helper ──────────────────────
  function goalStatusLabel(s: GoalStatus | undefined) {
    if (!s) return "Planning";
    return s === "on-hold" ? "On Hold" : s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ─── Helpers ───────────────────────────────────────
  function addHistoryEntry(action: string, detail?: string) {
    if (!project) return;
    const entry: ProjectHistoryEntry = {
      date: new Date().toISOString(),
      action,
      detail,
    };
    const history = [...(project.history || []), entry];
    edit(project.id, { history });
  }

  // ─── Goal handlers ─────────────────────────────────

  function openGoalModal(goal?: ProjectGoal) {
    if (goal) {
      setEditingGoalId(goal.id);
      setGoalForm({
        title: goal.title,
        description: goal.description || "",
        measurable: goal.measurable || "",
        achievable: goal.achievable || "",
        relevant: goal.relevant || "",
        targetDate: goal.targetDate || "",
        status: goal.status || "planning",
        priority: goal.priority || "medium",
        value: goal.value || 0,
        notes: goal.notes || "",
      });
    } else {
      setEditingGoalId(null);
      setGoalForm({
        title: "", description: "", measurable: "", achievable: "", relevant: "",
        targetDate: "", status: "planning", priority: "medium", value: 0, notes: "",
      });
    }
    setGoalModalOpen(true);
  }

  async function handleSaveGoal() {
    if (!project || !goalForm.title.trim()) return;
    const existing = project.goals || [];

    // Strip empty strings so Firestore doesn't get undefined values
    const cleanGoal = {
      title: goalForm.title,
      description: goalForm.description || "",
      measurable: goalForm.measurable || "",
      achievable: goalForm.achievable || "",
      relevant: goalForm.relevant || "",
      targetDate: goalForm.targetDate || "",
      status: goalForm.status,
      priority: goalForm.priority || "medium",
      value: goalForm.value || 0,
      notes: goalForm.notes || "",
    };

    if (editingGoalId) {
      const oldGoal = existing.find((g) => g.id === editingGoalId);
      const updated = existing.map((g) =>
        g.id === editingGoalId ? { ...g, ...cleanGoal } : g,
      );
      await edit(project.id, { goals: updated });

      // If goal status changed, evaluate project status
      if (oldGoal && resolveGoalStatus(oldGoal) !== goalForm.status) {
        await syncProjectStatusFromGoals(updated);
        addHistoryEntry(`Goal status → ${goalStatusLabel(goalForm.status)}`, goalForm.title);
      } else {
        addHistoryEntry("Goal updated", goalForm.title);
      }
      toast("Goal updated");
    } else {
      const newGoal: ProjectGoal = {
        id: generateId(),
        ...cleanGoal,
      };
      const updatedGoals = [...existing, newGoal];
      await edit(project.id, { goals: updatedGoals });
      await syncProjectStatusFromGoals(updatedGoals);
      addHistoryEntry("Goal added", goalForm.title);
      toast("Goal added");
    }
    setGoalModalOpen(false);
  }

  /** Infer the project status from the aggregate of all goal statuses */
  async function syncProjectStatusFromGoals(updatedGoals: ProjectGoal[]) {
    if (!project || updatedGoals.length === 0) return;
    const statuses = updatedGoals.map((g) => g.status);

    let newProjectStatus: Project["status"] | null = null;

    // If ALL goals are cancelled → project cancelled
    if (statuses.every((s) => s === "cancelled")) {
      newProjectStatus = "cancelled";
    }
    // If ALL goals are completed → project completed
    else if (statuses.every((s) => s === "completed" || s === "cancelled")) {
      newProjectStatus = "completed";
    }
    // If ANY goal is active → project active
    else if (statuses.some((s) => s === "active")) {
      newProjectStatus = "active";
    }
    // If ALL goals are on-hold → project on-hold
    else if (statuses.every((s) => s === "on-hold" || s === "planning")) {
      if (statuses.some((s) => s === "on-hold")) newProjectStatus = "on-hold";
      else newProjectStatus = "planning";
    }

    if (newProjectStatus && newProjectStatus !== project.status) {
      await edit(project.id, { status: newProjectStatus });
      addHistoryEntry(`Project status → ${newProjectStatus}`, "Auto-updated from goals");
      toast(`Project status updated to ${newProjectStatus}`);
    }
  }

  // ─── Drive handlers ────────────────────────────────
  async function handleCreateDriveFolder() {
    if (!project) return;
    setCreatingFolder(true);
    try {
      const clientName = project.clientName || project.name;
      const result = await cloudCreateClientFolder(clientName, project.id);
      if (result.success) {
        await edit(project.id, { driveFolderId: result.folderId });
        addHistoryEntry("Drive folder created");
        toast("Drive folder created", "success");
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

  async function handleBrowseDriveFiles() {
    if (!project?.driveFolderId) {
      toast("Create a Drive folder first", "error");
      return;
    }
    setDriveLoading(true);
    try {
      const result = await cloudListDriveFiles(project.driveFolderId);
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

  // ─── Note handler ──────────────────────────────────
  async function handleAddNote() {
    if (!project || !noteInput.trim()) return;
    const existing = project.notes || "";
    const stamp = new Date().toLocaleString();
    const updated = existing
      ? `${existing}\n\n[${stamp}]\n${noteInput.trim()}`
      : `[${stamp}]\n${noteInput.trim()}`;
    await edit(project.id, { notes: updated });
    addHistoryEntry("Note added", noteInput.trim().slice(0, 60));
    setNoteInput("");
    toast("Note saved");
  }

  // ─── Task handlers ─────────────────────────────────
  function openTaskModal(task?: Task) {
    if (task) {
      setSelectedTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || "",
        assignedTo: task.assignedTo || "",
        projectId: id,
        projectName: project?.name || "",
        goalId: task.goalId || "",
        goalName: task.goalName || "",
        tags: task.tags || [],
      });
    } else {
      setSelectedTask(null);
      setTaskForm({
        ...emptyTask,
        projectId: id,
        projectName: project?.name || "",
      });
    }
    setTaskModalOpen(true);
  }

  async function handleSaveTask() {
    try {
      if (selectedTask) {
        await editTask(selectedTask.id, taskForm);
        toast("Task updated");
      } else {
        await addTask(taskForm);
        addHistoryEntry("Task created", taskForm.title);
        toast("Task created");
      }
      setTaskModalOpen(false);
    } catch {
      toast("Failed to save task", "error");
    }
  }

  // ─── Edit project handler ──────────────────────────
  function openEditModal() {
    if (!project) return;
    setProjForm({
      name: project.name,
      description: project.description || "",
      clientName: project.clientName || "",
      status: project.status,
      startDate: project.startDate || "",
      endDate: project.endDate || "",
      budget: project.budget || 0,
    });
    setEditModalOpen(true);
  }

  async function handleSaveProject() {
    if (!project) return;
    const statusChanged = projForm.status !== project.status;
    await edit(project.id, projForm);

    // Cascade status change to goals, phases, and tasks
    if (statusChanged) {
      const newStatus = projForm.status;
      const goalStatusMap: Record<string, GoalStatus> = {
        "on-hold": "on-hold",
        cancelled: "cancelled",
        completed: "completed",
        active: "active",
        planning: "planning",
      };
      const taskStatusMap: Record<string, Task["status"]> = {
        "on-hold": "blocked",
        cancelled: "blocked",
        completed: "done",
        active: "in-progress",
        planning: "todo",
      };

      // Update goals
      if (project.goals && project.goals.length > 0 && goalStatusMap[newStatus]) {
        const updatedGoals = project.goals.map((g) => ({
          ...g,
          status: goalStatusMap[newStatus],
        }));
        await edit(project.id, { goals: updatedGoals });
      }

      // Update tasks
      if (projectTasks.length > 0 && taskStatusMap[newStatus]) {
        for (const task of projectTasks) {
          await editTask(task.id, { status: taskStatusMap[newStatus] });
        }
      }

      addHistoryEntry("Project status changed", `Set to ${newStatus} — cascaded to goals and tasks`);
    } else {
      addHistoryEntry("Project details updated");
    }
    toast("Project updated");
    setEditModalOpen(false);
  }

  // ─── Task table columns ────────────────────────────
  const taskColumns: Column<Task>[] = [
    { key: "title", header: "Title", render: (t) => <span className="font-medium text-gray-90">{t.title}</span> },
    {
      key: "goalName" as keyof Task,
      header: "Goal",
      render: (t) => t.goalName ? (
        <span className="text-xs text-primary font-medium">{t.goalName}</span>
      ) : <span className="text-gray-50">—</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <StatusBadge status={t.status} variant={statusVariant[t.status]} />,
    },
    { key: "priority", header: "Priority", render: (t) => <span className="capitalize text-sm">{t.priority}</span> },
    {
      key: "dueDate",
      header: "Due",
      render: (t) => t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—",
    },
  ];

  // ─── Goal table columns ────────────────────────────
  const activeGoalsList = goals.filter((g) => g.status !== "completed" && g.status !== "cancelled");
  const archivedGoals = goals.filter((g) => g.status === "completed" || g.status === "cancelled");

  const goalColumns: Column<ProjectGoal>[] = [
    { key: "title" as keyof ProjectGoal, header: "Title", render: (g) => <span className="font-medium text-gray-90">{g.title}</span> },
    {
      key: "status" as keyof ProjectGoal,
      header: "Status",
      render: (g) => <StatusBadge status={goalStatusLabel(g.status)} variant={g.status === "completed" ? "success" : g.status === "active" ? "info" : g.status === "cancelled" ? "error" : g.status === "on-hold" ? "warning" : "default"} />,
    },
    {
      key: "value" as keyof ProjectGoal,
      header: "Value",
      render: (g) => g.value ? `$${g.value.toLocaleString()}` : "—",
      className: "text-right",
    },
    { key: "priority" as keyof ProjectGoal, header: "Priority", render: (g) => <span className="capitalize text-sm">{g.priority || "—"}</span> },
    {
      key: "targetDate" as keyof ProjectGoal,
      header: "Target",
      render: (g) => g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "—",
    },
  ];

  // ─── Completed goal columns ─────────────────────────
  const completedGoalColumns: Column<ProjectGoal>[] = [
    { key: "title" as keyof ProjectGoal, header: "Title", render: (g) => <span className="font-medium text-gray-90">{g.title}</span> },
    {
      key: "status" as keyof ProjectGoal,
      header: "Outcome",
      render: (g) => <StatusBadge status={goalStatusLabel(g.status)} variant={g.status === "completed" ? "success" : "error"} />,
    },
    {
      key: "value" as keyof ProjectGoal,
      header: "Value",
      render: (g) => g.value ? `$${g.value.toLocaleString()}` : "—",
      className: "text-right",
    },
    {
      key: "targetDate" as keyof ProjectGoal,
      header: "Target",
      render: (g) => g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "—",
    },
    {
      key: "notes" as keyof ProjectGoal,
      header: "Tasks",
      render: (g) => {
        const gt = tasksForGoal(g.id);
        return gt.length > 0 ? <span className="text-xs text-gray-50">{gt.filter(t => t.status === "done").length}/{gt.length} done</span> : <span className="text-gray-50">—</span>;
      },
    },
  ];

  // ─── Loading / 404 ────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-50 mb-4">Project not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/projects")}>
          ← Back to Projects
        </Button>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={`${project.status.charAt(0).toUpperCase() + project.status.slice(1)}${project.clientName ? ` · Client: ${project.clientName}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <AIPromptButton
              section="Project AI"
              description={`AI for ${project.name}`}
              placeholder="e.g. Suggest next steps, generate a project update..."
              presets={[
                { label: "Next Steps", prompt: `What are the next 3-5 actionable steps for this project? Consider the current goals and tasks.` },
                { label: "Status Email", prompt: `Write a professional status update email for this project. Include progress, completed items, upcoming milestones, and any blockers.` },
                { label: "Risk Assessment", prompt: `Assess risks for this project. For each: risk, likelihood, impact, and mitigation. Give an overall risk rating.` },
                { label: "Milestone Plan", prompt: `Create a detailed milestone plan for the remaining work. Include deliverables, estimated dates, dependencies, and success criteria for each milestone.` },
                { label: "Client Recap", prompt: `Write a client-facing project recap summarizing what has been accomplished, current status, upcoming work, and any decisions needed from the client.` },
                { label: "Resource Needs", prompt: `Analyze resource requirements for this project going forward. Identify skill gaps, capacity constraints, and recommend team adjustments.` },
                { label: "Retrospective", prompt: `Conduct a mini retrospective. What went well? What could improve? What should we start, stop, or continue doing on this project?` },
                { label: "Scope Check", prompt: `Review the current scope vs original goals. Flag any scope creep, missed deliverables, or gold-plating. Recommend scope adjustments if needed.` },
              ]}
              dataContext={`Project: ${project.name}\nClient: ${project.clientName || "N/A"}\nStatus: ${project.status}\nTasks: ${projectTasks.length} (${projectTasks.filter(t => t.status === "done").length} done)\nGoals: ${goals.length} (${completedGoals} completed, ${archivedGoals.length} archived)`}
              buildPrompt={(input, ctx) => buildTrainedPrompt("Project Detail", input, ctx, { includeKPIs: true })}
            />
            <Button variant="outline" size="sm" onClick={openEditModal}>
              Edit Project
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/projects")}>
              ← Back
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Goals" value={goals.length.toString()} badge={`${activeGoals} active · ${completedGoals} done`} />
        <StatCard label="Tasks" value={projectTasks.length.toString()} badge={`${projectTasks.filter(t => t.status === "done").length} done`} />
        <StatCard label="Budget" value={project.budget ? `$${project.budget.toLocaleString()}` : "—"} badge="total" />
        <StatCard
          label="Client LTV"
          value={linkedCustomer ? `$${computeLTV(linkedCustomer, allProj).toLocaleString()}` : "—"}
          badge={linkedCustomer?.monthlyValue ? `$${linkedCustomer.monthlyValue.toLocaleString()}/mo` : "no MRR"}
        />
        <StatCard
          label="Timeline"
          value={project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
          badge={project.endDate ? `→ ${new Date(project.endDate).toLocaleDateString()}` : "ongoing"}
        />
      </div>

      <AdminTabs tabs={tabs} defaultValue="overview" onChange={setActiveTab} />

      {/* ─── OVERVIEW TAB ─────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardSection title="Project Details">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-50">Status</span>
                <StatusBadge status={project.status} variant={statusVariant[project.status]} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-50">Client</span>
                <span className="text-gray-90 font-medium">{project.clientName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-50">Start Date</span>
                <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-50">End Date</span>
                <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-50">Budget</span>
                <span className="font-medium">{project.budget ? `$${project.budget.toLocaleString()}` : "—"}</span>
              </div>
              {project.description && (
                <div className="pt-2 border-t border-border">
                  <span className="text-gray-50 block mb-1">Description</span>
                  <div className="relative">
                    <p className={`text-gray-80 whitespace-pre-wrap transition-all duration-200 ${
                      !descExpanded ? "max-h-[4.5em] overflow-hidden" : ""
                    }`}>{project.description}</p>
                    {project.description.length > 150 && (
                      <button
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="text-primary text-xs font-medium mt-1 hover:underline cursor-pointer"
                      >
                        {descExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DashboardSection>

          <DashboardSection title="Recent Activity">
            {(project.history || []).length === 0 ? (
              <p className="text-sm text-gray-50 text-center py-6">No activity yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[...(project.history || [])].reverse().slice(0, 8).map((entry, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-80">{entry.action}</p>
                      {entry.detail && <p className="text-xs text-gray-50">{entry.detail}</p>}
                      <p className="text-xs text-gray-50">{new Date(entry.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      )}

      {/* ─── GOALS TAB ────────────────────────────────── */}
      {activeTab === "goals" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openGoalModal()}>+ Add Goal</Button>
          </div>
          <DataTable
            columns={goalColumns}
            data={activeGoalsList}
            keyExtractor={(g) => g.id}
            onRowClick={(g) => openGoalModal(g)}
            emptyMessage="No active goals — add a new goal to get started"
          />

          {/* Completed / Cancelled Goals */}
          {archivedGoals.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-50">Completed Goals</h3>
              <DataTable
                columns={completedGoalColumns}
                data={archivedGoals}
                keyExtractor={(g) => g.id}
                onRowClick={(g) => openGoalModal(g)}
                emptyMessage=""
              />
            </div>
          )}
        </div>
      )}

      {/* ─── TASKS TAB ────────────────────────────────── */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openTaskModal()}>+ Add Task</Button>
          </div>
          <DataTable
            columns={taskColumns}
            data={projectTasks}
            keyExtractor={(t) => t.id}
            onRowClick={(t) => openTaskModal(t)}
            emptyMessage="No tasks for this project"
          />
        </div>
      )}

      {/* ─── HISTORY TAB ──────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {(project.history || []).length === 0 ? (
            <p className="text-sm text-gray-50 text-center py-12">No history entries yet</p>
          ) : (
            <div className="relative pl-6 border-l-2 border-border space-y-4 max-h-[60vh] overflow-y-auto">
              {[...(project.history || [])].reverse().map((entry, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[1.6rem] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                  <div>
                    <p className="text-sm font-medium text-gray-80">{entry.action}</p>
                    {entry.detail && <p className="text-xs text-gray-50 mt-0.5">{entry.detail}</p>}
                    <p className="text-xs text-gray-50 mt-0.5">{new Date(entry.date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── NOTES TAB ────────────────────────────────── */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <textarea
              className="flex-1 rounded-lg border border-border bg-gray-10/50 px-3 py-2 text-sm text-gray-80 min-h-20 resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add a note..."
            />
          </div>
          <Button size="sm" onClick={handleAddNote} disabled={!noteInput.trim()}>Add Note</Button>
          {project.notes ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <pre className="text-sm text-gray-80 whitespace-pre-wrap font-sans leading-relaxed">{project.notes}</pre>
            </div>
          ) : (
            <p className="text-sm text-gray-50 text-center py-8">No notes yet</p>
          )}
        </div>
      )}

      {/* ─── FILES TAB ────────────────────────────────── */}
      {activeTab === "files" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {!project.driveFolderId ? (
              <Button size="sm" onClick={handleCreateDriveFolder} isLoading={creatingFolder}>
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                Create Drive Folder
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={handleBrowseDriveFiles} isLoading={driveLoading}>
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  Browse Files
                </Button>
                <a
                  href={`https://drive.google.com/drive/folders/${project.driveFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  Open in Google Drive
                </a>
              </>
            )}
          </div>

          {!project.driveFolderId ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <svg className="w-12 h-12 text-gray-30 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
              <p className="text-sm text-gray-50 mb-1">No Drive folder linked to this project</p>
              <p className="text-xs text-gray-50">Create a folder to store client files, proposals, and deliverables</p>
            </div>
          ) : driveFiles.length > 0 ? (
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {driveFiles.map((f) => (
                <div key={f.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-gray-50">Click &quot;Browse Files&quot; to load files from Drive</p>
            </div>
          )}
        </div>
      )}

      {/* ─── MODALS ───────────────────────────────────── */}

      {/* Task Modal */}
      <Modal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title={selectedTask ? "Edit Task" : "New Task"}
        footer={
          <>
            {selectedTask && (
              <Button variant="danger" size="sm" onClick={async () => {
                await delTask(selectedTask.id);
                addHistoryEntry("Task deleted", selectedTask.title);
                toast("Task deleted");
                setTaskModalOpen(false);
              }}>Delete</Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveTask}>{selectedTask ? "Save" : "Create Task"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          <Input label="Description" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Status" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as Task["status"] })} options={TASK_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
            <Select label="Priority" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task["priority"] })} options={PRIORITIES.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
          </div>
          <Select
            label="Goal"
            value={taskForm.goalId}
            onChange={(e) => {
              const goalId = e.target.value;
              const goal = goals.find((g) => g.id === goalId);
              setTaskForm({ ...taskForm, goalId, goalName: goal?.title || "" });
            }}
            options={[{ value: "", label: "— No Goal —" }, ...goals.map((g) => ({ value: g.id, label: g.title }))]}
          />
          <Input label="Due Date" type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
        </div>
      </Modal>

      {/* Goal Modal */}
      <Modal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title={editingGoalId ? "Edit Goal" : "New Goal"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setGoalModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveGoal}>{editingGoalId ? "Save" : "Add Goal"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Goal Title" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} />
          <Input label="Description" value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={goalForm.status}
              onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value as GoalStatus })}
              options={GOAL_STATUSES.map((s) => ({ value: s, label: s === "on-hold" ? "On Hold" : s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
            <Select
              label="Priority"
              value={goalForm.priority}
              onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value as ProjectGoal["priority"] })}
              options={PRIORITIES.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Target Date" type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} />
            <Input label="Value ($)" type="number" value={String(goalForm.value || "")} onChange={(e) => setGoalForm({ ...goalForm, value: Number(e.target.value) || 0 })} />
          </div>
          <Input label="How to Measure" value={goalForm.measurable} onChange={(e) => setGoalForm({ ...goalForm, measurable: e.target.value })} />
          <Input label="Requirements" value={goalForm.achievable} onChange={(e) => setGoalForm({ ...goalForm, achievable: e.target.value })} />
          <Input label="Business Impact" value={goalForm.relevant} onChange={(e) => setGoalForm({ ...goalForm, relevant: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-70 mb-1">Notes</label>
            <textarea
              className="w-full rounded-md border border-border bg-gray-10/50 px-3 py-2 text-sm min-h-16 resize-y focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={goalForm.notes}
              onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Project"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveProject}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Project Name" value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} />
          <Input label="Description" value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Client"
              value={projForm.clientName}
              onChange={(e) => setProjForm({ ...projForm, clientName: e.target.value })}
              options={[
                { value: "", label: "— Select Client —" },
                ...contacts.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />
            <Select label="Status" value={projForm.status} onChange={(e) => setProjForm({ ...projForm, status: e.target.value as Project["status"] })} options={PROJECT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={projForm.startDate} onChange={(e) => setProjForm({ ...projForm, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={projForm.endDate} onChange={(e) => setProjForm({ ...projForm, endDate: e.target.value })} />
          </div>
          <Input label="Budget ($)" type="number" value={String(projForm.budget || "")} onChange={(e) => setProjForm({ ...projForm, budget: Number(e.target.value) || 0 })} />
        </div>
      </Modal>

      {/* Drive Files Modal */}
      <Modal
        open={driveOpen}
        onClose={() => setDriveOpen(false)}
        title={`Files — ${project.name}`}
        size="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setDriveOpen(false)}>Close</Button>
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
    </div>
  );
}
