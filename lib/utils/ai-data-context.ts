/**
 * AI Data Context Builder
 *
 * Serializes Firestore collection data into compact context strings
 * for Gemini prompts. Keeps context under ~50K tokens by summarizing
 * large collections and including only the most recent/relevant items.
 */

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

// ─── Collection data shape passed into builders ──────

export interface AllCollections {
  leads?: Lead[];
  customers?: Customer[];
  tasks?: Task[];
  projects?: Project[];
  contacts?: Contact[];
  bookings?: Booking[];
  campaigns?: Campaign[];
  socialPosts?: SocialPost[];
  emails?: EmailDraft[];
  blog?: BlogPost[];
  keywords?: SEOKeyword[];
  seoAudits?: SEOAudit[];
  landingPages?: LandingPage[];
  forumThreads?: ForumThread[];
}

// ─── Full context (all collections) ──────────────────

export function buildFullContext(data: AllCollections): string {
  const sections: string[] = [
    `CreedaVA Business Intelligence Snapshot — ${new Date().toLocaleDateString()}`,
    "",
  ];

  if (data.leads?.length) sections.push(summarizeLeads(data.leads));
  if (data.customers?.length) sections.push(summarizeCustomers(data.customers));
  if (data.tasks?.length) sections.push(summarizeTasks(data.tasks));
  if (data.projects?.length) sections.push(summarizeProjects(data.projects));
  if (data.contacts?.length) sections.push(summarizeContacts(data.contacts));
  if (data.bookings?.length) sections.push(summarizeBookings(data.bookings));
  if (data.campaigns?.length) sections.push(summarizeCampaigns(data.campaigns));
  if (data.socialPosts?.length) sections.push(summarizeSocial(data.socialPosts));
  if (data.emails?.length) sections.push(summarizeEmails(data.emails));
  if (data.blog?.length) sections.push(summarizeBlog(data.blog));
  if (data.keywords?.length) sections.push(summarizeKeywords(data.keywords));
  if (data.seoAudits?.length) sections.push(summarizeSEO(data.seoAudits));
  if (data.landingPages?.length) sections.push(summarizeLandingPages(data.landingPages));
  if (data.forumThreads?.length) sections.push(summarizeForum(data.forumThreads));

  return sections.join("\n");
}

// ─── Period-filtered context ─────────────────────────

export function buildPeriodContext(
  data: AllCollections,
  period: "daily" | "weekly" | "monthly",
): string {
  const now = new Date();
  const cutoff = new Date();
  if (period === "daily") cutoff.setDate(now.getDate() - 1);
  else if (period === "weekly") cutoff.setDate(now.getDate() - 7);
  else cutoff.setMonth(now.getMonth() - 1);

  const filterByDate = <T extends { createdAt?: unknown }>(items: T[]): T[] =>
    items.filter((item) => {
      if (!item.createdAt) return false;
      const d =
        typeof item.createdAt === "object" && item.createdAt !== null && "toDate" in item.createdAt
          ? (item.createdAt as { toDate: () => Date }).toDate()
          : new Date(item.createdAt as string);
      return d >= cutoff;
    });

  const header = `CreedaVA ${period.charAt(0).toUpperCase() + period.slice(1)} Report — ${now.toLocaleDateString()}\nPeriod: ${cutoff.toLocaleDateString()} → ${now.toLocaleDateString()}\n`;

  const filtered: AllCollections = {
    leads: data.leads ? filterByDate(data.leads) : undefined,
    customers: data.customers ? filterByDate(data.customers) : undefined,
    tasks: data.tasks ? filterByDate(data.tasks) : undefined,
    projects: data.projects,
    contacts: data.contacts ? filterByDate(data.contacts) : undefined,
    bookings: data.bookings ? filterByDate(data.bookings) : undefined,
    campaigns: data.campaigns,
    socialPosts: data.socialPosts ? filterByDate(data.socialPosts) : undefined,
    emails: data.emails ? filterByDate(data.emails) : undefined,
    blog: data.blog ? filterByDate(data.blog) : undefined,
    keywords: data.keywords,
    seoAudits: data.seoAudits,
    landingPages: data.landingPages,
  };

  // Also include totals from full data for comparison
  const totals = `\n--- ALL-TIME TOTALS (for comparison) ---
Leads: ${data.leads?.length || 0} total
Customers: ${data.customers?.length || 0} total
Tasks: ${data.tasks?.length || 0} total
Bookings: ${data.bookings?.length || 0} total\n`;

  return header + buildFullContext(filtered) + totals;
}

// ─── Category-specific context builders ──────────────

