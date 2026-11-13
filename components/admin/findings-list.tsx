"use client";

import React, { useMemo, useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { createWithId, getCollection, limit, update, where } from "@/lib/firebase/firestore";
import type { FindingScope, FindingStatus, FirestoreFindingFields } from "@/lib/types/findings";
import { byUrgency, skillLabel } from "@/lib/types/findings";
import { StatusBadge } from "@/components/admin";

/** Severity maps onto the shared status variants so it themes with everything else. */
const SEVERITY_VARIANT: Record<FirestoreFindingFields["severity"], "error" | "warning" | "default"> = {
  high: "error",
  medium: "warning",
  low: "default",
};

const STATUS_VARIANT: Record<FindingStatus, "info" | "default" | "success"> = {
  open: "info",
  ignored: "default",
  resolved: "success",
};

type FindingRow = FirestoreFindingFields & { id: string };

/** Close a finding and record who decided, and why. */
async function closeFinding(id: string, status: FindingStatus, resolvedBy: string): Promise<void> {
  await update("findings", id, {
    status,
    ...(status === "open" ? {} : { resolvedAt: new Date().toISOString(), resolvedBy }),
  } as Partial<FirestoreFindingFields>);
}

/**
 * Write the finding's suggested value into `page-seo`, then close it.
 *
 * Recorded as `resolved` rather than deleted: the next crawl either confirms it
 * by not re-detecting the code, or reopens it if the value still fails.
 */
async function applySuggestion(finding: FindingRow): Promise<void> {
  const suggestion = finding.suggested;
  if (!suggestion) return;

  const { getDocs, query } = await import("firebase/firestore");
  const matches = await getDocs(
    query(getCollection("page-seo"), where("path", "==", finding.target), limit(1)),
  );

  // Reuse the path's row when one exists, so the metadata editor and this fix
  // cannot end up maintaining two documents for the same page.
  const existingId = matches.empty ? null : matches.docs[0].id;
  await createWithId(
    "page-seo",
    existingId ?? `page-seo_${finding.target.replace(/[^a-z0-9]/gi, "_")}`,
    existingId ? { [suggestion.field]: suggestion.value } : { path: finding.target, [suggestion.field]: suggestion.value },
  );

  await closeFinding(finding.id, "resolved", "fix-applied");
}

interface FindingsListProps {
  /** Restrict to one scope, e.g. "page" on Page metadata. */
  scope: FindingScope;
  /** Restrict to one or more skills. Omitted means every skill in scope. */
  skills?: string[];
  emptyMessage: string;
}

/**
 * Findings for one surface, with the two decisions an operator can make:
 * apply the fix we know how to make, or dismiss it.
 *
 * A finding leaves this list when a later run stops detecting it, so the list
 * measures the current state rather than growing into a backlog nobody closes.
 */
export function FindingsList({ scope, skills, emptyMessage }: FindingsListProps) {
  const { data: rows, loading } = useCollection<FirestoreFindingFields>("findings");
  const [showClosed, setShowClosed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const findings = useMemo(() => {
    const skillSet = skills ? new Set(skills) : null;
    return rows
      .filter((row) => row.scope === scope)
      .filter((row) => !skillSet || skillSet.has(row.skill))
      .sort(byUrgency);
  }, [rows, scope, skills]);

  const open = findings.filter((finding) => finding.status === "open");
  const closed = findings.filter((finding) => finding.status !== "open");
  const visible = showClosed ? [...open, ...closed] : open;

  const act = async (finding: FindingRow, action: "fix" | "ignore") => {
    setBusyId(finding.id);
    try {
      if (action === "fix") await applySuggestion(finding);
      else await closeFinding(finding.id, "ignored", "admin");
    } catch (err) {
      console.error("[findings] action failed:", err);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-sm text-gray-50">Loading findings…</p>;
  if (findings.length === 0) return <p className="text-sm text-gray-50">{emptyMessage}</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-50">
          {open.length === 0 ? "Nothing open." : `${open.length} open`}
        </p>
        {closed.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClosed((previous) => !previous)}
            className="text-xs text-gray-50 underline underline-offset-2 hover:text-primary"
          >
            {showClosed ? "Hide" : "Show"} {closed.length} closed
          </button>
        )}
      </div>

      {visible.length === 0 && <p className="text-sm text-gray-50">Nothing open right now.</p>}

      <ul className="space-y-2">
        {visible.map((finding) => (
          <li
            key={finding.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge status={finding.severity} variant={SEVERITY_VARIANT[finding.severity]} />
                <StatusBadge status={finding.status} variant={STATUS_VARIANT[finding.status]} />
                <span className="text-[11px] text-gray-50">{skillLabel(finding.skill)}</span>
                <span className="text-[11px] text-gray-50">·</span>
                <span className="font-mono text-[11px] text-gray-50">{finding.target}</span>
              </div>
              <p className="text-sm text-foreground">{finding.message}</p>
              {finding.evidence && (
                <p className="break-all font-mono text-[11px] text-gray-50">source: {finding.evidence}</p>
              )}
            </div>

            {finding.status === "open" && (
              <div className="flex shrink-0 gap-2">
                {finding.suggested && (
                  <button
                    type="button"
                    disabled={busyId === finding.id}
                    onClick={() => act(finding, "fix")}
                    className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {busyId === finding.id ? "Saving…" : "Fix"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === finding.id}
                  onClick={() => act(finding, "ignore")}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-gray-70 hover:bg-gray-50 disabled:opacity-50"
                >
                  Ignore
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
