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
import type { Lead, Customer, Task, Project, Contact, Booking } from "@/lib/types/crm";
import type {
  BlogPost,
  SEOKeyword,
  SEOAudit,
  Campaign,
  SocialPost,
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
  buildOperationsContext,
  buildKeywordContext,
  buildLandingPageContext,
  buildBookingContext,
  buildBlogContext,
  buildForumContext,
  buildCustomerLTVContext,
  buildLeadResponseContext,
  buildEmailEngagementContext,
  buildSocialEngagementContext,
} from "./ai-data-context";
import { getPageContext } from "./ai-system-prompt";

// ─── Page → Collection mapping ───────────────────────

interface PageConfig {
  section: string;
  collections: (keyof AllCollections)[];
  contextBuilder: (data: AllCollections) => string;
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
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
    collections: ["customers", "projects", "bookings", "leads"],
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
  "marketing/social": {
    section: "Social Media AI",
    collections: ["socialPosts", "campaigns"],
    contextBuilder: buildSocialEngagementContext,
  },
  projects: {
    section: "Projects AI",
    collections: ["projects", "tasks", "customers"],
    contextBuilder: buildOperationsContext,
  },
  "seo/content": {
    section: "SEO Content AI",
    collections: ["blog", "keywords", "seoAudits", "landingPages"],
    contextBuilder: buildSEOContext,
  },
  "seo/keywords": {
    section: "SEO Keywords AI",
    collections: ["keywords", "blog", "seoAudits"],
    contextBuilder: buildKeywordContext,
  },
  tasks: {
    section: "Tasks AI",
    collections: ["tasks", "projects", "bookings"],
    contextBuilder: buildOperationsContext,
  },
};

// Default for unrecognized pages — minimal footprint, only core CRM data
const DEFAULT_CONFIG: PageConfig = {
  section: "CreedaVA AI",
  collections: ["leads", "tasks"],
  contextBuilder: buildFullContext,
};

// ─── Collection fetchers ─────────────────────────────

const COLLECTION_FETCHERS: Record<
  keyof AllCollections,
  () => Promise<unknown[]>
> = {
  leads: () => fetchAll<Lead>("leads"),
  customers: () => fetchAll<Customer>("customers"),
  tasks: () => fetchAll<Task>("tasks"),
  projects: () => fetchAll<Project>("projects"),
  contacts: () => fetchAll<Contact>("contacts"),
  bookings: () => fetchAll<Booking>("bookings"),
  campaigns: () => fetchAll<Campaign>("campaigns"),
  socialPosts: () => fetchAll<SocialPost>("social-posts"),
  emails: () => fetchAll<EmailDraft>("emails"),
  blog: () => fetchAll<BlogPost>("blog"),
  keywords: () => fetchAll<SEOKeyword>("keywords"),
  seoAudits: () => fetchAll<SEOAudit>("seo-audits"),
  landingPages: () => fetchAll<LandingPage>("landing-pages"),
  forumThreads: () => fetchAll<ForumThread>("forum-threads"),
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