export function buildSalesContext(data: AllCollections): string {
  const sections = ["SALES & PIPELINE CONTEXT"];
  if (data.leads?.length) sections.push(summarizeLeads(data.leads));
  if (data.customers?.length) sections.push(summarizeCustomers(data.customers));
  if (data.bookings?.length) sections.push(summarizeBookings(data.bookings));
  return sections.join("\n");
}

export function buildSEOContext(data: AllCollections): string {
  const sections = ["SEO & CONTENT CONTEXT"];
  if (data.blog?.length) sections.push(summarizeBlog(data.blog));
  if (data.keywords?.length) sections.push(summarizeKeywords(data.keywords));
  if (data.seoAudits?.length) sections.push(summarizeSEO(data.seoAudits));
  if (data.landingPages?.length) sections.push(summarizeLandingPages(data.landingPages));
  return sections.join("\n");
}

export function buildMarketingContext(data: AllCollections): string {
  const sections = ["MARKETING CONTEXT"];
  if (data.campaigns?.length) sections.push(summarizeCampaigns(data.campaigns));
  if (data.socialPosts?.length) sections.push(summarizeSocial(data.socialPosts));
  if (data.emails?.length) sections.push(summarizeEmails(data.emails));
  if (data.landingPages?.length) sections.push(summarizeLandingPages(data.landingPages));
  return sections.join("\n");
}

export function buildOperationsContext(data: AllCollections): string {
  const sections = ["OPERATIONS CONTEXT"];
  if (data.tasks?.length) sections.push(summarizeTasks(data.tasks));
  if (data.projects?.length) sections.push(summarizeProjects(data.projects));
  if (data.bookings?.length) sections.push(summarizeBookings(data.bookings));
  return sections.join("\n");
}

export function buildKeywordContext(data: AllCollections): string {
  const sections = ["KEYWORD HEALTH CONTEXT"];
  if (data.keywords?.length) sections.push(summarizeKeywords(data.keywords));
  if (data.blog?.length) sections.push(summarizeBlog(data.blog));
  if (data.seoAudits?.length) sections.push(summarizeSEO(data.seoAudits));
  return sections.join("\n");
}

export function buildLandingPageContext(data: AllCollections): string {
  const sections = ["LANDING PAGE PERFORMANCE CONTEXT"];
  if (data.landingPages?.length) sections.push(summarizeLandingPages(data.landingPages));
  if (data.campaigns?.length) sections.push(summarizeCampaigns(data.campaigns));
  if (data.leads?.length) sections.push(summarizeLeads(data.leads));
  return sections.join("\n");
}

export function buildBookingContext(data: AllCollections): string {
  const sections = ["BOOKING & RETENTION CONTEXT"];
  if (data.bookings?.length) sections.push(summarizeBookings(data.bookings));
  if (data.customers?.length) sections.push(summarizeCustomers(data.customers));
  if (data.leads?.length) sections.push(summarizeLeads(data.leads));
  return sections.join("\n");
}

export function buildBlogContext(data: AllCollections): string {
  const sections = ["BLOG PERFORMANCE CONTEXT"];
  if (data.blog?.length) sections.push(summarizeBlog(data.blog));
  if (data.keywords?.length) sections.push(summarizeKeywords(data.keywords));
  if (data.seoAudits?.length) sections.push(summarizeSEO(data.seoAudits));
  return sections.join("\n");
}

export function buildForumContext(data: AllCollections): string {
  const sections = ["FORUM HEALTH CONTEXT"];
  if (data.forumThreads?.length) sections.push(summarizeForum(data.forumThreads));
  return sections.join("\n");
}

export function buildContentVelocityContext(data: AllCollections): string {
  const sections = ["CONTENT VELOCITY CONTEXT"];
  if (data.blog?.length) sections.push(summarizeBlog(data.blog));
  if (data.socialPosts?.length) sections.push(summarizeSocial(data.socialPosts));
  if (data.emails?.length) sections.push(summarizeEmails(data.emails));
  if (data.landingPages?.length) sections.push(summarizeLandingPages(data.landingPages));
  if (data.forumThreads?.length) sections.push(summarizeForum(data.forumThreads));
  return sections.join("\n");
}

export function buildCustomerLTVContext(data: AllCollections): string {
  const sections = ["CUSTOMER LTV & CHURN RISK CONTEXT"];
  if (data.customers?.length) sections.push(summarizeCustomers(data.customers));
  if (data.projects?.length) sections.push(summarizeProjects(data.projects));
  if (data.bookings?.length) sections.push(summarizeBookings(data.bookings));
  if (data.leads?.length) sections.push(summarizeLeads(data.leads));
  return sections.join("\n");
}

