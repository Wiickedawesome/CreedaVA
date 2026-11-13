// Canonical admin destinations used by legacy/alias routes.
// Search-marketing surfaces live under the /admin/seo hub; the `section` query
// parameter selects the tab.
//
// Page metadata is NOT an SEO-hub tab — it controls the live <title>/<meta> of
// every marketing page, so it has its own top-level route.
// Findings live on the page that owns their subject: path-scoped ones (on-page,
// citation) on Page metadata, query-scoped ones on Keywords.
//
// Creeda AI is no longer an SEO surface: it is reached from the admin dashboard,
// which is its single entry point.
export const ADMIN_ROUTE_ALIASES = {
  creedAI: "/admin",
  seoHub: "/admin/seo",
  pageMetadata: "/admin/metadata",
  seoPages: "/admin/metadata",
  seoAudits: "/admin/metadata",
  seoKeywords: "/admin/keywords",
  seoOpportunities: "/admin/keywords?tab=gaps",
  seoBriefs: "/admin/seo?section=agent&tab=briefs",
  seoOutreach: "/admin/emails?tab=outreach",
  seoCitations: "/admin/keywords?tab=gaps",
  seoDigest: "/admin/seo?section=agent&tab=digest",
  seoAgent: "/admin/seo?section=agent",
  seoTasks: "/admin/metadata",
  seoRankings: "/admin/keywords?tab=rankings",
} as const;
