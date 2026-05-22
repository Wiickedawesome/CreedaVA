/**
 * Web Search Cloud Function — gives AI access to real-time internet data.
 *
 * Uses the Brave Search API (Google Custom Search was deprecated for our org
 * in May 2026) to fetch live market data, competitor intel, and industry
 * trends that the AI can incorporate into its analysis.
 *
 * Endpoints:
 *  - webSearch(query) — general web search
 *  - competitorSearch(competitor) — search for competitor news/updates
 *  - industryTrends() — search for VA industry trends
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, getIntegrationConfig, verifyAdminEmail } from "./admin";
import { braveSearch } from "./brave-search";

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

// ─── Brave Search ────────────────────────────────────

async function runSearch(
  query: string,
  numResults = 5,
): Promise<SearchResult[]> {
  const config = await getIntegrationConfig("web-search");
  const apiKey = config?.config?.apiKey || process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    console.warn("[Web Search] Brave Search not configured — returning empty results");
    return [];
  }

  try {
    const hits = await braveSearch(apiKey, query, numResults);
    return hits.map(({ title, link, snippet }) => ({ title, link, snippet }));
  } catch (err) {
    console.error("[Web Search] Brave Search failed:", err);
    return [];
  }
}

// ─── Web Search Function ─────────────────────────────

export const webSearch = onCall<
  { query: string; numResults?: number },
  Promise<WebSearchResponse>
>(
  { region: "us-east4" },
  async (request) => {
    verifyAdminEmail(request.auth?.token?.email);

    const { query, numResults = 5 } = request.data;
    if (!query || typeof query !== "string") {
      throw new HttpsError("invalid-argument", "Query string is required");
    }

    const results = await runSearch(query, numResults);

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
    verifyAdminEmail(request.auth?.token?.email);

    const targetCompetitors = request.data.competitor
      ? [request.data.competitor]
      : ["Belay Solutions", "Time Etc VA", "Boldly VA", "Wishup", "MyOutDesk"];

    const competitorResults: Record<string, SearchResult[]> = {};

    // Brave's rate limiter serializes these internally.
    const searches = targetCompetitors.map(async (name) => {
      const results = await runSearch(
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
    verifyAdminEmail(request.auth?.token?.email);

    const [trends, keywords] = await Promise.all([
      runSearch("virtual assistant services industry trends 2026", 5),
      runSearch("hire virtual assistant trending topics demand growth", 5),
    ]);

    return { success: true, trends, keywords };
  },
);
