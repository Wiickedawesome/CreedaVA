"use client";

import React, { useState } from "react";
import { useCollection } from "@/hooks/useCollection";
import { PageHeader, DashboardSection, StatusBadge, useToast } from "@/components/admin";
import { Button } from "@/components/ui";

interface OutreachEmail {
  id: string;
  prospectId: string;
  kind: string;
  targetDomain?: string;
  targetUrl?: string;
  targetTitle?: string;
  subject: string;
  body: string;
  status: "draft" | "approved" | "sent" | "skipped" | "error" | "needs-recipient";
  score?: number;
  toEmail?: string;
  error?: string;
}

export default function OutreachSection() {
  const { data: emails, loading, edit } = useCollection<OutreachEmail>("outreach-emails", {
    orderByField: "score",
    orderDirection: "desc",
  });
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);
  const [toInputs, setToInputs] = useState<Record<string, string>>({});

  async function setStatus(id: string, status: OutreachEmail["status"]) {
    if (status === "approved") {
      const confirmed = window.confirm("Approve this draft and trigger sending now?");
      if (!confirmed) return;
    }
    if (status === "sent") {
      const confirmed = window.confirm("Mark this outreach email as sent?");
      if (!confirmed) return;
    }
    if (status === "skipped") {
      const confirmed = window.confirm("Skip this outreach draft?");
      if (!confirmed) return;
    }

    setUpdating(id);
    try {
      const patch: Partial<OutreachEmail> = { status };
      if (status === "approved") {
        const to = (toInputs[id] ?? "").trim();
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
          toast("Enter a valid recipient email before approving", "error");
          setUpdating(null);
          return;
        }
        patch.toEmail = to;
      }
      await edit(id, patch);
      toast(status === "approved" ? "Approved — sending…" : `Marked ${status}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Outreach Drafts"
        description="Auto-drafted backlink emails. Review, edit (in your mail client), then mark sent."
      />
      <DashboardSection title="All drafts">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : emails.length === 0 ? (
          <p className="text-sm text-gray-500">No drafts yet. The agent generates outreach every Sunday.</p>
        ) : (
          <div className="space-y-3">
            {emails.map((e) => (
              <div key={e.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-50">{e.kind} • score {e.score ?? 0}</div>
                    <div className="text-sm font-semibold text-foreground">{e.targetDomain}</div>
                    {e.targetUrl && (
                      <a
                        href={e.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block max-w-md"
                      >
                        {e.targetUrl}
                      </a>
                    )}
                  </div>
                  <StatusBadge
                    status={e.status}
                    variant={e.status === "sent" ? "success" : e.status === "approved" ? "info" : e.status === "skipped" ? "default" : "warning"}
                  />
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="text-xs text-gray-50 mb-1">Subject</div>
                  <div className="text-sm font-medium text-foreground mb-2">{e.subject}</div>
                  <div className="text-xs text-gray-50 mb-1">Body</div>
                  <pre className="text-sm text-gray-70 whitespace-pre-wrap font-sans bg-gray-10 p-2 rounded">{e.body}</pre>
                </div>
                {e.error && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded p-2">
                    {e.error}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3 items-center">
                  <input
                    type="email"
                    placeholder={e.toEmail || "recipient@example.com"}
                    value={toInputs[e.id] ?? e.toEmail ?? ""}
                    onChange={(ev) => setToInputs((s) => ({ ...s, [e.id]: ev.target.value }))}
                    className="text-sm border border-gray-300 rounded px-2 py-1 w-64"
                    disabled={e.status === "sent"}
                  />
                  <Button onClick={() => setStatus(e.id, "approved")} disabled={updating === e.id || e.status === "sent"}>
                    Approve &amp; send
                  </Button>
                  <Button onClick={() => setStatus(e.id, "sent")} disabled={updating === e.id}>Mark sent</Button>
                  <Button onClick={() => setStatus(e.id, "skipped")} disabled={updating === e.id}>Skip</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
