import type { FirestoreDoc } from "./crm";

// ─── Page SEO (editable from admin) ──────────────────
export interface PageSEO extends FirestoreDoc {
  path: string;              // route path e.g. "/" or "/services"
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string[];
  noIndex?: boolean;
}

// ─── Blog ────────────────────────────────────────────

/**
 * One cited source. `url` is optional because a print or in-house source
 * (a CRM export, a paid report) may have no public link; `label` carries
 * everything a reader needs to find it either way.
 */
export interface BlogReference {
  label: string;
  url?: string;
  /** Publisher or site name, shown in the list after the label. */
  source?: string;
  /** Publication year, shown when the source is dated. */
  year?: string;
}

export interface BlogPost extends FirestoreDoc {
  title: string;
  slug: string;
  excerpt: string;
  content: string;           // HTML content
  tags: string[];
  metaDescription: string;
  status: "draft" | "scheduled" | "published";
  publishedAt?: string;       // ISO date
  author?: string;
  featuredImage?: string;     // URL from Firebase Storage
  images?: string[];          // additional image URLs
  attachments?: { name: string; url: string; type: string }[];
  lang?: string;              // original language code
  translations?: Record<string, ContentTranslation>;
  scheduledAt?: string;        // ISO date — auto-publish at this time
  unpublishAt?: string;        // ISO date — auto-unpublish (sunset) at this time
  /** Auto-injected Article JSON-LD from the SEO synthesizer. */
  jsonLd?: object;
  /**
   * Cited sources for the claims in `content`. Numbered inline as [1], [2]…
   * in the reading order of this array. Empty is better than invented.
   */
  references?: BlogReference[];
}

export type BlogPostFormData = Omit<BlogPost, keyof FirestoreDoc>;

// ─── SEO Keywords ────────────────────────────────────
export interface SEOKeyword extends FirestoreDoc {
  keyword: string;
  searchIntent: "informational" | "commercial" | "transactional" | "navigational";
  difficulty: "low" | "medium" | "high";
  suggestedTitle: string;
  tracked: boolean;
  notes?: string;
  // Search Console metrics (persisted on sync)
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
  lastSynced?: string;
}

export type SEOKeywordFormData = Omit<SEOKeyword, keyof FirestoreDoc>;

// ─── SEO Audit ───────────────────────────────────────
export interface SEOAudit extends FirestoreDoc {
  url: string;
  score: number;
  /** `suggestion` is the legacy field name still present in older audits. */
  issues: {
    severity: "high" | "medium" | "low";
    issue: string;
    fix?: string;
    suggestion?: string;
  }[];
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedH1: string;
  missingElements: string[];
}

// ─── Email Draft ─────────────────────────────────────
export interface EmailDraft extends FirestoreDoc {
  purpose: string;
  subject: string;
  body: string;              // HTML
  previewText: string;
  status: "draft" | "sent";
  images?: string[];
  attachments?: { name: string; url: string; type: string }[];
}

export type EmailDraftFormData = Omit<EmailDraft, keyof FirestoreDoc>;

// ─── Inbox Message (synced from IMAP) ────────────────
export interface InboxMessage extends FirestoreDoc {
  uid: number;
  messageId: string;
  from: string;
  fromName: string;
  to: string;
  receivedBy: string;        // which alias received this
  cc?: string;
  subject: string;
  date: string;
  preview: string;
  bodyHtml: string;
  bodyText: string;
  seen: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  attachments?: { filename: string; contentType: string; size: number }[];
  replied: boolean;
  archived: boolean;
  starred: boolean;
}

// ─── Email Campaign ──────────────────────────────────
export interface EmailCampaign extends FirestoreDoc {
  name: string;
  subject: string;
  body: string;               // HTML content
  previewText: string;
  fromAddress: string;         // which alias to send from
  status: "draft" | "scheduled" | "sending" | "sent" | "paused";
  recipients: string[];        // email addresses
  recipientSource?: string;    // "manual" | "leads" | "customers" | "contacts"
  scheduledAt?: string;        // ISO date for scheduled send
  sentAt?: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
  };
  tags?: string[];
  notes?: string;
}

export type EmailCampaignFormData = Omit<EmailCampaign, keyof FirestoreDoc>;

