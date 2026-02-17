/**
 * Web Search Cloud Function — gives AI access to real-time internet data.
 *
 * Uses Google Custom Search API to fetch live market data, competitor
 * intel, and industry trends that the AI can incorporate into its analysis.
 *
 * Endpoints:
 *  - webSearch(query) — general web search
 *  - competitorSearch(competitor) — search for competitor news/updates
 *  - industryTrends() — search for VA industry trends
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, getIntegrationConfig } from "./admin";

// ─── Types ───────────────────────────────────────────

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface WebSearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  summary: string;
  searchedAt: string;
}

// ─── Google Custom Search ────────────────────────────

async function googleSearch(
  query: string,
  numResults = 5,
): Promise<SearchResult[]> {
  const config = await getIntegrationConfig("web-search");
  const apiKey = config?.config?.apiKey || process.env.GOOGLE_SEARCH_API_KEY;
  const cx = config?.config?.searchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    // Fallback: return empty results if search not configured
    console.warn("[Web Search] Google Custom Search not configured — returning mock results");
    return [];
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(Math.min(numResults, 10)));

  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error("[Web Search] API error:", response.status, await response.text());
    return [];
  }

  const data = await response.json();
  return (data.items || []).map((item: { title: string; link: string; snippet: string }) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
  }));
}

// ─── Web Search Function ─────────────────────────────

export const webSearch = onCall<
  { query: string; numResults?: number },
  Promise<WebSearchResponse>
>(
  { region: "us-east4" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const { query, numResults = 5 } = request.data;
    if (!query || typeof query !== "string") {
      throw new HttpsError("invalid-argument", "Query string is required");
    }

    const results = await googleSearch(query, numResults);

    const summary = results.length > 0
      ? results.map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`).join("\n")
      : "No results found for this query.";

    const response: WebSearchResponse = {
      success: true,
      query,
      results,
      summary,
      searchedAt: new Date().toISOString(),
    };

    // Cache search results in Firestore for AI context
    try {
      await db.collection("ai-search-cache").add({
        ...response,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h cache
      });
    } catch (err) {
      console.warn("[Web Search] Failed to cache results:", err);
    }

    return response;
  },
);

// ─── Competitor Intelligence Search ──────────────────

export const competitorSearch = onCall<
  { competitor?: string },
  Promise<{ success: boolean; competitors: Record<string, SearchResult[]> }>
>(
  { region: "us-east4" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const targetCompetitors = request.data.competitor
      ? [request.data.competitor]
      : ["Belay Solutions", "Time Etc VA", "Boldly VA", "Wishup", "MyOutDesk"];

    const competitorResults: Record<string, SearchResult[]> = {};

    // Search for each competitor in parallel
    const searches = targetCompetitors.map(async (name) => {
      const results = await googleSearch(
        `"${name}" virtual assistant services news updates 2025 2026`,
        3,
      );
      competitorResults[name] = results;
    });

    await Promise.all(searches);

    return { success: true, competitors: competitorResults };
  },
);

// ─── Industry Trends Search ──────────────────────────

export const industryTrends = onCall<
  void,
  Promise<{ success: boolean; trends: SearchResult[]; keywords: SearchResult[] }>
>(
  { region: "us-east4" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    const [trends, keywords] = await Promise.all([
      googleSearch("virtual assistant services industry trends 2026", 5),
      googleSearch("hire virtual assistant trending topics demand growth", 5),
    ]);

    return { success: true, trends, keywords };
  },
);
