"use client";

import React, { useMemo, useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { DashboardSection, StatusBadge, useToast } from "@/components/admin";
import { Button } from "@/components/ui";

type TaskStatus = "todo" | "in-progress" | "done";

interface SeoTask {
  id: string;
  kind: string;
  title: string;
  description?: string;
  priority?: number;
  status: TaskStatus;
  area?: string;
  affectedPath?: string | null;
  /**
   * Set by `onpage.ts` when it already applied the fix itself. These rows are a
   * receipt of an automatic change, not work anyone can move — they used to be
   * mixed into the queue, where they were indistinguishable from real todos.
   */
  autoApplied?: boolean;
  appliedAt?: string;
}

const COLUMNS: TaskStatus[] = ["todo", "in-progress", "done"];

const COLUMN_TITLE: Record<TaskStatus, string> = {
  todo: "Todo",
  "in-progress": "In progress",
  done: "Done",
};

const isReceipt = (task: SeoTask): boolean => task.autoApplied === true;

export function SeoTasksBoard() {
  const { data: tasks, loading, edit } = useCollection<SeoTask>("seo-tasks", {
    orderByField: "priority",
    orderDirection: "desc",
  });
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);
  const [showReceipts, setShowReceipts] = useState(false);

  // The queue is what a human can act on. Receipts are history and stay out of it.
  const { grouped, receipts } = useMemo(() => {
    const map: Record<TaskStatus, SeoTask[]> = { todo: [], "in-progress": [], done: [] };
    const autoApplied: SeoTask[] = [];

    for (const task of tasks) {
      if (isReceipt(task)) {
        autoApplied.push(task);
        continue;
      }
      const column: TaskStatus = COLUMNS.includes(task.status) ? task.status : "todo";
      map[column].push(task);
    }

    return { grouped: map, receipts: autoApplied };
  }, [tasks]);

  const openCount = grouped.todo.length + grouped["in-progress"].length;

  async function move(task: SeoTask, next: TaskStatus) {
    setUpdating(task.id);
    try {
      await edit(task.id, { status: next });
      toast(`Moved to ${next}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardSection
        title="Pipeline"
        action={
          <span className="text-xs text-gray-50">
            {openCount} open · {receipts.length} auto-applied
          </span>
        }
      >
        {loading ? (
          <p className="text-sm text-gray-60">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <div key={col} className="bg-gray-10 rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-70">
                    {COLUMN_TITLE[col]} ({grouped[col].length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {grouped[col].length === 0 ? (
                    <p className="text-xs text-gray-60 italic">No tasks</p>
                  ) : (
                    grouped[col].map((t) => (
                      <div key={t.id} className="bg-card rounded border border-border p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-60">{t.kind}</span>
                          {typeof t.priority === "number" && (
                            <StatusBadge
                              status={`P${t.priority}`}
                              variant={t.priority > 70 ? "error" : t.priority > 40 ? "warning" : "default"}
                            />
                          )}
                        </div>
                        <div className="text-sm font-medium text-foreground mb-1">{t.title}</div>
                        {t.description && (
                          <div className="text-xs text-gray-70 whitespace-pre-line mb-2">
                            {t.description}
                          </div>
                        )}
                        {t.affectedPath && (
                          <div className="text-xs text-gray-60 mb-2">
                            Path: <code>{t.affectedPath}</code>
                          </div>
                        )}
                        <div className="flex gap-1">
                          {col !== "todo" && (
                            <Button onClick={() => move(t, "todo")} disabled={updating === t.id}>
                              ← Todo
                            </Button>
                          )}
                          {col !== "in-progress" && (
                            <Button onClick={() => move(t, "in-progress")} disabled={updating === t.id}>
                              In progress
                            </Button>
                          )}
                          {col !== "done" && (
                            <Button onClick={() => move(t, "done")} disabled={updating === t.id}>
                              Done →
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      {receipts.length > 0 && (
        <DashboardSection title="Auto-applied changes">
          <p className="text-xs text-gray-50 mb-3">
            Fixes the agent already made to the live site. Read-only history — nothing to action.
          </p>
          <div className="divide-y divide-border">
            {(showReceipts ? receipts : receipts.slice(0, 8)).map((t) => (
              <div key={t.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-90 truncate">{t.title}</p>
                    {t.affectedPath && (
                      <p className="text-xs text-gray-50 mt-0.5">
                        <code>{t.affectedPath}</code>
                        {t.appliedAt && ` · ${new Date(t.appliedAt).toLocaleString()}`}
                      </p>
                    )}
                    {t.description && (
                      <p className="text-xs text-gray-60 mt-0.5">{t.description}</p>
                    )}
                  </div>
                  <StatusBadge status="Auto-applied" variant="info" />
                </div>
              </div>
            ))}
          </div>
          {receipts.length > 8 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowReceipts((v) => !v)}
            >
              {showReceipts ? "Show fewer" : `Show all ${receipts.length}`}
            </Button>
          )}
        </DashboardSection>
      )}
    </div>
  );
}
