// Canonical admin destinations used by legacy/alias routes.
// Search-marketing surfaces live under the /admin/seo hub; the `section` query
// parameter selects the tab.
//
// Page metadata is NOT an SEO-hub tab — it controls the live <title>/<meta> of
// every marketing page, so it has its own top-level route.
// Audits live under the agent that produces them.
//
// Creeda AI is no longer an SEO surface: it is reached from the admin dashboard,
// which is its single entry point.
export const ADMIN_ROUTE_ALIASES = {
  creedAI: "/admin",
  seoHub: "/admin/seo",
  pageMetadata: "/admin/metadata",
  seoPages: "/admin/metadata",
  seoAudits: "/admin/seo?section=agent&tab=audits",
  seoKeywords: "/admin/seo?section=keywords",
  seoOpportunities: "/admin/seo?section=keywords&tab=gaps",
  seoBriefs: "/admin/seo?section=briefs",
  seoOutreach: "/admin/seo?section=outreach",
  seoCitations: "/admin/seo?section=keywords&tab=gaps",
  seoDigest: "/admin/seo?section=agent",
  seoAgent: "/admin/seo?section=agent",
  seoTasks: "/admin/seo?section=action-items",
  seoRankings: "/admin/seo?section=keywords&tab=rankings",
} as const;
