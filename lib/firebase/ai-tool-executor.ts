/**
 * AI Tool Executor — Maps Gemini function calls to real implementations
 *
 * Receives FunctionCall objects from Gemini, executes the corresponding
 * cloud function / Firestore operation, and returns FunctionResponse objects.
 *
 * Respects autonomy rules: destructive actions return a pending confirmation
 * instead of executing immediately.
 */

import type { FunctionCall } from "@google/generative-ai";
import {
  evaluateAction,
  logToolInvocation,
  buildAuditEntry,
  type ActionRequest,
} from "./ai-autonomy";

// ─── Types ───────────────────────────────────────────

export interface ToolExecutionResult {
  /** The tool name that was executed */
  name: string;
  /** The response data to feed back to Gemini */
  response: Record<string, unknown>;
  /** Whether this was auto-executed or needs confirmation */
  requiresConfirmation: boolean;
  /** Human-readable impact summary (for destructive actions) */
  impactSummary?: string;
}

export interface PendingAction {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  impactSummary: string;
  conversationId?: string;
  createdAt: Date;
}

// ─── Executor Registry ───────────────────────────────

type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

const handlers: Record<string, ToolHandler> = {};

function registerHandler(name: string, handler: ToolHandler) {
  handlers[name] = handler;
}

// ─── Calendar Handlers ───────────────────────────────

registerHandler("list_calendar_events", async () => {
  const { cloudListCalendarEvents } = await import("./cloud-functions");
  const events = await cloudListCalendarEvents();
  return { success: true, events, count: events.length };
});

registerHandler("get_available_slots", async (args) => {
  // Calendar events don't have a dedicated "slots" endpoint —
  // we fetch events and the AI infers availability from gaps
  const { cloudListCalendarEvents } = await import("./cloud-functions");
  const events = await cloudListCalendarEvents();
  return {
    success: true,
    events,
    count: events.length,
    hint: "Available slots are times with no events. Analyze gaps between events.",
    daysRequested: args.days ?? 7,
  };
});

// ─── Email Handlers ──────────────────────────────────

registerHandler("read_inbox", async (args) => {
  const { cloudFetchInbox } = await import("./cloud-functions");
  const result = await cloudFetchInbox({
    folder: args.folder as string | undefined,
    limit: args.limit as number | undefined,
    filter: args.filter as string | undefined,
  });
  return {
    success: result.success,
    messages: result.messages,
    total: result.total,
    folder: result.folder,
  };
});

registerHandler("list_mailbox_folders", async () => {
  const { cloudListMailboxFolders } = await import("./cloud-functions");
  const folders = await cloudListMailboxFolders();
  return { success: true, folders };
});

registerHandler("send_email", async (args) => {
  const { cloudSendEmail } = await import("./cloud-functions");
  const result = await cloudSendEmail({
    to: args.to as string,
    subject: args.subject as string,
    html: args.html as string,
    replyTo: args.replyTo as string | undefined,
    cc: args.cc as string | undefined,
  });
  return { success: result.success, messageId: result.messageId };
});

registerHandler("send_bulk_email", async (args) => {
  const { cloudSendBulkEmail } = await import("./cloud-functions");
  const result = await cloudSendBulkEmail({
    recipients: args.recipients as string[],
    subject: args.subject as string,
    html: args.html as string,
  });
  return {
    success: result.success,
    sent: result.sent,
    failed: result.failed,
    details: result.details,
  };
});

// ─── Forum Handlers ──────────────────────────────────

