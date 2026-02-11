import { useState, useEffect } from 'react'

export interface SiteMetadata {
  url: string
  title?: string
  metaDescription?: string
  targetKeywords?: string
  focusKeyword?: string
  canonicalUrl?: string
  openGraphTitle?: string
  openGraphDescription?: string
  openGraphImage?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  category?: string
  contentType?: string
}

// In-memory cache so we only fetch once per session
let metadataCache: SiteMetadata[] | null = null
let fetchPromise: Promise<SiteMetadata[]> | null = null

async function fetchAllSeoMetadata(): Promise<SiteMetadata[]> {
  if (metadataCache) return metadataCache

  if (fetchPromise) return fetchPromise

  fetchPromise = (async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${API_BASE}/public/seo`)
      if (!response.ok) return []
      const result = await response.json()
      metadataCache = result.data || []
      return metadataCache!
    } catch {
      return []
    } finally {
      fetchPromise = null
    }
  })()

  return fetchPromise
}

/**
 * Hook that fetches published SEO metadata from Cosmos DB for a given page path.
 * Returns the Cosmos-managed metadata if it exists, or null if no record is published
 * for this page (in which case the caller should fall back to hardcoded defaults).
 * 
 * Usage:
 *   const metadata = useSiteMetadata('/about')
 *   <SEO
 *     title={metadata?.title || seoData.about.title}
 *     description={metadata?.metaDescription || seoData.about.description}
 *     ...
 *   />
 */
export function useSiteMetadata(pagePath: string): SiteMetadata | null {
  const [metadata, setMetadata] = useState<SiteMetadata | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchAllSeoMetadata().then((all) => {
      if (cancelled) return
      // Match by URL path — support both `/about` and `https://creedava.com/about`
      const match = all.find(
        (item) => item.url === pagePath || item.url === `https://creedava.com${pagePath}`
      )
      setMetadata(match || null)
    })

    return () => { cancelled = true }
  }, [pagePath])

  return metadata
}

/** Clear the cache — useful if admin just saved new SEO data */
export function invalidateSeoCache() {
  metadataCache = null
}
