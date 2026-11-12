/**
 * Firestore Schema — missing collection types.
 *
 * Collections already typed elsewhere:
 *   blog            → BlogPost        (lib/types/content.ts)
 *   leads           → Lead            (lib/types/crm.ts)
 *   contacts        → Contact         (lib/types/crm.ts)
 *   customers       → Customer        (lib/types/crm.ts)
 *   bookings        → Booking         (lib/types/crm.ts)
 *   notes           → (see below)
 *   seo             → SEOAudit        (lib/types/content.ts)
 *   keywords        → SEOKeyword      (lib/types/content.ts)
 *   emails          → EmailDraft      (lib/types/content.ts)
 *   email-campaigns → EmailCampaign   (lib/types/content.ts)
 *   campaigns       → Campaign        (lib/types/content.ts — same as EmailCampaign? audit needed)
 *   landing-pages   → LandingPage     (lib/types/content.ts)
 *   forum           → ForumThread     (lib/types/content.ts)
 *   forumReplies    → ForumReply      (lib/types/content.ts)
 *   forumProfiles   → ForumProfile    (lib/types/content.ts)
 *   reports         → AIReport        (lib/types/content.ts)
 *   ai-tasks        → AITask          (lib/types/content.ts)
 *   ai-insights     → AIInsight       (lib/types/content.ts)
 *   ai-conversations→ AIConversation  (lib/types/ai.ts)
 *   page-seo        → PageSEO         (lib/types/content.ts)
 *   inbox           → InboxMessage    (lib/types/content.ts)
 */

import type { FirestoreDoc } from "./crm";

// ─── Contact Submissions (Legacy) ───────────────────
// Collection: contact-submissions
// Deprecated: canonical intake now writes to /contacts via Cloud Function.

export interface ContactSubmission extends FirestoreDoc {
  /** Full name (first + last concatenated) */
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  /** Page or campaign this came from */
  source?: string;
  /** Whether an admin has read/actioned this */
  read?: boolean;
  /** Linked to a lead document if converted */
  leadId?: string;
}

// ─── Analytics Events ────────────────────────────────
// Collection: analytics
// Public create (App Check protected), admin read.

export interface AnalyticsEventDoc extends FirestoreDoc {
  /** GA4-style event name e.g. "page_view", "button_click", "form_submission" */
  event?: string;
  /** Normalised page path e.g. "/services" */
  page?: string;
  /** Broad event category e.g. "engagement", "conversion" */
  type?: string;
  sessionId?: string;
  country?: string;
  countryName?: string;
  region?: string;
  city?: string;
  timezone?: string;
  referrer?: string;
  /** Truncated UA string */
  userAgent?: string;
  /** Freeform key-value payload (max 15 fields total including above) */
  eventData?: Record<string, string | number | boolean>;
}

// ─── Satisfaction Tokens ─────────────────────────────
// Collection: satisfaction-tokens
// Doc ID IS the token UUID — no enumeration needed.
// Public read (UUID-as-auth), admin create/update/delete.

export interface SatisfactionToken extends FirestoreDoc {
  /** Firestore doc ID is the token UUID (= the one-time survey link key) */
  customerId: string;
  customerEmail: string;
  customerName?: string;
  /** Whether the survey has been submitted */
  used: boolean;
  /** ISO date — token becomes invalid after this */
  expiresAt?: string;
  /** Average satisfaction score 1–5, written on submission */
  averageRating?: number;
  /** Per-question ratings written on submission */
  ratings?: Record<string, number>;
  comment?: string;
  submittedAt?: string;
}

// ─── Notes ───────────────────────────────────────────
// Collection: notes  (admin only — cross-entity notes)

export interface Note extends FirestoreDoc {
  /** Text or HTML content */
  content: string;
  /** Which entity this note belongs to */
  entityType: "lead" | "contact" | "customer" | "booking" | "project";
  entityId: string;
  /** Display shortcut: name of the entity */
  entityName?: string;
  /** Firebase Auth UID of author */
  authorId?: string;
  authorEmail?: string;
  pinned?: boolean;
}

// ─── Settings ────────────────────────────────────────
// Collection: settings  (admin only, doc ID = setting key)
// Each document is a key-value config bag — no strict schema.

export interface SettingsDoc extends FirestoreDoc {
  /** Arbitrary settings payload */
  [key: string]: unknown;
}

// ─── Integrations ────────────────────────────────────
// Collection: integrations  (admin only, doc ID = provider slug)
// e.g. integrations/email, integrations/google-calendar, etc.

export interface IntegrationDoc extends FirestoreDoc {
  enabled: boolean;
  /** Provider name for display */
  displayName?: string;
  /** Last successful sync timestamp */
  lastSyncAt?: string;
  /** Freeform config — contents depend on provider */
  config: Record<string, string | number | boolean>;
  /** Human-readable status message */
  statusMessage?: string;
}

// ─── Canonical Collection → Type Map ─────────────────
// Single source of truth: collection name → TypeScript interface.
// Use this to keep code and rules in sync.

export const COLLECTION_MAP = {
  // Content
  "blog":              "BlogPost",
  "page-seo":          "PageSEO",
  "keywords":          "SEOKeyword",
  "seo":               "SEOAudit",
  "emails":            "EmailDraft",
  "email-campaigns":   "EmailCampaign",
  "campaigns":         "Campaign /* TODO: confirm distinct from email-campaigns */",
  "landing-pages":     "LandingPage",

  // Forum
  "forum":             "ForumThread",
  "forumReplies":      "ForumReply",
  "forumProfiles":     "ForumProfile",

  // CRM
  "leads":             "Lead",
  "contacts":          "Contact",
  "customers":         "Customer",
  "bookings":          "Booking",
  "notes":             "Note",

  // Public intake (legacy)
  "contact-submissions": "ContactSubmission (legacy/deprecated)",
  "analytics":           "AnalyticsEventDoc",
  "satisfaction-tokens": "SatisfactionToken",

  // AI
  "reports":           "AIReport",
  "ai-tasks":          "AITask",
  "ai-insights":       "AIInsight",
  "ai-conversations":  "AIConversation",
  "ai-activity-log":   "AuditLogEntry (lib/firebase/ai-autonomy.ts)",

  // Config
  "settings":          "SettingsDoc",
  "integrations":      "IntegrationDoc",
  "inbox":             "InboxMessage",
} as const;

export type CollectionName = keyof typeof COLLECTION_MAP;
