// Canonical admin destinations used by legacy/alias routes.
// All SEO surfaces now live under the unified /admin/seo hub. The `section`
// query parameter selects the tab.
export const ADMIN_ROUTE_ALIASES = {
  seoHub: "/admin/seo",
  seoCreedaAI: "/admin/seo?section=ai",
  seoPages: "/admin/seo?section=pages",
  seoAudits: "/admin/seo?section=pages",
  seoKeywords: "/admin/seo?section=keywords",
  seoOpportunities: "/admin/seo?section=opportunities",
  seoBriefs: "/admin/seo?section=briefs",
  seoOutreach: "/admin/seo?section=outreach",
  seoCitations: "/admin/seo?section=opportunities",
  seoDigest: "/admin/seo?section=agent",
  seoAgent: "/admin/seo?section=agent",
  seoTasks: "/admin/seo?section=tasks",
  seoRankings: "/admin/seo?section=keywords&tab=rankings",
} as const;
