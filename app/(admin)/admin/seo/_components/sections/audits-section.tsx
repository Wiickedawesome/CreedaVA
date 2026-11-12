"use client";

import { useState } from "react";
import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";
import { useCollection } from "@/hooks/useCollection";
import {
  DataTable,
  StatusBadge,
  Modal,
  DashboardSection,
  StatCard,
  useToast,
  AIPromptButton,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import { Button } from "@/components/ui";
import type { SEOAudit } from "@/lib/types/content";
import { OnPageAuditsList } from "../onpage-audits";
import { parseAiJson } from "@/lib/utils/ai-json";

const severityVariant: Record<string, "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
};

/** Shape returned by the SEO audit prompt (fields are all optional). */
interface AiAudit {
  url?: string;
  score?: number;
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedH1?: string;
  missingElements?: string[];
  issues?: { issue?: string; severity?: string; fix?: string; suggestion?: string }[];
}

/** Normalise an AI audit into the stored shape the UI renders. */
function toAuditInput(
  result: AiAudit,
): Omit<SEOAudit, "id" | "createdAt" | "updatedAt"> {
  return {
    url: result.url || "AI Analysis",
    score: result.score ?? 0,
    suggestedTitle: result.suggestedTitle ?? "",
    suggestedDescription: result.suggestedDescription ?? "",
    suggestedH1: result.suggestedH1 ?? "",
    missingElements: result.missingElements ?? [],
    issues: (result.issues ?? []).map((issue) => ({
      issue: issue.issue ?? "",
      severity:
        issue.severity === "high" || issue.severity === "low" ? issue.severity : "medium",
      // Older prompts returned `suggestion`; the UI reads `fix`.
      fix: issue.fix || issue.suggestion || "",
    })),
  };
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-error";
}

/**
 * Audit findings.
 *
 * Two sources, deliberately separated because they measure different things:
 *
 *  1. The agent's crawler (`onpage-audits`) — real HTTP fetches of every
 *     sitemap URL, scored from the actual HTML. This is the authoritative list
 *     and it is what the weekly synthesizer reads.
 *  2. One-off AI reviews (`seo`) — a model's opinion prompted from the button
 *     below. Not crawled, not comparable to a crawler score.
 */