// ─── Campaign ────────────────────────────────────────
export interface Campaign extends FirestoreDoc {
  name: string;
  platform: string;           // google, facebook, linkedin, etc.
  status: "draft" | "active" | "paused" | "completed";
  budget: number;
  spent: number;
  clicks: number;
  impressions: number;
  conversions: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export type CampaignFormData = Omit<Campaign, keyof FirestoreDoc>;

// ─── Landing Page ────────────────────────────────────
export interface LandingPage extends FirestoreDoc {
  title: string;
  slug: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaEmail: string;
  bodyHtml: string;
  status: "draft" | "scheduled" | "published";
  views: number;
  conversions: number;
  images?: string[];
  attachments?: { name: string; url: string; type: string }[];
  scheduledAt?: string;        // ISO date — auto-publish at this time
  unpublishAt?: string;        // ISO date — auto-unpublish (sunset) at this time
}

export type LandingPageFormData = Omit<LandingPage, keyof FirestoreDoc>;

// ─── Forum Thread ────────────────────────────────────
/** Per-language translation of user-generated content */
export interface ContentTranslation {
  title?: string;              // threads & blog posts
  content: string;
  excerpt?: string;            // blog posts only
}

export interface ForumThread extends FirestoreDoc {
  title: string;
  author: string;
  authorId: string;            // Firebase Auth UID
  authorEmail: string;
  content: string;
  status: "open" | "closed" | "flagged";
  replies: number;
  likes: number;
  likedBy: string[];           // UIDs who liked
  tags: string[];
  images?: string[];          // uploaded image URLs
  links?: string[];            // external URLs
  lang?: string;               // original language code (e.g. "en", "es")
  translations?: Record<string, ContentTranslation>;
  scheduledAt?: string;        // ISO date — auto-publish at this time
  unpublishAt?: string;        // ISO date — auto-close at this time
}

// ─── Forum Reply ─────────────────────────────────────
export interface ForumReply extends FirestoreDoc {
  threadId: string;
  author: string;
  authorId: string;            // Firebase Auth UID
  authorEmail: string;
  content: string;             // plain text or simple HTML
  likes: number;
  likedBy: string[];           // UIDs who liked
  parentReplyId?: string;      // for nested replies (optional)
  lang?: string;               // original language code
  translations?: Record<string, ContentTranslation>;
}

// ─── Forum User Profile ──────────────────────────────
export interface ForumProfile extends FirestoreDoc {
  uid: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  country?: string;
  phone?: string;
  bio?: string;
  avatar?: string;             // URL
  postCount: number;
  joinedAt?: import("firebase/firestore").Timestamp;
}

// ─── AI Report ───────────────────────────────────────
export type AIReportType =
  | "daily"
  | "weekly"
  | "monthly"
  | "custom"
  | "competitor"
  | "seo"
  | "gap-analysis"
  | "performance"
  | "pipeline"
  | "marketing"
  | "operational"
  | "growth-forecast"
  | "keyword-health"
  | "landing-page-perf"
  | "booking-retention"
  | "blog-perf"
  | "forum-health"
  | "content-velocity"
  | "customer-ltv"
  | "lead-response"
  | "email-engagement"
  | "social-engagement"
  | "revenue-attribution";

export type AIReportCategory = "scheduled" | "on-demand" | "insight";

export interface AIReport extends FirestoreDoc {
  title: string;
  type: AIReportType;
  category?: AIReportCategory;
  summaryHtml: string;
  highlights: string[];
  recommendations: string[];
  score?: number;              // 0-100 health/performance score
  dataSources?: string[];      // collections used for this report
  area?: string;               // business area (sales, marketing, seo, etc.)
}

// ─── AI Insight (persistent feed) ────────────────────
export interface AIInsight extends FirestoreDoc {
  title: string;
  description: string;
  area: "sales" | "marketing" | "seo" | "operations" | "content" | "general";
  severity: "info" | "warning" | "critical" | "positive";
  pinned?: boolean;
  dismissed?: boolean;
  sourceReport?: string;       // ID of the report that generated it
}

// ─── AI Worker Task ──────────────────────────────────
export type AITaskType =
  | "blog-post"
  | "seo-audit"
  | "keyword-research"
  | "landing-page"
  | "weekly-report"
  | "daily-report"
  | "monthly-report"
  | "content-calendar"
  | "gap-analysis"
  | "competitor-insights"
  | "performance-deep-dive"
  | "pipeline-analysis"
  | "marketing-roi"
  | "operational-audit";

export interface AITask extends FirestoreDoc {
  type: AITaskType;
  label: string;
  status: "queued" | "running" | "completed" | "failed";
  prompt?: string;
  resultRef?: string;          // Firestore doc path of the created content
  resultSnapshot?: string;     // short summary of what was produced
  error?: string;
  durationMs?: number;
}
