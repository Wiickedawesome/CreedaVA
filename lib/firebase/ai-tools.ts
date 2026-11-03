/**
 * AI Tool Declarations — Gemini Function Calling
 *
 * Defines all tools the AI can invoke, organized by domain.
 * Each declaration follows Gemini's FunctionDeclaration schema
 * with name, description, and JSON Schema parameters.
 *
 * Risk levels:
 * - read-only: No side effects, auto-execute
 * - draft: Creates content in draft state, auto-execute
 * - auto: Executes immediately but low risk (tasks, forum)
 * - destructive: Requires user confirmation before execution
 */

import {
  SchemaType,
  type FunctionDeclaration,
  type FunctionDeclarationsTool,
} from "@google/generative-ai";

// ─── Risk Classification ─────────────────────────────

export type ToolRiskLevel = "read-only" | "draft" | "auto" | "destructive";

export interface ToolMeta {
  name: string;
  domain: string;
  risk: ToolRiskLevel;
}

/** Registry mapping tool name → risk metadata */
export const TOOL_REGISTRY: Record<string, ToolMeta> = {};

function registerTool(name: string, domain: string, risk: ToolRiskLevel) {
  TOOL_REGISTRY[name] = { name, domain, risk };
}

// ─── Calendar Tools ──────────────────────────────────

const calendarTools: FunctionDeclaration[] = [
  {
    name: "list_calendar_events",
    description:
      "List upcoming Google Calendar events for CreedaVA. Returns event summaries, times, attendees, and links. Use this when the user asks about upcoming meetings, schedules, or availability.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "get_available_slots",
    description:
      "Get available booking slots from Google Calendar. Shows times when no events are scheduled. Use when the user asks about availability or wants to schedule something.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        days: {
          type: SchemaType.INTEGER,
          description: "Number of days ahead to check (default: 7, max: 30)",
        },
      },
    },
  },
];

registerTool("list_calendar_events", "calendar", "read-only");
registerTool("get_available_slots", "calendar", "read-only");

// ─── Email Tools ─────────────────────────────────────

const emailTools: FunctionDeclaration[] = [
  {
    name: "read_inbox",
    description:
      "Fetch recent emails from the CreedaVA inbox. Returns sender, subject, preview text, and date. Use when the user asks about recent emails or wants to check messages.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        folder: {
          type: SchemaType.STRING,
          description: "Mail folder to read from (default: INBOX)",
        },
        limit: {
          type: SchemaType.INTEGER,
          description: "Max messages to return (default: 10, max: 50)",
        },
        filter: {
          type: SchemaType.STRING,
          description: "Filter criteria: 'unread', 'flagged', or search term",
        },
      },
    },
  },
  {
    name: "list_mailbox_folders",
    description:
      "List all mailbox folders/labels (Inbox, Sent, Drafts, etc.). Use when the user asks which folders exist.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "send_email",
    description:
      "Send an email from CreedaVA. DESTRUCTIVE: requires user confirmation before sending. Use when the user explicitly asks to send, reply to, or compose an email.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        to: {
          type: SchemaType.STRING,
          description: "Recipient email address",
        },
        subject: {
          type: SchemaType.STRING,
          description: "Email subject line",
        },
        html: {
          type: SchemaType.STRING,
          description: "Email body in HTML format",
        },
        replyTo: {
          type: SchemaType.STRING,
          description: "Reply-to email address (optional)",
        },
        cc: {
          type: SchemaType.STRING,
          description: "CC email addresses, comma-separated (optional)",
        },
      },
      required: ["to", "subject", "html"],
    },
  },
  {
    name: "send_bulk_email",
    description:
      "Send an email to multiple recipients. DESTRUCTIVE: requires user confirmation. Use when the user wants to send the same email to a list of people.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        recipients: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "List of recipient email addresses",
        },
        subject: {
          type: SchemaType.STRING,
          description: "Email subject line",
        },
        html: {
          type: SchemaType.STRING,
          description: "Email body in HTML format",
        },
      },
      required: ["recipients", "subject", "html"],
    },
  },
];