export function AuditsSection() {
  const { data: audits, add: addAudit, del: delAudit } = useCollection<SEOAudit>(
    "seo",
    { orderByField: "createdAt" },
  );
  const { toast } = useToast();

  const [selected, setSelected] = useState<SEOAudit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openAuditDetail(audit: SEOAudit) {
    setSelected(audit);
    setDetailOpen(true);
  }

  async function handleDeleteAudit() {
    if (!selected) return;
    setDeleting(true);
    try {
      await delAudit(selected.id);
      toast("Audit deleted");
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<SEOAudit>[] = [
    {
      key: "url",
      header: "URL",
      render: (a) => <span className="font-medium text-gray-90 truncate max-w-xs block">{a.url}</span>,
    },
    {
      key: "score",
      header: "Score",
      render: (a) => <span className={`font-bold ${scoreColor(a.score)}`}>{a.score}/100</span>,
    },
    {
      key: "issues",
      header: "Issues",
      render: (a) => {
        const high = a.issues?.filter((i) => i.severity === "high").length || 0;
        const med = a.issues?.filter((i) => i.severity === "medium").length || 0;
        return (
          <div className="flex gap-2">
            {high > 0 && <StatusBadge status={`${high} high`} variant="error" />}
            {med > 0 && <StatusBadge status={`${med} med`} variant="warning" />}
            {high === 0 && med === 0 && <StatusBadge status="All good" variant="success" />}
          </div>
        );
      },
    },
    {
      key: "suggestedTitle",
      header: "Suggested Title",
      render: (a) => <span className="text-sm text-gray-70 truncate max-w-xs block">{a.suggestedTitle}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Crawler findings (authoritative) ──────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-90">Crawler findings</h3>
          <p className="text-xs text-gray-50 mt-0.5">
            Produced by the <strong>On-page audit</strong> skill above — real HTTP fetches of
            every sitemap URL, scored from the live HTML.
          </p>
        </div>
      </div>

      <OnPageAuditsList />

      {/* ─── One-off AI reviews ────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
        <div>
          <h3 className="text-sm font-semibold text-gray-90">One-off AI reviews</h3>
          <p className="text-xs text-gray-50 mt-0.5">
            A model&apos;s opinion of a URL or topic, prompted manually. Not crawled — scores
            are not comparable to the crawler figures above.
          </p>
        </div>
        <AIPromptButton
          section="SEO AI"
          description="Analyze a URL or topic for SEO improvements. Get a score, issues, and actionable recommendations."
          placeholder="Enter a URL or topic to analyze... e.g. https://creedava.com/services"
          presets={[
            { label: "Homepage Audit", prompt: "Analyze the SEO of https://creedava.com/ and suggest improvements" },
            { label: "Services Page", prompt: "Analyze SEO for a virtual assistant services page" },
            { label: "Content Gap", prompt: "What content topics should CreedaVA cover to improve organic search rankings?" },
            { label: "Meta Tag Review", prompt: "Review and optimize meta titles and descriptions for the top 5 pages. Provide improved versions with character counts." },
            { label: "Internal Linking", prompt: "Suggest an internal linking strategy to improve page authority distribution. Identify orphan pages and recommend link placements." },
            { label: "Schema Markup", prompt: "Recommend structured data / schema markup improvements for CreedaVA's website. Cover FAQ, Service, Organization, and BreadcrumbList schemas." },
            { label: "Page Speed Tips", prompt: "Identify common page speed issues for service websites and suggest 5 specific optimizations to improve Core Web Vitals scores." },
            { label: "Local SEO", prompt: "Provide a local SEO strategy for a virtual assistant services company. Cover Google Business Profile, local keywords, citations, and reviews." },
          ]}
          onResult={(raw) => {
            try {
              addAudit(toAuditInput(parseAiJson<AiAudit>(raw)));
              toast("SEO audit complete!", "success");
            } catch {
              toast("AI returned an unreadable response — try again", "error");
            }
          }}
          buildPrompt={(input) =>
            buildTrainedPrompt("SEO Audit", `Analyze this URL/topic: "${input}"\n\nReturn ONLY valid JSON with:\n- url: the analyzed URL or topic\n- score: numeric SEO score 0-100\n- suggestedTitle: improved page title\n- suggestedDescription: improved meta description\n- issues: array of { issue: string, severity: "low"|"medium"|"high", fix: string }\n- recommendations: array of strings with specific improvements\n\nNo markdown fences.`, "", { includeCompetitors: true, includeKPIs: true })
          }
        />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="AI reviews" value={audits.length.toString()} badge="total" />
        <StatCard
          label="Avg Score"
          value={
            audits.length > 0
              ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length).toString()
              : "N/A"
          }
          badge="out of 100"
        />
        <StatCard
          label="High Issues"
          value={audits
            .reduce((s, a) => s + (a.issues?.filter((i) => i.severity === "high").length || 0), 0)
            .toString()}
          badge="critical"
        />
        <StatCard
          label="Score 80+"
          value={audits.filter((a) => a.score >= 80).length.toString()}
          badge={`${audits.length > 0 ? Math.round((audits.filter((a) => a.score >= 80).length / audits.length) * 100) : 0}% passing`}
        />
      </div>

      <DataTable
        columns={columns}
        data={audits}
        keyExtractor={(a) => a.id}
        onRowClick={(a) => openAuditDetail(a)}
        emptyMessage="No AI reviews yet — use the button above to run one"
      />

      {/* ─── Detail modal ─────────────────────────── */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="SEO Audit Report"
        size="lg"
        footer={
          <>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${scoreColor(selected.score)}`}>{selected.score}</div>
              <div>
                <p className="text-sm font-medium text-gray-90">{selected.url}</p>
                <p className="text-xs text-gray-50">SEO Score out of 100</p>
              </div>
            </div>
            <DashboardSection title="Recommended Changes">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-50">Title Tag:</span>
                  <p className="font-medium text-gray-90">{selected.suggestedTitle}</p>
                </div>
                <div>
                  <span className="text-gray-50">Meta Description:</span>
                  <p className="font-medium text-gray-90">{selected.suggestedDescription}</p>
                </div>
                <div>
                  <span className="text-gray-50">H1 Heading:</span>
                  <p className="font-medium text-gray-90">{selected.suggestedH1}</p>
                </div>
              </div>
            </DashboardSection>
            {selected.issues?.length > 0 && (
              <DashboardSection title="Issues Found">
                <div className="divide-y divide-border">
                  {selected.issues.map((issue, i) => (
                    <div key={i} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={issue.severity} variant={severityVariant[issue.severity]} />
                        <span className="text-sm font-medium text-gray-90">{issue.issue}</span>
                      </div>
                      {issue.fix && <p className="text-xs text-gray-60">{issue.fix}</p>}
                    </div>
                  ))}
                </div>
              </DashboardSection>
            )}
            {selected.missingElements?.length > 0 && (
              <DashboardSection title="Missing Elements">
                <ul className="text-sm text-gray-70 list-disc pl-5 space-y-1">
                  {selected.missingElements.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </DashboardSection>
            )}
          </div>
        )}
      </Modal>

      {/* ─── Delete confirmation ──────────────────── */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete audit?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteAudit} isLoading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-70">
          This permanently deletes the AI review for{" "}
          <strong className="text-gray-90">{selected?.url}</strong>. Crawler findings are not
          affected.
        </p>
      </Modal>
    </div>
  );
}
