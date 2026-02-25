/**
 * AI Insights — Content Performance Tracking
 *
 * Activates the `ai-insights` Firestore collection as a lightweight
 * feedback loop for NOVA (and other specialists) to learn which topics
 * and content formats are performing well or poorly.
 *
 * Flow:
 *   1. When blog content is published, call `recordContentPerformance()`
 *   2. NOVA's page context includes recent insights via `getContentInsightsForSpecialist()`
 *   3. NOVA uses this to recommend content directions with real performance backing
 *
 * Collection: `ai-insights`
 * Access: admin only (see firestore.rules)
 */

import { create, fetchAll } from "@/lib/firebase/firestore";
import { where, orderBy, limit } from "firebase/firestore";

// ─── Types ────────────────────────────────────────────

export interface ContentPerformanceData {
  /** The blog post title */
  title: string;
  /** The primary topic or category of the content */
  topic: string;
  /** Tags/categories associated with the content */
  tags?: string[];
  /** Search Console impressions (optional) */
  impressions?: number;
  /** Search Console clicks (optional) */
  clicks?: number;
  /** Average position in search results (optional) */
  avgPosition?: number;
  /** Whether this post is considered a top performer */
  isTopPerformer?: boolean;
  /** Free-form performance note (e.g. "High engagement, shared 3x on LinkedIn") */
  performanceNote?: string;
}

export interface AIInsight {
  /** Firestore document ID */
  id?: string;
  /** The blog post Firestore ID this insight relates to */
  postId: string;
  /** Specialist codename that generated or tracks this content (e.g. "NOVA") */
  specialistId: string;
  /** Content title for display */
  title: string;
  /** Primary topic */
  topic: string;
  /** Content tags */
  tags: string[];
  /** Search Console impressions */
  impressions: number;
  /** Search Console clicks */
  clicks: number;
  /** Average SERP position */
  avgPosition: number;
  /** Whether this is a top performer */
  isTopPerformer: boolean;
  /** Human-readable performance note */
  performanceNote: string;
  /** ISO timestamp */
  recordedAt: string;
  /** Auto-added by Firestore wrapper */
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ─── Write ────────────────────────────────────────────

/**
 * Records content performance data for a published blog post.
 * Call this after publishing or when Search Console data is available.
 *
 * @param postId   - Firestore document ID of the blog post
 * @param data     - Performance metrics and metadata
 * @param specialistId - Specialist responsible (default: "NOVA")
 * @returns The new insight document ID
 */
export async function recordContentPerformance(
  postId: string,
  data: ContentPerformanceData,
  specialistId = "NOVA",
): Promise<string> {
  const insight: Omit<AIInsight, "id" | "createdAt" | "updatedAt"> = {
    postId,
    specialistId,
    title: data.title,
    topic: data.topic,
    tags: data.tags ?? [],
    impressions: data.impressions ?? 0,
    clicks: data.clicks ?? 0,
    avgPosition: data.avgPosition ?? 0,
    isTopPerformer: data.isTopPerformer ?? false,
    performanceNote: data.performanceNote ?? "",
    recordedAt: new Date().toISOString(),
  };
  return create<typeof insight>("ai-insights", insight);
}

// ─── Read ─────────────────────────────────────────────

/**
 * Fetches recent content insights for a specialist and formats them
 * as a prompt-ready context string.
 *
 * @param specialistId - Filter by specialist codename (e.g. "NOVA")
 * @param maxItems     - Max insights to include (default: 10)
 * @returns Formatted context string or empty string if no data
 */
export async function getContentInsightsForSpecialist(
  specialistId = "NOVA",
  maxItems = 10,
): Promise<string> {
  try {
    const insights = await fetchAll<AIInsight>(
      "ai-insights",
      where("specialistId", "==", specialistId),
      orderBy("recordedAt", "desc"),
      limit(maxItems),
    );

    if (insights.length === 0) return "";

    const topPerformers = insights.filter((i) => i.isTopPerformer);
    const lines: string[] = [
      `--- CONTENT PERFORMANCE INSIGHTS (${insights.length} tracked) ---`,
    ];

    if (topPerformers.length > 0) {
      lines.push(
        `Top performers: ${topPerformers.map((i) => `"${i.title}" (${i.clicks} clicks, pos ${i.avgPosition.toFixed(1)})`).join(", ")}`,
      );
    }

    const recent = insights.slice(0, 5);
    lines.push("Recent tracked content:");
    for (const item of recent) {
      const metrics =
        item.impressions > 0
          ? ` — ${item.impressions} impressions, ${item.clicks} clicks, pos ${item.avgPosition.toFixed(1)}`
          : "";
      const note = item.performanceNote ? ` · ${item.performanceNote}` : "";
      lines.push(`  - "${item.title}" [${item.topic}]${metrics}${note}`);
    }

    const allTags = [...new Set(insights.flatMap((i) => i.tags))];
    if (allTags.length > 0) {
      lines.push(`High-performing topics/tags: ${allTags.slice(0, 12).join(", ")}`);
    }

    return lines.join("\n");
  } catch {
    return "";
  }
}