registerTool("read_inbox", "email", "read-only");
registerTool("list_mailbox_folders", "email", "read-only");
registerTool("send_email", "email", "destructive");
registerTool("send_bulk_email", "email", "destructive");

// ─── Forum Tools ─────────────────────────────────────

const forumTools: FunctionDeclaration[] = [
  {
    name: "list_forum_threads",
    description:
      "List forum threads from the CreedaVA community forum. Returns titles, authors, reply counts, and status. Supports filtering by status or tags.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: "Filter by status: 'open', 'closed', or 'flagged'",
        },
        limit: {
          type: SchemaType.INTEGER,
          description: "Max threads to return (default: 10)",
        },
      },
    },
  },
  {
    name: "create_forum_thread",
    description:
      "Create a new forum thread in the CreedaVA community. Auto-publishes immediately with SEO-optimized title and content. Use when the user asks to create a discussion topic.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "Thread title (SEO-optimized, 50-80 chars)",
        },
        content: {
          type: SchemaType.STRING,
          description: "Thread body content in HTML format with structured headings",
        },
        tags: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Topic tags (e.g., 'virtual-assistant', 'outsourcing', 'belize')",
        },
        lang: {
          type: SchemaType.STRING,
          description: "Language code: 'en' or 'es' (default: 'en')",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "reply_to_thread",
    description:
      "Post a reply to an existing forum thread. Auto-publishes immediately. Use when the user asks to respond to a forum discussion.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        threadId: {
          type: SchemaType.STRING,
          description: "The ID of the thread to reply to",
        },
        content: {
          type: SchemaType.STRING,
          description: "Reply content in plain text or simple HTML",
        },
      },
      required: ["threadId", "content"],
    },
  },
  {
    name: "flag_thread",
    description:
      "Flag a forum thread for moderation review. DESTRUCTIVE: requires confirmation. Changes thread status to 'flagged'.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        threadId: {
          type: SchemaType.STRING,
          description: "The ID of the thread to flag",
        },
        reason: {
          type: SchemaType.STRING,
          description: "Reason for flagging: 'spam', 'inappropriate', 'off-topic', or 'duplicate'",
        },
      },
      required: ["threadId", "reason"],
    },
  },
  {
    name: "close_thread",
    description:
      "Close a forum thread. DESTRUCTIVE: requires confirmation. Marks thread as resolved/closed.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        threadId: {
          type: SchemaType.STRING,
          description: "The ID of the thread to close",
        },
      },
      required: ["threadId"],
    },
  },
  {
    name: "translate_thread",
    description:
      "Translate a forum thread to the other language (EN↔ES). Creates a translation stored on the thread document.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        threadId: {
          type: SchemaType.STRING,
          description: "The ID of the thread to translate",
        },
        targetLang: {
          type: SchemaType.STRING,
          description: "Target language: 'en' or 'es'",
        },
      },
      required: ["threadId", "targetLang"],
    },
  },
];

registerTool("list_forum_threads", "forum", "read-only");
registerTool("create_forum_thread", "forum", "auto");
registerTool("reply_to_thread", "forum", "auto");
registerTool("flag_thread", "forum", "destructive");
registerTool("close_thread", "forum", "destructive");
registerTool("translate_thread", "forum", "auto");

// ─── Blog Tools ──────────────────────────────────────

