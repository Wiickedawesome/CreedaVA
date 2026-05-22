/**
 * Brave Search API client.
 *
 * Replaces the deprecated Google Custom Search JSON API. Returns a hit shape
 * that matches what the legacy Google code returned so call sites stay simple.
 *
 * Rate limiting: the free tier is 1 query/second. We serialize calls with a
 * module-level promise chain that enforces a minimum gap between requests.
 */

const BRAVE_ENDPOINT = "https://api.search.brave.com/res/v1/web/search";
const MIN_GAP_MS = 1100; // free tier = 1 qps; pad slightly

export interface BraveHit {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

interface BraveResponse {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
      meta_url?: { hostname?: string };
    }>;
  };
}

let lastStart = 0;
let chain: Promise<void> = Promise.resolve();

function reserveSlot(): Promise<void> {
  const next = chain.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, lastStart + MIN_GAP_MS - now);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastStart = Date.now();
  });
  chain = next.catch(() => undefined);
  return next;
}

/**
 * Run a single Brave web search. Throws on non-2xx so callers can decide
 * whether to swallow or surface the error.
 */
export async function braveSearch(
  apiKey: string,
  query: string,
  count = 10,
): Promise<BraveHit[]> {
  await reserveSlot();

  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(Math.max(count, 1), 20)));

  const response = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brave Search ${response.status}: ${body.slice(0, 200)}`);
  }
  const data = (await response.json()) as BraveResponse;
  return (data.web?.results ?? []).map((item) => ({
    title: item.title ?? "",
    link: item.url ?? "",
    snippet: item.description ?? "",
    displayLink: item.meta_url?.hostname,
  }));
}
