"use client";

import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { useState } from "react";
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
import type { Task, TaskFormData, Project } from "@/lib/types/crm";
import type { EmailDraft } from "@/lib/types/content";
import {
  statusVariant,
  TASK_STATUSES,
  PRIORITIES,
} from "@/lib/types/crm";

// Priority ramp, low → urgent. `high` needs its own step: reusing --error
// would make it indistinguishable from `urgent`, and --warning is already
// `medium`. `.priority-high` derives from both tokens so it lightens with them.
const priorityDot: Record<string, string> = {
  low: "bg-gray-40",
  medium: "bg-warning",
  high: "priority-high",
  urgent: "bg-error",
};

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

export default function TasksPage() {
  const { data: tasks, loading, add, edit, del } = useCollection<Task>("tasks", {
    orderByField: "createdAt",
  });
  const { data: projects } = useCollection<Project>("projects", { orderByField: "createdAt" });
  const { add: addEmail } = useCollection<EmailDraft>("emails", { orderByField: "createdAt" });
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormData>(emptyTask);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");

  /** Save AI output — load into form so user can review and save */
  function handleAIResult(result: string) {
    const text = result.trim();
    setSelected(null);
    setForm({
      ...emptyTask,
      title: "AI Generated Task",
      description: text,
    });
    setModalOpen(true);
    toast("AI content loaded into form — review and save", "info");
  }

  /** Generate a reminder email and save to emails collection */
  async function handleSendReminder() {
    if (!selected && !form.title) return;
    const taskTitle = selected?.title || form.title;
    const dueDate = form.dueDate || selected?.dueDate;
    const subject = `Reminder: ${taskTitle}`;
    const body = `<p>This is a reminder for the following task:</p>
<p><strong>${taskTitle}</strong></p>
${form.description ? `<p>${form.description}</p>` : ""}
${dueDate ? `<p>Due: ${new Date(dueDate).toLocaleDateString()}</p>` : ""}
<p>Priority: ${form.priority || selected?.priority || "medium"}</p>
${form.projectName ? `<p>Project: ${form.projectName}</p>` : ""}
<p>— CreedaVA Task Manager</p>`;

    try {
      const emailId = await addEmail({
        purpose: "task-reminder",
        subject,
        body,
        previewText: `Reminder: ${taskTitle}${dueDate ? ` — Due ${new Date(dueDate).toLocaleDateString()}` : ""}`,
        status: "draft",
      });
      // Save reminder reference on the task
      const reminder = { date: reminderDate || new Date().toISOString().slice(0, 10), time: reminderTime, sent: false, emailId };
      if (selected) {
        await edit(selected.id, { reminder });
      }
      setForm((f) => ({ ...f, reminder }));
      toast("Reminder email saved to Emails", "success");
      setReminderOpen(false);
    } catch {
      toast("Failed to create reminder email", "error");
    }
  }

  // Filter
  const filtered = tasks
    .filter((t) => tab === "all" || t.status === tab)
    .filter((t) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false)
      );
    });

  const tabs = [
    { label: "All", value: "all", badge: tasks.length },
    ...TASK_STATUSES.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: s,
      badge: tasks.filter((t) => t.status === s).length,
    })),
  ];

  function openModal(task?: Task) {
    if (task) {
      setSelected(task);
      setForm({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || "",
        assignedTo: task.assignedTo || "",
        projectId: task.projectId || "",
        projectName: task.projectName || "",
        reminder: task.reminder,
        tags: task.tags || [],
      });
    } else {
      setSelected(null);
      setForm(emptyTask);
    }
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast("Title is required", "error");
      return;
    }

    setSaving(true);
    try {
      if (selected) {
        await edit(selected.id, form);
        toast("Task updated successfully");
      } else {
        await add(form);
        toast("Task created successfully");
      }
      setModalOpen(false);
    } catch {
      toast("Failed to save task", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Task deleted");
      setDeleteOpen(false);
      setModalOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete task", "error");
    } finally {
      setDeleting(false);
    }
  }

  function isOverdue(dateStr?: string) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  const columns: Column<Task>[] = [
    {
      key: "priorityDot",
      header: "",
      className: "w-8",
      render: (t) => (
        <span className={`block h-2.5 w-2.5 rounded-full ${priorityDot[t.priority]}`} title={t.priority} />
      ),
    },
    { key: "title", header: "Title", render: (t) => <span className="font-medium text-gray-90">{t.title}</span> },
    {
      key: "projectName" as keyof Task,
      header: "Project",
      render: (t) => t.projectName ? (
        <span className="text-xs text-primary font-medium">{t.projectName}</span>
      ) : <span className="text-gray-50">—</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (t) => <StatusBadge status={t.status} variant={statusVariant[t.status]} />,
    },
    {
      key: "priority",
      header: "Priority",
      render: (t) => <span className="capitalize text-sm">{t.priority}</span>,
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (t) =>
        t.dueDate ? (
          <span className={isOverdue(t.dueDate) && t.status !== "done" ? "text-error font-medium" : ""}>
            {new Date(t.dueDate).toLocaleDateString()}
          </span>
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
        title="Tasks"
        description="Manage your team&apos;s tasks and to-dos"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <AIPromptButton
              section="Tasks AI"
              description="Prioritize and plan your work"
              placeholder="e.g. Prioritize all tasks by urgency, break down a complex task..."
              presets={[
                { label: "Prioritize Tasks", prompt: "Rank all tasks using an urgency/impact matrix from most to least important. For each explain WHY it should be at that priority. Highlight overdue items. Suggest a daily plan." },
                { label: "Break Down Task", prompt: "Break down a complex task into 5-8 actionable subtasks. For each subtask: title, estimated time, and what to watch out for." },
                { label: "Status Report", prompt: "Write a concise task status report. Format: Summary (2 sentences), then Completed, In Progress, Blocked, and Upcoming sections. Highlight risks and overdue items." },
                { label: "Sprint Plan", prompt: "Create a 1-week sprint plan from the current task list. Group tasks by priority, assign estimated hours, and identify dependencies." },
                { label: "Delegation Guide", prompt: "Identify which tasks should be delegated to virtual assistants. For each: explain why it's delegatable, skill level needed, and handoff instructions." },
                { label: "Blocker Analysis", prompt: "Identify blocked or stalled tasks. For each: probable root cause, suggested resolution, and escalation path if unresolved in 48 hours." },
                { label: "Automation Ideas", prompt: "Review recurring tasks and suggest which ones can be automated. For each: automation approach, tool recommendation, and estimated time savings per week." },
                { label: "End-of-Day Recap", prompt: "Generate an end-of-day recap. Cover: tasks completed today, what moved to in-progress, new tasks added, blockers encountered, and top 3 priorities for tomorrow." },
              ]}
              dataContext={(() => {
                const byStatus = Object.entries(tasks.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {} as Record<string, number>)).map(([s, c]) => `${s}: ${c}`).join(", ");
                const byPriority = Object.entries(tasks.reduce((acc, t) => ({ ...acc, [t.priority]: (acc[t.priority] || 0) + 1 }), {} as Record<string, number>)).map(([s, c]) => `${s}: ${c}`).join(", ");
                const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").map(t => t.title);
                return `CreedaVA Tasks (${tasks.length} total):\nBy status: ${byStatus}\nBy priority: ${byPriority}\nOverdue: ${overdue.length > 0 ? overdue.join(", ") : "none"}`;
              })()}
              buildPrompt={(input, ctx) =>
                buildTrainedPrompt("Tasks", input, ctx, { includeKPIs: true })
              }
              onResult={handleAIResult}
            />
            <Button size="sm" onClick={() => openModal()} className="w-full sm:w-auto">
              + Add Task
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="max-w-sm w-full">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AdminTabs tabs={tabs} defaultValue="all" onChange={setTab} />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(t) => t.id}
        onRowClick={(t) => openModal(t)}
        emptyMessage="No tasks found"
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? "Edit Task" : "New Task"}
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
              {selected ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}
              options={TASK_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
              options={PRIORITIES.map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <Select
              label="Project"
              value={form.projectId || ""}
              onChange={(e) => {
                const proj = projects.find((p) => p.id === e.target.value);
                setForm({ ...form, projectId: e.target.value || "", projectName: proj?.name || "" });
              }}
              options={[
                { value: "", label: "No project" },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          {/* Reminder section */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-sm text-gray-60">
              {form.reminder ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
                  Reminder: {new Date(form.reminder.date).toLocaleDateString()}{form.reminder.time ? ` at ${form.reminder.time}` : ""}
                </span>
              ) : (
                <span className="text-gray-50">No reminder set</span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              setReminderDate(form.dueDate || new Date().toISOString().slice(0, 10));
              setReminderTime("09:00");
              setReminderOpen(true);
            }}>
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
              {form.reminder ? "Edit Reminder" : "Set Reminder"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Task"
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
          Are you sure you want to delete <strong>{selected?.title}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* Reminder Modal */}
      <Modal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        title="Set Reminder"
        size="sm"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            {form.reminder && (
              <Button variant="danger" size="sm" onClick={() => {
                setForm((f) => ({ ...f, reminder: undefined }));
                if (selected) edit(selected.id, { reminder: null as unknown as undefined });
                setReminderOpen(false);
                toast("Reminder removed");
              }} className="w-full sm:w-auto">
                Remove
              </Button>
            )}
            <div className="flex-1 hidden sm:block" />
            <Button variant="outline" size="sm" onClick={() => setReminderOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendReminder} className="w-full sm:w-auto">
              Save &amp; Create Email
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-60">
            Set a reminder date and a draft email will be saved to Emails for you to send.
          </p>
          <Input
            label="Reminder Date"
            type="date"
            value={reminderDate}
            onChange={(e) => setReminderDate(e.target.value)}
          />
          <Input
            label="Time"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
