// Canonical admin destinations used by legacy/alias routes.
// Keeping these in one place prevents terminology drift between tabs and URLs.
export const ADMIN_ROUTE_ALIASES = {
  analyticsReports: "/admin/analytics/reports",
  seoAgent: "/admin/seo/content?tab=agent",
  seoTasks: "/admin/seo/content?tab=tasks",
  seoAudits: "/admin/seo/content?tab=audits",
  seoRankings: "/admin/seo/keywords?tab=rankings",
} as const;