registerHandler("list_forum_threads", async (args) => {
  const { fetchAll } = await import("./firestore");
  const { where, orderBy, limit: limitFn } = await import("firebase/firestore");

  const constraints = [];
  if (args.status) constraints.push(where("status", "==", args.status));
  constraints.push(orderBy("createdAt", "desc"));
  if (args.limit) constraints.push(limitFn(args.limit as number));
  else constraints.push(limitFn(10));

  const threads = await fetchAll("forum", ...constraints);
  return {
    success: true,
    threads: threads.map((t) => ({
      id: t.id,
      title: (t as Record<string, unknown>).title,
      author: (t as Record<string, unknown>).author,
      status: (t as Record<string, unknown>).status,
      replies: (t as Record<string, unknown>).replies ?? 0,
      likes: (t as Record<string, unknown>).likes ?? 0,
      tags: (t as Record<string, unknown>).tags ?? [],
      createdAt: (t as Record<string, unknown>).createdAt,
    })),
    count: threads.length,
  };
});

registerHandler("create_forum_thread", async (args) => {
  const { create } = await import("./firestore");
  const { auth } = await import("./config");

  const user = auth.currentUser;
  const threadData = {
    title: args.title as string,
    content: args.content as string,
    tags: (args.tags as string[]) ?? [],
    lang: (args.lang as string) ?? "en",
    author: user?.displayName ?? "CreedaVA AI",
    authorId: user?.uid ?? "ai-agent",
    authorEmail: user?.email ?? "ai@creedava.com",
    status: "open",
    replies: 0,
    likes: 0,
    likedBy: [],
    images: [],
    links: [],
  };

  const id = await create("forum", threadData);
  return { success: true, threadId: id, title: args.title };
});

registerHandler("reply_to_thread", async (args) => {
  const { create, update, fetchOne } = await import("./firestore");
  const { auth } = await import("./config");

  const user = auth.currentUser;
  const replyData = {
    threadId: args.threadId as string,
    content: args.content as string,
    author: user?.displayName ?? "CreedaVA AI",
    authorId: user?.uid ?? "ai-agent",
    authorEmail: user?.email ?? "ai@creedava.com",
    likes: 0,
    likedBy: [],
  };

  const replyId = await create("forumReplies", replyData);

  // Increment reply count on the thread
  const thread = await fetchOne("forum", args.threadId as string);
  if (thread) {
    await update("forum", args.threadId as string, {
      replies: ((thread as Record<string, unknown>).replies as number ?? 0) + 1,
    });
  }

  return { success: true, replyId, threadId: args.threadId };
});

registerHandler("flag_thread", async (args) => {
  const { update } = await import("./firestore");
  await update("forum", args.threadId as string, {
    status: "flagged",
    flagReason: args.reason,
  });
  return { success: true, threadId: args.threadId, newStatus: "flagged" };
});

registerHandler("close_thread", async (args) => {
  const { update } = await import("./firestore");
  await update("forum", args.threadId as string, { status: "closed" });
  return { success: true, threadId: args.threadId, newStatus: "closed" };
});

registerHandler("translate_thread", async (args) => {
  const { fetchOne, update } = await import("./firestore");
  const { translateThread } = await import("./translate");

  const thread = await fetchOne("forum", args.threadId as string);
  if (!thread) return { success: false, error: "Thread not found" };

  const threadData = thread as Record<string, unknown>;
  const title = threadData.title as string;
  const content = threadData.content as string;
  const sourceLang = (args.targetLang as string) === "es" ? "en" : "es";

  const translations = await translateThread(title, content, sourceLang);

  await update("forum", args.threadId as string, { translations });

  return {
    success: true,
    threadId: args.threadId,
    translatedLanguages: Object.keys(translations),
  };
});

// ─── Blog Handlers ───────────────────────────────────

registerHandler("list_blog_posts", async (args) => {
  const { fetchAll } = await import("./firestore");
  const { where, orderBy, limit: limitFn } = await import("firebase/firestore");

  const constraints = [];
  if (args.status) constraints.push(where("status", "==", args.status));
  constraints.push(orderBy("createdAt", "desc"));
  if (args.limit) constraints.push(limitFn(args.limit as number));
  else constraints.push(limitFn(10));

  const posts = await fetchAll("blog", ...constraints);
  return {
    success: true,
    posts: posts.map((p) => ({
      id: p.id,
      title: (p as Record<string, unknown>).title,
      slug: (p as Record<string, unknown>).slug,
      status: (p as Record<string, unknown>).status,
      tags: (p as Record<string, unknown>).tags ?? [],
      publishedAt: (p as Record<string, unknown>).publishedAt,
      createdAt: (p as Record<string, unknown>).createdAt,
    })),
    count: posts.length,
  };
});

