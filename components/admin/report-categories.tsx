"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui";
import type { AIReport, AIInsight } from "@/lib/types/content";

// ─── Report Category Card ────────────────────────────
// Used on the "On-Demand" tab to show analysis categories

interface ReportCategoryCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  lastRun?: AIReport | null;
  onGenerate: () => void;
  generating?: boolean;
}

export function ReportCategoryCard({
  icon,
  title,
  description,
  lastRun,
  onGenerate,
  generating,
}: ReportCategoryCardProps) {
  const lastDate = lastRun?.createdAt
    ? new Date(
        typeof lastRun.createdAt === "object" && "toDate" in lastRun.createdAt
          ? (lastRun.createdAt as unknown as { toDate: () => Date }).toDate()
          : (lastRun.createdAt as unknown as string),
      ).toLocaleDateString()
    : null;

  return (
    <div className="group rounded-xl border border-border bg-white p-5 hover:border-primary/20 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-90">{title}</h4>
          <p className="text-xs text-gray-50 mt-0.5 leading-relaxed">{description}</p>
          {lastDate && (
            <p className="text-[10px] text-gray-40 mt-1.5">Last run: {lastDate}</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={onGenerate}
          isLoading={generating}
          className="text-xs"
        >
          {generating ? "Analyzing..." : "Run Analysis"}
        </Button>
      </div>
    </div>
  );
}

// ─── Scheduled Report Card ───────────────────────────
// Shows freshness status for daily/weekly/monthly

interface ScheduledReportCardProps {
  period: "daily" | "weekly" | "monthly";
  lastReport: AIReport | null;
  isStale: boolean;
  isGenerating: boolean;
  onRegenerate: () => void;
  onView: (report: AIReport) => void;
}

const periodLabels: Record<string, string> = {
  daily: "Daily Scan",
  weekly: "Weekly Report",
  monthly: "Monthly Review",
};

const periodDescriptions: Record<string, string> = {
  daily: "Quick scan of today&apos;s activity — new leads, tasks, bookings",
  weekly: "Weekly trends, conversions, pipeline velocity, content",
  monthly: "Comprehensive monthly review — growth, strategy, forecasts",
};

export function ScheduledReportCard({
  period,
  lastReport,
  isStale,
  isGenerating,
  onRegenerate,
  onView,
}: ScheduledReportCardProps) {
  const lastDate = lastReport?.createdAt
    ? new Date(
        typeof lastReport.createdAt === "object" && "toDate" in lastReport.createdAt
          ? (lastReport.createdAt as unknown as { toDate: () => Date }).toDate()
          : (lastReport.createdAt as unknown as string),
      )
    : null;

  const freshness = !lastDate
    ? { label: "Never run", color: "text-gray-40 bg-gray-10" }
    : isStale
      ? { label: "Stale", color: "text-amber-600 bg-amber-50" }
      : { label: "Fresh", color: "text-emerald-600 bg-emerald-50" };

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-90">{periodLabels[period]}</h4>
          <p className="text-xs text-gray-50 mt-0.5">{periodDescriptions[period]}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${freshness.color}`}
        >
          {freshness.label}
        </span>
      </div>

      {lastReport?.score !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-50">Health Score</span>
            <span className="font-semibold text-gray-90">{lastReport.score}/100</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                lastReport.score >= 70
                  ? "bg-emerald-500"
                  : lastReport.score >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${lastReport.score}%` }}
            />
          </div>
        </div>
      )}

      {lastDate && (
        <p className="text-[10px] text-gray-40 mb-3">
          Generated: {lastDate.toLocaleString()}
        </p>
      )}

      <div className="flex items-center gap-2">
        {lastReport && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(lastReport)}
            className="text-xs flex-1"
          >
            View Report
          </Button>
        )}
        <Button
          size="sm"
          onClick={onRegenerate}
          isLoading={isGenerating}
          className="text-xs flex-1"
        >
          {isGenerating ? "Generating..." : isStale ? "Generate Now" : "Regenerate"}
        </Button>
      </div>
    </div>
  );
}

// ─── Insight Card ────────────────────────────────────

interface InsightCardProps {
  insight: AIInsight;
  onPin?: () => void;
  onDismiss?: () => void;
}

const severityStyles: Record<string, { bg: string; icon: string; border: string }> = {
  positive: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
  info: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200" },
  warning: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-200" },
  critical: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-200" },
};

const severityIcons: Record<string, ReactNode> = {
  positive: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  critical: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

export function InsightCard({ insight, onPin, onDismiss }: InsightCardProps) {
  const style = severityStyles[insight.severity] || severityStyles.info;

  return (
    <div
      className={`rounded-lg border p-4 ${style.border} ${style.bg} ${
        insight.dismissed ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${style.icon}`}>{severityIcons[insight.severity]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium text-gray-90">{insight.title}</h5>
            <span className="text-[10px] text-gray-40 capitalize rounded-full bg-white/60 px-2 py-0.5">
              {insight.area}
            </span>
            {insight.pinned && (
              <svg className="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M16 2l4.585 4.586-3.172 3.171 2.829 2.829-1.414 1.414-2.829-2.829-4.242 4.243V21l-7.07-7.071h5.586L14.514 9.686l-2.828-2.828 1.414-1.414 2.828 2.828z" />
              </svg>
            )}
          </div>
          <p className="text-xs text-gray-60 mt-1 leading-relaxed">{insight.description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onPin && (
            <button
              onClick={onPin}
              className="p-1 rounded hover:bg-white/60 text-gray-40 hover:text-primary transition-colors cursor-pointer"
              title={insight.pinned ? "Unpin" : "Pin"}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z" />
              </svg>
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded hover:bg-white/60 text-gray-40 hover:text-gray-70 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Business Pulse / Health Score ────────────────────

interface BusinessPulseProps {
  score: number | null;
  areas: { label: string; value: number }[];
}

export function BusinessPulse({ score, areas }: BusinessPulseProps) {
  const displayScore = score ?? 0;
  const grade =
    displayScore >= 90
      ? "A+"
      : displayScore >= 80
        ? "A"
        : displayScore >= 70
          ? "B"
          : displayScore >= 60
            ? "C"
            : displayScore >= 50
              ? "D"
              : "F";

  const color =
    displayScore >= 70
      ? "text-emerald-600"
      : displayScore >= 40
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-90 mb-4">Business Pulse</h3>

      {score === null ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-40">Generate your first report to see health metrics</p>
        </div>
      ) : (
        <>
          {/* Score circle */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative flex items-center justify-center">
              <svg className="w-28 h-28" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={displayScore >= 70 ? "#10b981" : displayScore >= 40 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(displayScore / 100) * 264} 264`}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${color}`}>{displayScore}</span>
                <span className="text-xs text-gray-40">/ 100</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            <span className={`text-lg font-bold ${color}`}>Grade: {grade}</span>
          </div>

          {/* Area breakdown */}
          {areas.length > 0 && (
            <div className="space-y-2.5">
              {areas.map((area) => (
                <div key={area.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-60">{area.label}</span>
                    <span className="font-medium text-gray-80">{area.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        area.value >= 70 ? "bg-emerald-400" : area.value >= 40 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ width: `${area.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