const blogTools: FunctionDeclaration[] = [
  {
    name: "list_blog_posts",
    description:
      "List blog posts from CreedaVA's news section. Returns titles, slugs, tags, status, and publish dates.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: "Filter by status: 'draft' or 'published'",
        },
        limit: {
          type: SchemaType.INTEGER,
          description: "Max posts to return (default: 10)",
        },
      },
    },
  },
  {
    name: "create_blog_draft",
    description:
      "Create a new blog post as a draft. Does NOT publish — saves to Firestore with status 'draft'. Use when the user asks to write a blog post about a topic.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "Blog post title (SEO-optimized)",
        },
        slug: {
          type: SchemaType.STRING,
          description: "URL slug (lowercase, hyphenated, e.g., 'outsource-va-belize')",
        },
        content: {
          type: SchemaType.STRING,
          description: "Full blog post content in HTML format",
        },
        excerpt: {
          type: SchemaType.STRING,
          description: "Short excerpt/summary (150-200 chars)",
        },
        metaDescription: {
          type: SchemaType.STRING,
          description: "SEO meta description (150-160 chars)",
        },
        tags: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Content tags for categorization",
        },
        targetKeyword: {
          type: SchemaType.STRING,
          description: "Primary SEO keyword to target",
        },
      },
      required: ["title", "slug", "content", "excerpt", "metaDescription", "tags"],
    },
  },
  {
    name: "update_blog_post",
    description:
      "Update an existing blog post (draft or published). Modifies fields without changing publish status.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        postId: {
          type: SchemaType.STRING,
          description: "Firestore document ID of the blog post",
        },
        title: { type: SchemaType.STRING, description: "Updated title" },
        content: { type: SchemaType.STRING, description: "Updated HTML content" },
        excerpt: { type: SchemaType.STRING, description: "Updated excerpt" },
        metaDescription: { type: SchemaType.STRING, description: "Updated meta description" },
        tags: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Updated tags",
        },
      },
      required: ["postId"],
    },
  },
  {
    name: "publish_blog_post",
    description:
      "Publish a draft blog post. DESTRUCTIVE: requires user confirmation. Changes status to 'published' and sets publishedAt.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        postId: {
          type: SchemaType.STRING,
          description: "Firestore document ID of the blog post to publish",
        },
      },
      required: ["postId"],
    },
  },
];

registerTool("list_blog_posts", "blog", "read-only");
registerTool("create_blog_draft", "blog", "draft");
registerTool("update_blog_post", "blog", "draft");
registerTool("publish_blog_post", "blog", "destructive");

// ─── Landing Page Tools ──────────────────────────────

const landingPageTools: FunctionDeclaration[] = [
  {
    name: "list_landing_pages",
    description:
      "List all landing pages. Returns titles, slugs, status, views, and conversion counts.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: "Filter by status: 'draft' or 'published'",
        },
      },
    },
  },
  {
    name: "create_landing_page_draft",
    description:
      "Create a new landing page as a draft. Uses the CreedaVA design system for styling. Does NOT publish.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "LP title" },
        slug: {
          type: SchemaType.STRING,
          description: "URL slug (lowercase, hyphenated)",
        },
        headline: { type: SchemaType.STRING, description: "Hero headline" },
        subheadline: {
          type: SchemaType.STRING,
          description: "Supporting subheadline",
        },
        ctaText: {
          type: SchemaType.STRING,
          description: "Call-to-action button text",
        },
        ctaEmail: {
          type: SchemaType.STRING,
          description: "Email shown for CTA contact",
        },
        bodyHtml: {
          type: SchemaType.STRING,
          description: "Full page body in HTML using CreedaVA design system classes",
        },
      },
      required: ["title", "slug", "headline", "subheadline", "ctaText", "ctaEmail", "bodyHtml"],
    },
  },
  {
    name: "update_landing_page",
    description:
      "Update an existing landing page. Modifies fields without changing publish status.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        pageId: {
          type: SchemaType.STRING,
          description: "Firestore document ID of the landing page",
        },
        headline: { type: SchemaType.STRING, description: "Updated headline" },
        subheadline: { type: SchemaType.STRING, description: "Updated subheadline" },
        bodyHtml: { type: SchemaType.STRING, description: "Updated body HTML" },
        ctaText: { type: SchemaType.STRING, description: "Updated CTA text" },
      },
      required: ["pageId"],
    },
  },
];