export function buildLeadResponseContext(data: AllCollections): string {
  const sections = ["LEAD RESPONSE SPEED CONTEXT"];
  if (data.leads?.length) sections.push(summarizeLeads(data.leads));
  if (data.contacts?.length) sections.push(summarizeContacts(data.contacts));
  if (data.bookings?.length) sections.push(summarizeBookings(data.bookings));
  return sections.join("\n");
}

export function buildEmailEngagementContext(data: AllCollections): string {
  const sections = ["EMAIL ENGAGEMENT CONTEXT"];
  if (data.emails?.length) sections.push(summarizeEmails(data.emails));
  if (data.campaigns?.length) sections.push(summarizeCampaigns(data.campaigns));
  if (data.leads?.length) sections.push(summarizeLeads(data.leads));
  return sections.join("\n");
}

export function buildSocialEngagementContext(data: AllCollections): string {
  const sections = ["SOCIAL MEDIA ENGAGEMENT CONTEXT"];
  if (data.socialPosts?.length) sections.push(summarizeSocial(data.socialPosts));
  if (data.campaigns?.length) sections.push(summarizeCampaigns(data.campaigns));
  return sections.join("\n");
}

export function buildRevenueAttributionContext(data: AllCollections): string {
  const sections = ["REVENUE ATTRIBUTION CONTEXT"];
  if (data.leads?.length) sections.push(summarizeLeads(data.leads));
  if (data.customers?.length) sections.push(summarizeCustomers(data.customers));
  if (data.campaigns?.length) sections.push(summarizeCampaigns(data.campaigns));
  if (data.bookings?.length) sections.push(summarizeBookings(data.bookings));
  return sections.join("\n");
}

// ─── Per-collection summarizers ──────────────────────

