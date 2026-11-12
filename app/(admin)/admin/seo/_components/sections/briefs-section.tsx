"use client";

import React, { useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { PageHeader, DashboardSection, StatusBadge, useToast } from "@/components/admin";
import { Button } from "@/components/ui";
import { slugify } from "@/lib/utils/slug";

interface ContentBrief {
  id: string;
  keyword: string;
  status: BriefStatus;
  priority?: number;
  currentPosition?: number;
  impressions?: number;
  rankingPage?: string;
  recommendedOutline?: string[];
  generatedAt?: string;
  /** Set by `content-writer` once it has produced a blog draft. */
  blogId?: string | null;
  /** How many times `content-writer` failed to compose this brief. */
  draftAttempts?: number;
}

/**
 * Every status the writers can set. Keep in sync with
 * `functions/src/seo/synthesizer.ts` (initial write: `draft`) and
 * `functions/src/seo/content-writer.ts` (`draft-generated`, `needs-review`).
 */
type BriefStatus =
  | "draft"
  | "draft-generated"
  | "needs-review"
  | "in-progress"
  | "published"
  | "archived";

const STATUS_BADGE: Record<BriefStatus, { label: string; variant: "default" | "success" | "warning" | "error" | "info" }> = {
  draft: { label: "Draft", variant: "default" },
  "draft-generated": { label: "Blog draft ready", variant: "info" },
  "needs-review": { label: "Needs review", variant: "error" },
  "in-progress": { label: "In progress", variant: "warning" },
  published: { label: "Published", variant: "success" },
  archived: { label: "Archived", variant: "default" },
};

const badgeFor = (status: string) =>
  STATUS_BADGE[status as BriefStatus] ?? { label: status, variant: "default" as const };

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
      toast("Action item created in pipeline");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create task", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function markStatus(brief: ContentBrief, status: BriefStatus) {
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
      const slug = slugify(brief.keyword);
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
        as="h2"
        title="Content Briefs"
        description="Written by the synthesizer from crawler findings — thin pages and striking-distance keywords. The content writer then turns each draft into a blog post."
      />
      <DashboardSection title="All briefs">
        {loading ? (
          <p className="text-sm text-gray-60">Loading…</p>
        ) : briefs.length === 0 ? (
          <p className="text-sm text-gray-60">
            No briefs yet. The synthesizer writes these every Sunday from thin-content audits and
            striking-distance keywords, then the content writer drafts a blog post for each.
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
                    status={badgeFor(b.status).label}
                    variant={badgeFor(b.status).variant}
                  />
                </div>
                {b.rankingPage && (
                  <div className="text-xs text-gray-50 mb-2">
                    Existing page: <code>{b.rankingPage}</code>
                  </div>
                )}
                {b.blogId && (
                  <div className="text-xs text-gray-50 mb-2">
                    Blog draft: <code>{b.blogId}</code>
                  </div>
                )}
                {b.status === "needs-review" && (
                  <p className="text-xs text-error mb-2">
                    The content writer gave up after {b.draftAttempts ?? 0} attempts. Retry to
                    queue it again, or write it by hand.
                  </p>
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
                  {b.status === "needs-review" && (
                    <Button
                      size="sm"
                      onClick={() => markStatus(b, "draft")}
                      disabled={busyId === b.id}
                    >
                      Retry next run
                    </Button>
                  )}
                  {b.status !== "published" && b.status !== "archived" && (
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