registerHandler("create_blog_draft", async (args) => {
  const { create } = await import("./firestore");

  const postData = {
    title: args.title as string,
    slug: args.slug as string,
    content: args.content as string,
    excerpt: args.excerpt as string,
    metaDescription: args.metaDescription as string,
    tags: (args.tags as string[]) ?? [],
    status: "draft",
    author: "CreedaVA AI",
    featuredImage: "",
    images: [],
    attachments: [],
    lang: "en",
  };

  const id = await create("blog", postData);
  return { success: true, postId: id, title: args.title, status: "draft" };
});

registerHandler("update_blog_post", async (args) => {
  const { update } = await import("./firestore");

  const updateData: Record<string, unknown> = {};
  if (args.title) updateData.title = args.title;
  if (args.content) updateData.content = args.content;
  if (args.excerpt) updateData.excerpt = args.excerpt;
  if (args.metaDescription) updateData.metaDescription = args.metaDescription;
  if (args.tags) updateData.tags = args.tags;

  await update("blog", args.postId as string, updateData);
  return { success: true, postId: args.postId, fieldsUpdated: Object.keys(updateData) };
});

registerHandler("publish_blog_post", async (args) => {
  const { update } = await import("./firestore");
  await update("blog", args.postId as string, {
    status: "published",
    publishedAt: new Date().toISOString(),
  });
  return { success: true, postId: args.postId, status: "published" };
});

// ─── Landing Page Handlers ───────────────────────────

registerHandler("list_landing_pages", async (args) => {
  const { fetchAll } = await import("./firestore");
  const { where, orderBy } = await import("firebase/firestore");

  const constraints = [];
  if (args.status) constraints.push(where("status", "==", args.status));
  constraints.push(orderBy("createdAt", "desc"));

  const pages = await fetchAll("landing-pages", ...constraints);
  return {
    success: true,
    pages: pages.map((p) => ({
      id: p.id,
      title: (p as Record<string, unknown>).title,
      slug: (p as Record<string, unknown>).slug,
      status: (p as Record<string, unknown>).status,
      views: (p as Record<string, unknown>).views ?? 0,
      conversions: (p as Record<string, unknown>).conversions ?? 0,
    })),
    count: pages.length,
  };
});

registerHandler("create_landing_page_draft", async (args) => {
  const { create } = await import("./firestore");

  const pageData = {
    title: args.title as string,
    slug: args.slug as string,
    headline: args.headline as string,
    subheadline: args.subheadline as string,
    ctaText: args.ctaText as string,
    ctaEmail: args.ctaEmail as string,
    bodyHtml: args.bodyHtml as string,
    status: "draft",
    views: 0,
    conversions: 0,
    images: [],
    attachments: [],
  };

  const id = await create("landing-pages", pageData);
  return { success: true, pageId: id, title: args.title, status: "draft" };
});

registerHandler("update_landing_page", async (args) => {
  const { update } = await import("./firestore");

  const updateData: Record<string, unknown> = {};
  if (args.headline) updateData.headline = args.headline;
  if (args.subheadline) updateData.subheadline = args.subheadline;
  if (args.bodyHtml) updateData.bodyHtml = args.bodyHtml;
  if (args.ctaText) updateData.ctaText = args.ctaText;

  await update("landing-pages", args.pageId as string, updateData);
  return { success: true, pageId: args.pageId, fieldsUpdated: Object.keys(updateData) };
});

// ─── CRM Handlers ────────────────────────────────────