function countBy<T>(items: T[], key: (item: T) => string): string {
  const counts: Record<string, number> = {};
  items.forEach((item) => {
    const k = key(item) || "unknown";
    counts[k] = (counts[k] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

function summarizeLeads(leads: Lead[]): string {
  const won = leads.filter((l) => l.status === "won").length;
  const pipeline = leads
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((s, l) => s + (l.value || 0), 0);
  const winRate = leads.length > 0 ? ((won / leads.length) * 100).toFixed(1) : "0";
  const topLeads = leads
    .filter((l) => !["won", "lost"].includes(l.status))
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 10)
    .map((l) => `${l.name} ($${l.value || 0}, ${l.status}, ${l.source})`)
    .join("; ");
  return `\n--- LEADS (${leads.length}) ---
By status: ${countBy(leads, (l) => l.status)}
By source: ${countBy(leads, (l) => l.source)}
Win rate: ${winRate}% (${won} won)
Pipeline value: $${pipeline.toLocaleString()}
Top open leads: ${topLeads || "none"}`;
}

function summarizeCustomers(customers: Customer[]): string {
  const active = customers.filter((c) => c.status === "active");
  const mrr = active.reduce((s, c) => s + (c.monthlyValue || 0), 0);
  const plans = [...new Set(customers.map((c) => c.plan).filter(Boolean))];
  const top = active
    .sort((a, b) => (b.monthlyValue || 0) - (a.monthlyValue || 0))
    .slice(0, 5)
    .map((c) => `${c.name} ($${c.monthlyValue || 0}/mo, ${c.plan || "—"})`)
    .join("; ");
  return `\n--- CUSTOMERS (${customers.length}) ---
By status: ${countBy(customers, (c) => c.status)}
MRR: $${mrr.toLocaleString()}, ARR: $${(mrr * 12).toLocaleString()}
Plans: ${plans.join(", ") || "none defined"}
Top by revenue: ${top || "none"}`;
}

function summarizeTasks(tasks: Task[]): string {
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
  );
  return `\n--- TASKS (${tasks.length}) ---
By status: ${countBy(tasks, (t) => t.status)}
By priority: ${countBy(tasks, (t) => t.priority)}
Overdue: ${overdue.length} (${overdue.map((t) => t.title).join(", ") || "none"})`;
}

function summarizeProjects(projects: Project[]): string {
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const active = projects
    .filter((p) => p.status === "active")
    .map((p) => `${p.name} (${p.clientName || "—"}, $${p.budget || 0})`)
    .join("; ");
  return `\n--- PROJECTS (${projects.length}) ---
By status: ${countBy(projects, (p) => p.status)}
Total budget: $${totalBudget.toLocaleString()}
Active: ${active || "none"}`;
}

function summarizeContacts(contacts: Contact[]): string {
  const companies = [...new Set(contacts.map((c) => c.company).filter(Boolean))];
  return `\n--- CONTACTS (${contacts.length}) ---
Companies: ${companies.slice(0, 15).join(", ") || "none"}
Roles: ${[...new Set(contacts.map((c) => c.role).filter(Boolean))].slice(0, 10).join(", ") || "none"}`;
}

function summarizeBookings(bookings: Booking[]): string {
  const services = [...new Set(bookings.map((b) => b.service).filter(Boolean))];
  return `\n--- BOOKINGS (${bookings.length}) ---
By status: ${countBy(bookings, (b) => b.status)}
Services: ${services.join(", ") || "none"}`;
}

function summarizeCampaigns(campaigns: Campaign[]): string {
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
  return `\n--- CAMPAIGNS (${campaigns.length}) ---
By status: ${countBy(campaigns, (c) => c.status)}
Budget: $${totalBudget.toLocaleString()} total, $${totalSpent.toLocaleString()} spent
Performance: ${totalImpressions} impressions, ${totalClicks} clicks (${ctr}% CTR), ${totalConversions} conversions`;
}

function summarizeSocial(posts: SocialPost[]): string {
  return `\n--- SOCIAL POSTS (${posts.length}) ---
By status: ${countBy(posts, (p) => p.status)}
Platforms: ${countBy(posts, (p) => p.platform)}`;
}

function summarizeEmails(emails: EmailDraft[]): string {
  return `\n--- EMAILS (${emails.length}) ---
By status: ${countBy(emails, (e) => e.status)}`;
}

function summarizeBlog(posts: BlogPost[]): string {
  const published = posts.filter((p) => p.status === "published");
  const titles = published.slice(0, 10).map((p) => p.title).join("; ");
  const tags = [...new Set(posts.flatMap((p) => p.tags || []))];
  return `\n--- BLOG (${posts.length}, ${published.length} published) ---
Recent: ${titles || "none"}
Tags: ${tags.slice(0, 15).join(", ") || "none"}`;
}

function summarizeKeywords(keywords: SEOKeyword[]): string {
  const tracked = keywords.filter((k) => k.tracked).length;
  const byDifficulty = countBy(keywords, (k) => k.difficulty);
  const byIntent = countBy(keywords, (k) => k.searchIntent);
  return `\n--- SEO KEYWORDS (${keywords.length}, ${tracked} tracked) ---
By difficulty: ${byDifficulty}
By intent: ${byIntent}
Keywords: ${keywords.slice(0, 20).map((k) => k.keyword).join(", ")}`;
}

function summarizeSEO(audits: SEOAudit[]): string {
  const avgScore = audits.length > 0
    ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length)
    : 0;
  const highIssues = audits.reduce(
    (s, a) => s + (a.issues?.filter((i) => i.severity === "high").length || 0),
    0,
  );
  return `\n--- SEO AUDITS (${audits.length}) ---
Average score: ${avgScore}/100
High-severity issues: ${highIssues}
Pages audited: ${audits.map((a) => a.url).join(", ")}`;
}

function summarizeLandingPages(pages: LandingPage[]): string {
  return `\n--- LANDING PAGES (${pages.length}) ---
By status: ${countBy(pages, (p) => p.status)}
Pages: ${pages.map((p) => p.title).join(", ")}`;
}

function summarizeForum(threads: ForumThread[]): string {
  const open = threads.filter((t) => t.status === "open").length;
  const closed = threads.filter((t) => t.status === "closed").length;
  const flagged = threads.filter((t) => t.status === "flagged").length;
  const totalReplies = threads.reduce((s, t) => s + (t.replies || 0), 0);
  const totalLikes = threads.reduce((s, t) => s + (t.likes || 0), 0);
  const avgReplies = threads.length > 0 ? (totalReplies / threads.length).toFixed(1) : "0";
  const tags = [...new Set(threads.flatMap((t) => t.tags || []))];
  const topThreads = threads
    .sort((a, b) => (b.replies || 0) - (a.replies || 0))
    .slice(0, 5)
    .map((t) => `"${t.title}" (${t.replies} replies, ${t.likes} likes)`)
    .join("; ");
  return `\n--- FORUM THREADS (${threads.length}) ---
Open: ${open}, Closed: ${closed}, Flagged: ${flagged}
Total replies: ${totalReplies}, Total likes: ${totalLikes}
Avg replies/thread: ${avgReplies}
Tags: ${tags.slice(0, 15).join(", ") || "none"}
Top by engagement: ${topThreads || "none"}`;
}
