/**
 * AI Page-Aware Context Engine
 *
 * Automatically determines which admin page the user is on and loads
 * the most relevant Firestore data for that context. This enables the
 * AI to give targeted, data-informed responses without the user having
 * to manually specify what data to include.
 *
 * Usage:
 *   const context = await loadPageAwareContext("/admin/leads");
 *   // Returns { dataContext, pageContext, section, relevantCollections }
 */

import { fetchAll } from "@/lib/firebase/firestore";
import type { Lead, Customer, Contact, Booking } from "@/lib/types/crm";
import type { KeywordGap } from "@/lib/types/seo-agent";
import type {
  BlogPost,
  SEOKeyword,
  SEOAudit,
  Campaign,
  EmailDraft,
  LandingPage,
  ForumThread,
} from "@/lib/types/content";
import {
  type AllCollections,
  buildFullContext,
  buildSalesContext,
  buildSEOContext,
  buildMarketingContext,
  buildKeywordContext,
  buildLandingPageContext,
  buildBookingContext,
  buildBlogContext,
  buildForumContext,
  buildCustomerLTVContext,
  buildLeadResponseContext,
  buildEmailEngagementContext,
} from "./ai-data-context";
import { getPageContext } from "./ai-system-prompt";

// ─── Page → Collection mapping ───────────────────────

interface PageConfig {
  section: string;
  collections: (keyof AllCollections)[];
  contextBuilder: (data: AllCollections) => string;
}

/**
 * Every collection Creeda AI can draw on.
 *
 * Creeda AI is one assistant with one conversation, so any surface that has no
 * narrower, purpose-built config gets the whole business. A fragment context
 * made the dashboard answer whole-business questions from leads alone.
 */
const FULL_BUSINESS_COLLECTIONS: (keyof AllCollections)[] = [
  "leads",
  "customers",
  "contacts",
  "bookings",
  "campaigns",
  "emails",
  "blog",
  "keywords",
  "keywordGaps",
  "seoAudits",
  "landingPages",
  "forumThreads",
];

/** The admin dashboard is Creeda AI's home, so it owns the full picture. */
const DASHBOARD_CONFIG: PageConfig = {
  section: "Creeda AI",
  collections: FULL_BUSINESS_COLLECTIONS,
  contextBuilder: buildFullContext,
};

/** Fallback for any admin route without its own config. */
const DEFAULT_CONFIG: PageConfig = {
  section: "CreedaVA AI",
  collections: FULL_BUSINESS_COLLECTIONS,
  contextBuilder: buildFullContext,
};

const PAGE_CONFIGS: Record<string, PageConfig> = {
  "": DASHBOARD_CONFIG,
  dashboard: DASHBOARD_CONFIG,
  analytics: {
    section: "Analytics AI",
    collections: ["leads", "customers", "bookings", "campaigns", "blog"],
    contextBuilder: buildFullContext,
  },
  blog: {
    section: "Blog AI",
    collections: ["blog", "keywords", "seoAudits"],
    contextBuilder: buildBlogContext,
  },
  bookings: {
    section: "Bookings AI",
    collections: ["bookings", "customers", "leads"],
    contextBuilder: buildBookingContext,
  },
  contacts: {
    section: "Contacts AI",
    collections: ["contacts", "leads", "customers"],
    contextBuilder: buildSalesContext,
  },
  customers: {
    section: "Customers AI",
    collections: ["customers", "bookings", "leads"],
    contextBuilder: buildCustomerLTVContext,
  },
  emails: {
    section: "Email AI",
    collections: ["emails", "campaigns", "leads"],
    contextBuilder: buildEmailEngagementContext,
  },
  forum: {
    section: "Forum AI",
    collections: ["forumThreads"],
    contextBuilder: buildForumContext,
  },
  leads: {
    section: "Leads AI",
    collections: ["leads", "contacts", "bookings"],
    contextBuilder: buildLeadResponseContext,
  },
  "marketing/campaigns": {
    section: "Campaigns AI",
    collections: ["campaigns", "leads", "customers"],
    contextBuilder: buildMarketingContext,
  },
  "marketing/landing-pages": {
    section: "Landing Pages AI",
    collections: ["landingPages", "campaigns", "leads"],
    contextBuilder: buildLandingPageContext,
  },
  seo: {
    section: "SEO AI",
    collections: ["keywords", "keywordGaps", "seoAudits", "blog", "landingPages"],
    contextBuilder: buildSEOContext,
  },
  keywords: {
    section: "Keyword AI",
    collections: ["keywords", "keywordGaps", "seoAudits", "blog"],
    contextBuilder: buildKeywordContext,
  },
  metadata: {
    section: "Metadata AI",
    collections: ["seoAudits", "keywords", "blog"],
    contextBuilder: buildSEOContext,
  },
};

