"use client";

import { useState, useCallback } from "react";
import { useCollection } from "@/hooks/useCollection";
import type { AIReport, AIReportType } from "@/lib/types/content";
import type { AllCollections } from "@/lib/utils/ai-data-context";
import { buildPeriodContext } from "@/lib/utils/ai-data-context";
import { lazyGenerateText } from "@/lib/firebase/ai-lazy";

// ─── Types ───────────────────────────────────────────

type SchedulePeriod = "daily" | "weekly" | "monthly";

interface ScheduleStatus {
  period: SchedulePeriod;
  lastReport: AIReport | null;
  isStale: boolean;
  isGenerating: boolean;
}

interface UseScheduledReportsReturn {
  schedules: ScheduleStatus[];
  isGenerating: boolean;
  generateReport: (period: SchedulePeriod, allData: AllCollections) => Promise<void>;
  autoGenerate: (allData: AllCollections) => Promise<void>;
}

// ─── Staleness thresholds (ms) ───────────────────────

const STALENESS: Record<SchedulePeriod, number> = {
  daily: 20 * 60 * 60 * 1000,    // 20 hours (generous margin)
  weekly: 6 * 24 * 60 * 60 * 1000,  // 6 days
  monthly: 28 * 24 * 60 * 60 * 1000, // 28 days
};

const DEBOUNCE_KEY = "creedava_schedule_check";
const DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes between checks

// ─── Report prompt templates ─────────────────────────

function getPromptForPeriod(period: SchedulePeriod, context: string): string {
  const instructions = `You are a senior business analyst for CreedaVA (virtual assistant services company).
Analyze the provided business data and generate a ${period} performance report.

RESPOND WITH VALID JSON ONLY — no markdown fences, no extra text.

JSON shape:
{
  "title": "string — report title with date range",
  "summaryHtml": "string — HTML executive summary (2-3 paragraphs)",
  "highlights": ["string array — 3-5 key data points or achievements"],
  "recommendations": ["string array — 3-5 actionable recommendations"],
  "score": number (0-100 overall business health score)
}

${period === "daily" ? "Focus on: today's activity, urgent tasks, new leads, upcoming bookings." : ""}
${period === "weekly" ? "Focus on: weekly trends, pipeline movement, conversion rates, task completion velocity, content output." : ""}
${period === "monthly" ? "Focus on: monthly growth, revenue trends, customer acquisition cost, churn risk, strategic recommendations for next month." : ""}

Use actual numbers from the data. Be specific and actionable.

${context}`;

  return instructions;
}

// ─── Hook ────────────────────────────────────────────

export function useScheduledReports(): UseScheduledReportsReturn {
  const { data: reports, add } = useCollection<AIReport>("reports", {
    orderByField: "createdAt",
  });

  const [generatingMap, setGeneratingMap] = useState<Record<SchedulePeriod, boolean>>({
    daily: false,
    weekly: false,
    monthly: false,
  });

  // ─── Find latest report per period ─────────────────
  const getLatestReport = useCallback(
    (period: SchedulePeriod): AIReport | null => {
      const matching = reports
        .filter((r) => r.type === period)
        .sort((a, b) => {
          const dateA = a.createdAt
            ? typeof a.createdAt === "object" && "toDate" in a.createdAt
              ? (a.createdAt as unknown as { toDate: () => Date }).toDate()
              : new Date(a.createdAt as unknown as string)
            : new Date(0);
          const dateB = b.createdAt
            ? typeof b.createdAt === "object" && "toDate" in b.createdAt
              ? (b.createdAt as unknown as { toDate: () => Date }).toDate()
              : new Date(b.createdAt as unknown as string)
            : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
      return matching[0] || null;
    },
    [reports],
  );

  // ─── Check staleness ──────────────────────────────
  const isStale = useCallback(
    (period: SchedulePeriod): boolean => {
      const latest = getLatestReport(period);
      if (!latest) return true;
      const created = latest.createdAt
        ? typeof latest.createdAt === "object" && "toDate" in latest.createdAt
          ? (latest.createdAt as unknown as { toDate: () => Date }).toDate()
          : new Date(latest.createdAt as unknown as string)
        : new Date(0);
      return Date.now() - created.getTime() > STALENESS[period];
    },
    [getLatestReport],
  );

  // ─── Build schedule statuses ───────────────────────
  const schedules: ScheduleStatus[] = (["daily", "weekly", "monthly"] as const).map(
    (period) => ({
      period,
      lastReport: getLatestReport(period),
      isStale: isStale(period),
      isGenerating: generatingMap[period],
    }),
  );

  // ─── Generate a report ────────────────────────────
  const generateReport = useCallback(
    async (period: SchedulePeriod, allData: AllCollections) => {
      if (generatingMap[period]) return;

      setGeneratingMap((prev) => ({ ...prev, [period]: true }));
      try {
        const context = buildPeriodContext(allData, period);
        const prompt = getPromptForPeriod(period, context);
        const raw = await lazyGenerateText(prompt);

        // Parse JSON response
        let parsed: {
          title?: string;
          summaryHtml?: string;
          summary?: string;
          highlights?: string[];
          recommendations?: string[];
          score?: number;
        };
        try {
          // Strip markdown fences if present
          const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = {
            title: `${period.charAt(0).toUpperCase() + period.slice(1)} Report`,
            summaryHtml: raw,
            highlights: [],
            recommendations: [],
          };
        }

        await add({
          title: parsed.title || `${period.charAt(0).toUpperCase() + period.slice(1)} Report — ${new Date().toLocaleDateString()}`,
          type: period as AIReportType,
          category: "scheduled",
          summaryHtml: parsed.summaryHtml || parsed.summary || raw,
          highlights: parsed.highlights || [],
          recommendations: parsed.recommendations || [],
          score: parsed.score,
          dataSources: Object.keys(allData).filter(
            (k) => (allData[k as keyof AllCollections] as unknown[])?.length > 0,
          ),
          area: "general",
        });
      } catch (err) {
        console.error(`Failed to generate ${period} report:`, err);
      } finally {
        setGeneratingMap((prev) => ({ ...prev, [period]: false }));
      }
    },
    [add, generatingMap],
  );

  // ─── Auto-generate stale reports on mount ──────────
  const autoGenerate = useCallback(
    async (allData: AllCollections) => {
      // Debounce via localStorage
      const lastCheck = localStorage.getItem(DEBOUNCE_KEY);
      if (lastCheck && Date.now() - Number(lastCheck) < DEBOUNCE_MS) return;
      localStorage.setItem(DEBOUNCE_KEY, String(Date.now()));

      // Generate stale reports in order of importance
      for (const period of ["daily", "weekly", "monthly"] as const) {
        if (isStale(period)) {
          await generateReport(period, allData);
        }
      }
    },
    [isStale, generateReport],
  );

  const isGenerating = Object.values(generatingMap).some(Boolean);

  return { schedules, isGenerating, generateReport, autoGenerate };
}