registerHandler("search_leads", async (args) => {
  const { fetchAll } = await import("./firestore");
  const { where, orderBy, limit: limitFn } = await import("firebase/firestore");

  const constraints = [];
  if (args.status) constraints.push(where("status", "==", args.status));
  if (args.source) constraints.push(where("source", "==", args.source));
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limitFn((args.limit as number) ?? 20));

  const leads = await fetchAll("leads", ...constraints);
  return {
    success: true,
    leads: leads.map((l) => ({
      id: l.id,
      name: (l as Record<string, unknown>).name,
      email: (l as Record<string, unknown>).email,
      company: (l as Record<string, unknown>).company,
      status: (l as Record<string, unknown>).status,
      source: (l as Record<string, unknown>).source,
      value: (l as Record<string, unknown>).value ?? 0,
      createdAt: (l as Record<string, unknown>).createdAt,
    })),
    count: leads.length,
  };
});

registerHandler("search_customers", async (args) => {
  const { fetchAll } = await import("./firestore");
  const { where, orderBy, limit: limitFn } = await import("firebase/firestore");

  const constraints = [];
  if (args.status) constraints.push(where("status", "==", args.status));
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limitFn((args.limit as number) ?? 20));

  const customers = await fetchAll("customers", ...constraints);
  return {
    success: true,
    customers: customers.map((c) => ({
      id: c.id,
      name: (c as Record<string, unknown>).name,
      email: (c as Record<string, unknown>).email,
      company: (c as Record<string, unknown>).company,
      plan: (c as Record<string, unknown>).plan,
      monthlyValue: (c as Record<string, unknown>).monthlyValue ?? 0,
      satisfaction: (c as Record<string, unknown>).satisfaction,
      status: (c as Record<string, unknown>).status,
    })),
    count: customers.length,
  };
});

registerHandler("get_lead_details", async (args) => {
  const { fetchOne } = await import("./firestore");
  const lead = await fetchOne("leads", args.leadId as string);
  if (!lead) return { success: false, error: "Lead not found" };
  return { success: true, lead };
});

registerHandler("update_lead_status", async (args) => {
  const { update } = await import("./firestore");

  const updateData: Record<string, unknown> = {
    status: args.status,
  };
  if (args.notes) updateData.notes = args.notes;

  await update("leads", args.leadId as string, updateData);
  return {
    success: true,
    leadId: args.leadId,
    newStatus: args.status,
  };
});

// ─── SEO Handlers ────────────────────────────────────

registerHandler("run_seo_audit", async (args) => {
  const { analyzeSEO } = await import("./ai");
  const result = await analyzeSEO((args.url as string) ?? "https://creedava.com");
  return { success: true, audit: result };
});

registerHandler("generate_page_seo", async (args) => {
  const { generatePageSEO } = await import("./ai-engine");
  const pageContent = (args.pageContent as string) ?? "";
  const seo = await generatePageSEO(args.pagePath as string, pageContent);
  return { success: true, seo, pagePath: args.pagePath };
});

registerHandler("fetch_search_console_data", async (args) => {
  const { cloudFetchSearchConsoleData } = await import("./cloud-functions");
  const result = await cloudFetchSearchConsoleData(
    (args.days as number) ?? 28,
  );
  return result as unknown as Record<string, unknown>;
});

registerHandler("suggest_keywords", async (args) => {
  const { suggestKeywords } = await import("./ai");
  const keywords = await suggestKeywords(
    args.topic as string,
    (args.count as number) ?? 10,
  );
  return { success: true, keywords, topic: args.topic };
});

// ─── Web Search & Market Intel Handlers ──────────────

registerHandler("web_search", async (args) => {
  const { cloudWebSearch } = await import("./cloud-functions");
  const result = await cloudWebSearch(
    args.query as string,
    (args.numResults as number) ?? 5,
  );
  return result as unknown as Record<string, unknown>;
});

registerHandler("competitor_search", async (args) => {
  const { cloudCompetitorSearch } = await import("./cloud-functions");
  const result = await cloudCompetitorSearch(args.competitor as string);
  return result as unknown as Record<string, unknown>;
});

