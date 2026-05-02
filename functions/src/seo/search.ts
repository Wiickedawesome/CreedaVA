/**
 * Custom Search wrapper with quota tracking.
 *
 * Every call must go through `searchWithQuota(ctx, query)` so the orchestrator
 * can enforce per-skill caps and write a resume cursor when the cap hits.
 */

import { getIntegrationConfig } from "../admin";
import type { SkillContext } from "./types";

export interface SearchHit {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

let cachedKey: { apiKey?: string; cx?: string } | null = null;

async function getCreds(): Promise<{ apiKey?: string; cx?: string }> {
  if (cachedKey) return cachedKey;
  const cfg = await getIntegrationConfig("web-search");
  cachedKey = {
    apiKey: cfg?.config?.apiKey || process.env.GOOGLE_SEARCH_API_KEY,
    cx: cfg?.config?.searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID,
  };
  return cachedKey;
}

/**
 * Run a Custom Search query, charging 1 to the skill's quota.
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
  const { apiKey, cx } = await getCreds();
  if (!apiKey || !cx) {
    console.warn("[seo-agent] Custom Search not configured — skipping query:", query);
    return [];
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(Math.min(Math.max(numResults, 1), 10)));

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const body = await response.text();
      console.error("[seo-agent] Custom Search error:", response.status, body.slice(0, 200));
      return [];
    }
    const data = (await response.json()) as {
      items?: { title: string; link: string; snippet: string; displayLink?: string }[];
    };
    return (data.items ?? []).map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      displayLink: item.displayLink,
    }));
  } catch (err) {
    console.warn("[seo-agent] Custom Search fetch failed:", err);
    return [];
  }
}