// ─── Collection fetchers ─────────────────────────────

const COLLECTION_FETCHERS: Record<
  keyof AllCollections,
  () => Promise<unknown[]>
> = {
  leads: () => fetchAll<Lead>("leads"),
  customers: () => fetchAll<Customer>("customers"),
  contacts: () => fetchAll<Contact>("contacts"),
  bookings: () => fetchAll<Booking>("bookings"),
  campaigns: () => fetchAll<Campaign>("campaigns"),
  emails: () => fetchAll<EmailDraft>("emails"),
  blog: () => fetchAll<BlogPost>("blog"),
  keywords: () => fetchAll<SEOKeyword>("keywords"),
  keywordGaps: () => fetchAll<KeywordGap>("keyword-gaps"),
  // Crawler findings, not manual reviews. `onpage-audits` is what the SEO agent
  // actually writes on every run; the legacy `seo` collection only ever held
  // one-off AI reviews from a button, so it was usually empty — which left the
  // AI reasoning about SEO from keywords alone.
  seoAudits: () => fetchAll<SEOAudit>("onpage-audits"),
  landingPages: () => fetchAll<LandingPage>("landing-pages"),
  forumThreads: () => fetchAll<ForumThread>("forum"),
};

// ─── Main loader ─────────────────────────────────────

export interface PageAwareContext {
  /** Serialized business data for the AI prompt */
  dataContext: string;
  /** Page-specific instructions for the AI */
  pageContext: string;
  /** Section label (e.g., "Blog AI") */
  section: string;
  /** Which collections were loaded */
  loadedCollections: string[];
  /** Raw data for components that need it */
  rawData: AllCollections;
}

/**
 * Load page-aware context by fetching only the Firestore collections
 * relevant to the current admin page.
 *
 * @param pagePath - Current admin route (e.g., "/admin/leads" or "leads")
 */
export async function loadPageAwareContext(
  pagePath: string,
): Promise<PageAwareContext> {
  const normalized = pagePath
    .replace(/^\/admin\/?/, "")
    .replace(/\/$/, "")
    .toLowerCase();

  const config = PAGE_CONFIGS[normalized] || DEFAULT_CONFIG;

  // Fetch all relevant collections in parallel
  const fetchPromises = config.collections.map(async (key) => {
    try {
      const fetcher = COLLECTION_FETCHERS[key];
      if (!fetcher) return { key, data: [] as unknown[] };
      const data = await fetcher();
      return { key, data };
    } catch (err) {
      console.warn(`[AI Context] Failed to fetch ${key}:`, err);
      return { key, data: [] as unknown[] };
    }
  });

  const results = await Promise.all(fetchPromises);

  // Build the AllCollections object
  const rawData: AllCollections = {};
  for (const { key, data } of results) {
    (rawData as Record<string, unknown>)[key] = data;
  }

  return {
    dataContext: config.contextBuilder(rawData),
    pageContext: getPageContext(pagePath),
    section: config.section,
    loadedCollections: config.collections,
    rawData,
  };
}

/**
 * Load a slim context for quick AI operations (fewer collections).
 * Used for lightweight tasks like generating a single follow-up email.
 */
export async function loadSlimContext(
  collections: (keyof AllCollections)[],
): Promise<AllCollections> {
  const fetchPromises = collections.map(async (key) => {
    try {
      const fetcher = COLLECTION_FETCHERS[key];
      if (!fetcher) return { key, items: [] as unknown[] };
      const data = await fetcher();
      return { key, items: data };
    } catch {
      return { key, items: [] as unknown[] };
    }
  });

  const results = await Promise.all(fetchPromises);
  const data: AllCollections = {};
  for (const { key, items } of results) {
    (data as Record<string, unknown>)[key] = items;
  }
  return data;
}

/**
 * Get the page configuration without fetching data.
 * Useful for components that need the section name or collection list.
 */
export function getPageConfig(pagePath: string): PageConfig {
  const normalized = pagePath
    .replace(/^\/admin\/?/, "")
    .replace(/\/$/, "")
    .toLowerCase();
  return PAGE_CONFIGS[normalized] || DEFAULT_CONFIG;
}