registerHandler("industry_trends", async () => {
  const { cloudIndustryTrends } = await import("./cloud-functions");
  const result = await cloudIndustryTrends();
  return result as unknown as Record<string, unknown>;
});

// ─── Analytics Handlers ──────────────────────────────

registerHandler("fetch_analytics_report", async (args) => {
  const { cloudFetchAnalyticsReport } = await import("./cloud-functions");
  const result = await cloudFetchAnalyticsReport(
    (args.days as number) ?? 30,
  );
  return result as unknown as Record<string, unknown>;
});

registerHandler("fetch_realtime_analytics", async () => {
  const { cloudFetchRealtimeAnalytics } = await import("./cloud-functions");
  const result = await cloudFetchRealtimeAnalytics();
  return result as unknown as Record<string, unknown>;
});

// ─── Main Executor ───────────────────────────────────

/** Firestore collection for persisting pending actions (survives restarts) */
const PENDING_ACTIONS_COLLECTION = "ai-pending-actions";
/** Pending actions expire after 30 minutes */
const PENDING_ACTION_TTL_MS = 30 * 60 * 1000;

/**
 * Execute a Gemini function call.
 *
 * For auto-execute tools: runs the handler immediately and returns the result.
 * For destructive tools: returns a confirmation request instead of executing.
 */
export async function executeTool(
  functionCall: FunctionCall,
  conversationId?: string,
): Promise<ToolExecutionResult> {
  const { name, args } = functionCall;
  const handler = handlers[name];

  if (!handler) {
    return {
      name,
      response: { success: false, error: `Unknown tool: ${name}` },
      requiresConfirmation: false,
    };
  }

  const request: ActionRequest = {
    toolName: name,
    args: (args as Record<string, unknown>) ?? {},
    conversationId,
  };

  const decision = evaluateAction(request);

  // Destructive actions need confirmation
  if (decision.decision === "confirm") {
    const actionId = `${name}_${Date.now()}`;
    const { createWithId } = await import("./firestore");
    await createWithId(PENDING_ACTIONS_COLLECTION, actionId, {
      toolName: name,
      args: (args as Record<string, unknown>) ?? {},
      impactSummary: decision.impactSummary ?? `Execute ${name}`,
      conversationId: conversationId ?? null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + PENDING_ACTION_TTL_MS).toISOString(),
    });

    return {
      name,
      response: {
        status: "pending_confirmation",
        actionId,
        impactSummary: decision.impactSummary,
        message: "This action requires user confirmation before executing.",
      },
      requiresConfirmation: true,
      impactSummary: decision.impactSummary,
    };
  }

  // Denied actions
  if (decision.decision === "deny") {
    return {
      name,
      response: { success: false, error: decision.reason },
      requiresConfirmation: false,
    };
  }

  // Auto-execute
  try {
    const result = await handler(request.args);

    // Validate result shape
    if (
      result === null ||
      result === undefined ||
      typeof result !== "object" ||
      !("success" in result)
    ) {
      console.warn(
        `[AI Tool Executor] Tool "${name}" returned invalid result shape (missing 'success' field):`,
        result,
      );
    }

    // Log to audit trail (fire and forget)
    const auditEntry = buildAuditEntry(request, "auto-execute", result);
    logToolInvocation(auditEntry).catch(() => {});

    return {
      name,
      response: result,
      requiresConfirmation: false,
    };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Unknown error";

    // Log failure
    const auditEntry = buildAuditEntry(
      request,
      "auto-execute",
      undefined,
      errorMsg,
    );
    logToolInvocation(auditEntry).catch(() => {});

    return {
      name,
      response: { success: false, error: errorMsg },
      requiresConfirmation: false,
    };
  }
}

/**
 * Confirm and execute a pending destructive action.
 * Reads from Firestore so pending actions survive server restarts.
 */
