"use client";

import React, { useState } from "react";
import { StatusBadge } from "@/components/admin";
import { setFindingStatus } from "@/lib/firebase/findings";
import type { Finding, FindingStatus } from "@/lib/types/findings";
import { skillLabel } from "@/lib/types/findings";

const STATUS_VARIANT: Record<FindingStatus, "info" | "default" | "success"> = {
  open: "info",
  ignored: "default",
  resolved: "success",
};

interface InlineFindingProps {
  /** Findings for this row's target, most actionable first. Empty renders nothing. */
  findings: Finding[];
  /** Called after a decision so the caller refetches the collection. */
  onChanged: () => void;
}

/**
 * The agent's verdict on a row that already exists on this screen.
 *
 * Deliberately does not repeat the finding's message: the row already says what
 * the problem is. This shows only the state and the one decision left — dismiss
 * it, or reopen a dismissal. Leaving a finding un-dismissed is also a decision,
 * so an untouched row shows "Open" and nothing else happens.
 */
export function InlineFinding({ findings, onChanged }: InlineFindingProps) {
  const [busy, setBusy] = useState(false);
  const finding = findings[0];
  if (!finding) return null;

  const dismissed = finding.status === "ignored";

  const act = async () => {
    setBusy(true);
    try {
      await setFindingStatus(finding.id, dismissed ? "open" : "ignored");
      onChanged();
    } catch (err) {
      console.error("[findings] inline action failed:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-50">
      <StatusBadge status={finding.status} variant={STATUS_VARIANT[finding.status]} />
      <span>{skillLabel(finding.skill)}</span>
      {findings.length > 1 && <span>+{findings.length - 1}</span>}
      <button
        type="button"
        onClick={act}
        disabled={busy}
        className="underline underline-offset-2 hover:text-primary disabled:opacity-50"
      >
        {busy ? "Saving…" : dismissed ? "Reopen" : "Ignore"}
      </button>
    </span>
  );
}