registerTool("list_landing_pages", "landing-pages", "read-only");
registerTool("create_landing_page_draft", "landing-pages", "draft");
registerTool("update_landing_page", "landing-pages", "draft");

// ─── CRM Tools ───────────────────────────────────────

const crmTools: FunctionDeclaration[] = [
  {
    name: "search_leads",
    description:
      "Search leads in the CRM by status, source, or name. Returns lead details with contact info and deal values.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: "Filter by CRM status: 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'",
        },
        source: {
          type: SchemaType.STRING,
          description: "Filter by lead source: 'website', 'referral', 'social', 'ad'",
        },
        limit: {
          type: SchemaType.INTEGER,
          description: "Max results (default: 20)",
        },
      },
    },
  },
  {
    name: "search_customers",
    description:
      "Search active customers. Returns customer details with plan, monthly value, and satisfaction scores.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: "Filter: 'active', 'inactive', or 'churned'",
        },
        limit: {
          type: SchemaType.INTEGER,
          description: "Max results (default: 20)",
        },
      },
    },
  },
  {
    name: "get_lead_details",
    description:
      "Get full details of a specific lead by ID, including notes and history.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        leadId: {
          type: SchemaType.STRING,
          description: "Firestore document ID of the lead",
        },
      },
      required: ["leadId"],
    },
  },
  {
    name: "create_task",
    description:
      "Create a new task in the CRM. Auto-executes (low risk). Use when the user asks to create a to-do, reminder, or follow-up task.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "Task title",
        },
        description: {
          type: SchemaType.STRING,
          description: "Task description with details",
        },
        priority: {
          type: SchemaType.STRING,
          description: "Priority: 'low', 'medium', 'high', or 'urgent'",
        },
        dueDate: {
          type: SchemaType.STRING,
          description: "Due date in ISO format (YYYY-MM-DD)",
        },
        projectId: {
          type: SchemaType.STRING,
          description: "Optional project ID to associate with",
        },
      },
      required: ["title", "priority"],
    },
  },
  {
    name: "update_lead_status",
    description:
      "Update the status of a lead in the pipeline. Auto-executes.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        leadId: {
          type: SchemaType.STRING,
          description: "Firestore document ID of the lead",
        },
        status: {
          type: SchemaType.STRING,
          description: "New status: 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'",
        },
        notes: {
          type: SchemaType.STRING,
          description: "Optional note about the status change",
        },
      },
      required: ["leadId", "status"],
    },
  },
];

registerTool("search_leads", "crm", "read-only");
registerTool("search_customers", "crm", "read-only");
registerTool("get_lead_details", "crm", "read-only");
registerTool("create_task", "crm", "auto");
registerTool("update_lead_status", "crm", "auto");

// ─── SEO Tools ───────────────────────────────────────

const seoTools: FunctionDeclaration[] = [
  {
    name: "run_seo_audit",
    description:
      "Run a full SEO audit on a URL or the entire CreedaVA site. Returns scoring, issues, and recommendations.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        url: {
          type: SchemaType.STRING,
          description: "Specific URL to audit (optional — audits entire site if omitted)",
        },
      },
    },
  },
  {
    name: "generate_page_seo",
    description:
      "Generate SEO metadata (title, description, keywords) for a page. Saves as draft to page-seo collection.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        pagePath: {
          type: SchemaType.STRING,
          description: "The route path to generate SEO for (e.g., '/services', '/about')",
        },
      },
      required: ["pagePath"],
    },
  },
  {
    name: "fetch_search_console_data",
    description:
      "Fetch Google Search Console performance data. Returns top queries, pages, clicks, impressions, CTR, and positions.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        days: {
          type: SchemaType.INTEGER,
          description: "Number of days of data to fetch (default: 28, max: 90)",
        },
      },
    },
  },
  {
    name: "suggest_keywords",
    description:
      "Use AI to suggest target keywords for a topic or page. Returns keyword ideas with search intent and difficulty.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        topic: {
          type: SchemaType.STRING,
          description: "Topic or seed keyword to generate suggestions for",
        },
        count: {
          type: SchemaType.INTEGER,
          description: "Number of keywords to suggest (default: 10)",
        },
      },
      required: ["topic"],
    },
  },
];