export async function confirmAction(
  actionId: string,
): Promise<ToolExecutionResult> {
  const { fetchOne, remove } = await import("./firestore");
  const actionDoc = await fetchOne(PENDING_ACTIONS_COLLECTION, actionId) as (Record<string, unknown> & { id: string }) | null;

  if (!actionDoc) {
    return {
      name: "unknown",
      response: {
        success: false,
        error: "Action not found or expired",
      },
      requiresConfirmation: false,
    };
  }

  const toolName = actionDoc.toolName as string;
  const args = actionDoc.args as Record<string, unknown>;
  const conversationId = actionDoc.conversationId as string | undefined;

  // Remove from Firestore
  await remove(PENDING_ACTIONS_COLLECTION, actionDoc.id);

  const handler = handlers[toolName];
  if (!handler) {
    return {
      name: toolName,
      response: { success: false, error: `Handler not found: ${toolName}` },
      requiresConfirmation: false,
    };
  }

  try {
    const result = await handler(args);

    // Validate result shape
    if (
      result === null ||
      result === undefined ||
      typeof result !== "object" ||
      !("success" in result)
    ) {
      console.warn(
        `[AI Tool Executor] Confirmed tool "${toolName}" returned invalid result shape:`,
        result,
      );
    }

    const auditEntry = buildAuditEntry(
      { toolName, args, conversationId },
      "auto-execute",
      result,
      undefined,
      true,
    );
    logToolInvocation(auditEntry).catch(() => {});

    return {
      name: toolName,
      response: result,
      requiresConfirmation: false,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return {
      name: toolName,
      response: { success: false, error: errorMsg },
      requiresConfirmation: false,
    };
  }
}

/**
 * Reject a pending destructive action.
 */
export async function rejectAction(actionId: string): Promise<ToolExecutionResult> {
  const { fetchOne, remove } = await import("./firestore");
  const actionDoc = await fetchOne(PENDING_ACTIONS_COLLECTION, actionId) as (Record<string, unknown> & { id: string }) | null;

  if (actionDoc) {
    await remove(PENDING_ACTIONS_COLLECTION, actionDoc.id);
  }

  const toolName = (actionDoc?.toolName as string) ?? "unknown";
  const args = (actionDoc?.args as Record<string, unknown>) ?? {};
  const conversationId = actionDoc?.conversationId as string | undefined;

  const auditEntry = buildAuditEntry(
    { toolName, args, conversationId },
    "deny",
    undefined,
    "User rejected action",
    false,
  );
  logToolInvocation(auditEntry).catch(() => {});

  return {
    name: toolName,
    response: {
      success: false,
      status: "rejected",
      message: "Action was rejected by the user.",
    },
    requiresConfirmation: false,
  };
}

/** Get all non-expired pending actions */
export async function getPendingActions(): Promise<PendingAction[]> {
  const { fetchAll } = await import("./firestore");
  const docs = await fetchAll(PENDING_ACTIONS_COLLECTION);
  const now = Date.now();
  return docs
    .filter((d) => {
      const expires = (d as Record<string, unknown>).expiresAt;
      return !expires || new Date(expires as string).getTime() > now;
    })
    .map((d) => {
      const data = d as Record<string, unknown> & { id: string };
      return {
        id: data.id,
        toolName: data.toolName as string,
        args: data.args as Record<string, unknown>,
        impactSummary: data.impactSummary as string,
        conversationId: data.conversationId as string | undefined,
        createdAt: new Date(data.createdAt as string),
      };
    });
}

/** Clear expired pending actions (older than TTL) */
export async function clearExpiredActions(): Promise<void> {
  const { fetchAll, remove } = await import("./firestore");
  const docs = await fetchAll(PENDING_ACTIONS_COLLECTION);
  const now = Date.now();
  for (const d of docs) {
    const data = d as Record<string, unknown> & { id: string };
    const expires = data.expiresAt as string | undefined;
    if (expires && new Date(expires).getTime() < now) {
      await remove(PENDING_ACTIONS_COLLECTION, data.id);
    }
  }
}
