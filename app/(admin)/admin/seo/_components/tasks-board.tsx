"use client";

import React, { useMemo, useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { DashboardSection, StatusBadge, useToast } from "@/components/admin";
import { Button } from "@/components/ui";

interface SeoTask {
  id: string;
  kind: string;
  title: string;
  description?: string;
  priority?: number;
  status: "todo" | "in-progress" | "done";
  area?: string;
  affectedPath?: string | null;
}

const COLUMNS: SeoTask["status"][] = ["todo", "in-progress", "done"];

export function SeoTasksBoard() {
  const { data: tasks, loading, edit } = useCollection<SeoTask>("seo-tasks", {
    orderByField: "priority",
    orderDirection: "desc",
  });
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<SeoTask["status"], SeoTask[]> = { todo: [], "in-progress": [], done: [] };
    for (const t of tasks) {
      const key: SeoTask["status"] = COLUMNS.includes(t.status) ? t.status : "todo";
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  async function move(task: SeoTask, next: SeoTask["status"]) {
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
    <DashboardSection title="Pipeline">
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div key={col} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                  {col} ({grouped[col].length})
                </h3>
              </div>
              <div className="space-y-2">
                {grouped[col].length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No tasks</p>
                ) : (
                  grouped[col].map((t) => (
                    <div key={t.id} className="bg-white rounded border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">{t.kind}</span>
                        {typeof t.priority === "number" && (
                          <StatusBadge
                            status={`P${t.priority}`}
                            variant={t.priority > 70 ? "error" : t.priority > 40 ? "warning" : "default"}
                          />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 mb-1">{t.title}</div>
                      {t.description && (
                        <div className="text-xs text-gray-600 whitespace-pre-line mb-2">{t.description}</div>
                      )}
                      {t.affectedPath && (
                        <div className="text-xs text-gray-500 mb-2">
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
  );
}
