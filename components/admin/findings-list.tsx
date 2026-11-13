"use client";

import React, { useState } from "react";
import { StatusBadge } from "@/components/admin";
import { applySuggestion, setFindingStatus } from "@/lib/firebase/findings";
import type { Finding, FindingStatus } from "@/lib/types/findings";
import { skillLabel } from "@/lib/types/findings";

/** Severity maps onto the shared status variants so it themes with everything else. */
const SEVERITY_VARIANT: Record<Finding["severity"], "error" | "warning" | "default"> = {
  high: "error",
  medium: "warning",
  low: "default",
};

const STATUS_VARIANT: Record<FindingStatus, "info" | "default" | "success"> = {
  open: "info",
  ignored: "default",
  resolved: "success",
};

interface FindingsListProps {
  findings: Finding[];
  loading: boolean;
  /** Called after a decision so the caller refetches the collection. */
  onChanged: () => void;
  emptyMessage: string;
}

/**
 * Findings for one surface, with the two decisions an operator can make:
 * apply the fix we know how to make, or dismiss it.
 *
 * A finding leaves this list when a later run stops detecting it, so the list
 * measures the current state rather than growing into a backlog nobody closes.
 */
export function FindingsList({ findings, loading, onChanged, emptyMessage }: FindingsListProps) {
  const [showClosed, setShowClosed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const open = findings.filter((finding) => finding.status === "open");
  const closed = findings.filter((finding) => finding.status !== "open");
  const visible = showClosed ? [...open, ...closed] : open;

  const act = async (finding: Finding, action: "fix" | "ignore") => {
    setBusyId(finding.id);
    try {
      if (action === "fix") await applySuggestion(finding);
      else await setFindingStatus(finding.id, "ignored");
      onChanged();
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
