/**
 * Web search wrapper with quota tracking.
 *
 * Every call must go through `searchWithQuota(ctx, query)` so the orchestrator
 * can enforce per-skill caps and write a resume cursor when the cap hits.
 *
 * Backed by the Brave Search API (Google Custom Search was deprecated for our
 * org in May 2026). The result shape is preserved so SEO skills are unchanged.
 */

import { getIntegrationConfig } from "../admin";
import { braveSearch } from "../brave-search";
import type { SkillContext } from "./types";

export interface SearchHit {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

let cachedKey: { apiKey?: string } | null = null;

async function getCreds(): Promise<{ apiKey?: string }> {
  if (cachedKey) return cachedKey;
  const cfg = await getIntegrationConfig("web-search");
  cachedKey = {
    apiKey: cfg?.config?.apiKey || process.env.BRAVE_SEARCH_API_KEY,
  };
  return cachedKey;
}

/**
 * Run a web search query, charging 1 to the skill's quota.
 * Returns null if quota was exhausted (caller should write cursor + bail).
 */
export async function searchWithQuota(
  ctx: SkillContext,
  query: string,
  numResults = 10,
): Promise<SearchHit[] | null> {
  if (!ctx.consumeQuery()) {
    return null;
  }
  const { apiKey } = await getCreds();
  if (!apiKey) {
    console.warn("[seo-agent] Brave Search not configured — skipping query:", query);
    return [];
  }

  try {
    return await braveSearch(apiKey, query, numResults);
  } catch (err) {
    console.warn("[seo-agent] Brave Search failed:", err);
    return [];
  }
}
