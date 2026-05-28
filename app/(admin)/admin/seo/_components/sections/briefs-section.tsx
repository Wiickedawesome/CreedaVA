"use client";

import React, { useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { PageHeader, DashboardSection, StatusBadge, useToast } from "@/components/admin";
import { Button } from "@/components/ui";

interface ContentBrief {
  id: string;
  keyword: string;
  status: "draft" | "in-progress" | "published" | "archived";
  priority?: number;
  currentPosition?: number;
  impressions?: number;
  rankingPage?: string;
  recommendedOutline?: string[];
  generatedAt?: string;
}

interface SeoTaskInput {
  kind: string;
  title: string;
  description?: string;
  priority?: number;
  status: "todo" | "in-progress" | "done";
  area?: string;
  affectedPath?: string | null;
}

export default function BriefsSection() {
  const { data: briefs, loading, edit } = useCollection<ContentBrief>("content-briefs", {
    orderByField: "priority",
    orderDirection: "desc",
  });
  const { add: addTask } = useCollection<SeoTaskInput>("seo-tasks", {
    orderByField: "priority",
    orderDirection: "desc",
  });
  const { add: addBlog } = useCollection<Omit<import("@/lib/types/content").BlogPost, "id" | "createdAt" | "updatedAt">>("blog", {
    orderByField: "updatedAt",
    orderDirection: "desc",
  });
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createTask(brief: ContentBrief) {
    setBusyId(brief.id);
    try {
      await addTask({
        kind: "content-brief",
        title: `Write content for "${brief.keyword}"`,
        description: brief.recommendedOutline?.length
          ? `Outline:\n- ${brief.recommendedOutline.join("\n- ")}`
          : `Brief id: ${brief.id}`,
        priority: brief.priority ?? 50,
        status: "todo",
        area: "seo",
        affectedPath: brief.rankingPage ?? null,
      });
      await edit(brief.id, { status: "in-progress" });
      toast("Task created in pipeline");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create task", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function markStatus(brief: ContentBrief, status: ContentBrief["status"]) {
    setBusyId(brief.id);
    try {
      await edit(brief.id, { status });
      toast(`Marked ${status}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function createBlogDraft(brief: ContentBrief) {
    setBusyId(brief.id);
    try {
      const slug = brief.keyword
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
      const outlineHtml = brief.recommendedOutline?.length
        ? brief.recommendedOutline.map((item) => `<h2>${item}</h2>\n<p></p>`).join("\n")
        : "<p></p>";
      await addBlog({
        title: brief.keyword.charAt(0).toUpperCase() + brief.keyword.slice(1),
        slug,
        excerpt: "",
        content: outlineHtml,
        tags: ["seo-brief"],
        metaDescription: "",
        status: "draft",
      });
      await edit(brief.id, { status: "in-progress" });
      toast("Blog draft created");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create draft", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Content Briefs"
        description="Auto-generated weekly from striking-distance keywords (positions 11–30). Convert to a task when ready to write."
      />
      <DashboardSection title="All briefs">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : briefs.length === 0 ? (
          <p className="text-sm text-gray-500">
            No briefs yet. The synthesizer generates these every Sunday from striking-distance keywords surfaced in the Opportunities tab.
          </p>
        ) : (
          <div className="space-y-3">
            {briefs.map((b) => (
              <div key={b.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{b.keyword}</h3>
                    <div className="text-xs text-gray-50">
                      pos {b.currentPosition?.toFixed(1) ?? "—"} • {b.impressions ?? 0} impressions • priority {b.priority ?? 0}
                    </div>
                  </div>
                  <StatusBadge
                    status={b.status}
                    variant={
                      b.status === "published" ? "success" : b.status === "in-progress" ? "info" : "default"
                    }
                  />
                </div>
                {b.rankingPage && (
                  <div className="text-xs text-gray-50 mb-2">
                    Existing page: <code>{b.rankingPage}</code>
                  </div>
                )}
                {b.recommendedOutline && b.recommendedOutline.length > 0 && (
                  <ol className="text-sm text-gray-70 list-decimal pl-5 space-y-0.5 mb-3">
                    {b.recommendedOutline.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                )}
                <div className="flex flex-wrap gap-2">
                  {b.status === "draft" && (
                    <Button size="sm" onClick={() => createTask(b)} disabled={busyId === b.id}>
                      Convert to task
                    </Button>
                  )}
                  {b.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createBlogDraft(b)}
                      disabled={busyId === b.id}
                    >
                      Convert to blog draft
                    </Button>
                  )}
                  {b.status !== "published" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markStatus(b, "published")}
                      disabled={busyId === b.id}
                    >
                      Mark published
                    </Button>
                  )}
                  {b.status !== "archived" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markStatus(b, "archived")}
                      disabled={busyId === b.id}
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