registerTool("run_seo_audit", "seo", "draft");
registerTool("generate_page_seo", "seo", "draft");
registerTool("fetch_search_console_data", "seo", "read-only");
registerTool("suggest_keywords", "seo", "read-only");

// ─── Web Search & Market Intel Tools ─────────────────

const webSearchTools: FunctionDeclaration[] = [
  {
    name: "web_search",
    description:
      "Search the web for real-time information. Use when you need current data, market trends, competitor info, or facts to support your analysis.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Search query string",
        },
        numResults: {
          type: SchemaType.INTEGER,
          description: "Number of results (default: 5, max: 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "competitor_search",
    description:
      "Search for competitor news, updates, and strategies. Returns organized results per competitor.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        competitor: {
          type: SchemaType.STRING,
          description: "Specific competitor name to research (optional — searches all known competitors if omitted)",
        },
      },
    },
  },
  {
    name: "industry_trends",
    description:
      "Get latest VA industry trends and news. Returns trend articles and keyword opportunities.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
];

registerTool("web_search", "web-search", "read-only");
registerTool("competitor_search", "web-search", "read-only");
registerTool("industry_trends", "web-search", "read-only");

// ─── Analytics Tools ─────────────────────────────────

const analyticsTools: FunctionDeclaration[] = [
  {
    name: "fetch_analytics_report",
    description:
      "Fetch a Google Analytics (GA4) report with traffic data, top pages, session metrics, and traffic sources.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        days: {
          type: SchemaType.INTEGER,
          description: "Number of days to report on (default: 30, max: 90)",
        },
      },
    },
  },
  {
    name: "fetch_realtime_analytics",
    description:
      "Fetch real-time Google Analytics data showing current active users and top pages right now.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
];

registerTool("fetch_analytics_report", "analytics", "read-only");
registerTool("fetch_realtime_analytics", "analytics", "read-only");

// ─── Combined Tool Set ───────────────────────────────

/** All tool declarations combined for Gemini */
export const ALL_TOOLS: FunctionDeclarationsTool = {
  functionDeclarations: [
    ...calendarTools,
    ...emailTools,
    ...forumTools,
    ...blogTools,
    ...landingPageTools,
    ...crmTools,
    ...seoTools,
    ...webSearchTools,
    ...analyticsTools,
  ],
};

/** Get tool declarations for specific domains only */
export function getToolsForDomains(
  domains: string[],
): FunctionDeclarationsTool {
  const domainSet = new Set(domains);
  const filtered = Object.values(TOOL_REGISTRY)
    .filter((t) => domainSet.has(t.domain))
    .map((t) => t.name);
  const nameSet = new Set(filtered);
  return {
    functionDeclarations: ALL_TOOLS.functionDeclarations?.filter((d) =>
      nameSet.has(d.name),
    ),
  };
}

/** Get all tool names grouped by risk level */
export function getToolsByRisk(): Record<ToolRiskLevel, string[]> {
  const result: Record<ToolRiskLevel, string[]> = {
    "read-only": [],
    draft: [],
    auto: [],
    destructive: [],
  };
  for (const meta of Object.values(TOOL_REGISTRY)) {
    result[meta.risk].push(meta.name);
  }
  return result;
}

/** Check if a tool requires user confirmation */
export function requiresConfirmation(toolName: string): boolean {
  const meta = TOOL_REGISTRY[toolName];
  return meta?.risk === "destructive";
}
