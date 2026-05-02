/**
 * Helpers for the agent's site map.
 * Reads /sitemap.xml so the agent stays in lock-step with what Google sees.
 */

const DEFAULT_SITE = "https://creedava.com";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
}

/** Fetch and parse <urlset><url><loc>…</loc></url></urlset>. */
export async function loadSitemap(siteUrl?: string): Promise<SitemapEntry[]> {
  const base = (siteUrl || DEFAULT_SITE).replace(/\/$/, "");
  try {
    const response = await fetch(`${base}/sitemap.xml`);
    if (!response.ok) {
      console.warn(`[seo-agent] sitemap fetch failed: ${response.status}`);
      return [];
    }
    const xml = await response.text();
    const entries: SitemapEntry[] = [];
    const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    for (const block of urlBlocks) {
      const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]?.trim();
      const last = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]?.trim();
      if (loc) entries.push({ url: loc, lastModified: last });
    }
    return entries;
  } catch (err) {
    console.warn("[seo-agent] sitemap parse failed:", err);
    return [];
  }
}

/** Convert a full URL to a route path used by the page-seo collection. */
export function urlToPathKey(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/$/, "") || "/";
  } catch {
    return url;
  }
}
