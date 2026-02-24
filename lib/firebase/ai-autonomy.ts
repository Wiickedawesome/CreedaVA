/**
 * AI Autonomy Rules — Action authorization & audit logging
 *
 * Controls what the AI can do autonomously vs what requires human confirmation.
 * All tool invocations are logged to Firestore for audit trail.
 */

import { TOOL_REGISTRY, type ToolRiskLevel } from "./ai-tools";
import { create } from "./firestore";

// ─── Types ───────────────────────────────────────────

export type ActionDecision = "auto-execute" | "confirm" | "deny";

export interface ActionRequest {
  toolName: string;
  args: Record<string, unknown>;
  /** Conversation context for audit */
  conversationId?: string;
}

export interface ActionResult {
  decision: ActionDecision;
  reason?: string;
  /** For destructive actions, human-readable description of what will happen */
  impactSummary?: string;
}

export interface AuditLogEntry {
  toolName: string;
  domain: string;
  risk: ToolRiskLevel;
  decision: ActionDecision;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  conversationId?: string;
  /** Was this confirmed by the user (only for destructive actions)? */
  userConfirmed?: boolean;
  executedAt: Date;
}

// ─── Autonomy Policy ─────────────────────────────────

/** Evaluate whether a tool call should auto-execute, require confirmation, or be denied */
export function evaluateAction(request: ActionRequest): ActionResult {
  const meta = TOOL_REGISTRY[request.toolName];

  if (!meta) {
    return {
      decision: "deny",
      reason: `Unknown tool: ${request.toolName}`,
    };
  }

  switch (meta.risk) {
    case "read-only":
      return { decision: "auto-execute" };

    case "draft":
      return {
        decision: "auto-execute",
        reason: "Creates content in draft state — safe to auto-execute",
      };

    case "auto":
      return {
        decision: "auto-execute",
        reason: `Low-risk ${meta.domain} action — auto-executing`,
      };

    case "destructive":
      return {
        decision: "confirm",
        reason: `${meta.domain} action requires confirmation`,
        impactSummary: buildImpactSummary(request.toolName, request.args),
      };

    default:
      return {
        decision: "confirm",
        reason: "Unknown risk level — defaulting to confirmation",
      };
  }
}

// ─── Impact Descriptions ─────────────────────────────

function buildImpactSummary(
  toolName: string,
  args: Record<string, unknown>,
): string {
  switch (toolName) {
    case "send_email":
      return `Send email to ${args.to || "unknown"} with subject "${args.subject || "untitled"}"`;

    case "send_bulk_email": {
      const count = Array.isArray(args.recipients)
        ? args.recipients.length
        : 0;
      return `Send bulk email to ${count} recipients with subject "${args.subject || "untitled"}"`;
    }

    case "publish_blog_post":
      return `Publish blog post (ID: ${args.postId || "unknown"}) — will be publicly visible immediately`;

    case "flag_thread":
      return `Flag forum thread (ID: ${args.threadId || "unknown"}) for moderation — reason: ${args.reason || "unspecified"}`;

    case "close_thread":
      return `Close forum thread (ID: ${args.threadId || "unknown"}) — no more replies allowed`;

    default:
      return `Execute ${toolName} with ${Object.keys(args).length} parameters`;
  }
}

// ─── Audit Logging ───────────────────────────────────

const AUDIT_COLLECTION = "ai-activity-log";

/** Log a tool invocation to Firestore for audit trail */
export async function logToolInvocation(entry: AuditLogEntry): Promise<void> {
  try {
    await create(AUDIT_COLLECTION, {
      ...entry,
      executedAt: entry.executedAt.toISOString(),
    });
  } catch (err) {
    // Audit logging should never break the main flow
    console.error("[AI Autonomy] Failed to log tool invocation:", err);
  }
}

/** Build an audit entry from a tool execution */
export function buildAuditEntry(
  request: ActionRequest,
  decision: ActionDecision,
  result?: unknown,
  error?: string,
  userConfirmed?: boolean,
): AuditLogEntry {
  const meta = TOOL_REGISTRY[request.toolName];
  return {
    toolName: request.toolName,
    domain: meta?.domain ?? "unknown",
    risk: meta?.risk ?? "destructive",
    decision,
    args: sanitizeArgs(request.args),
    result: result !== undefined ? summarizeResult(result) : undefined,
    error,
    conversationId: request.conversationId,
    userConfirmed,
    executedAt: new Date(),
  };
}

/** Remove sensitive data from args before logging */
function sanitizeArgs(
  args: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized = { ...args };
  // Truncate long HTML content in audit logs
  for (const key of ["html", "content", "bodyHtml"]) {
    if (typeof sanitized[key] === "string" && (sanitized[key] as string).length > 200) {
      sanitized[key] = (sanitized[key] as string).slice(0, 200) + "... [truncated]";
    }
  }
  return sanitized;
}

/** Summarize large results for audit storage */
function summarizeResult(result: unknown): unknown {
  if (result === null || result === undefined) return result;
  const str = JSON.stringify(result);
  if (str.length > 500) {
    return { _summary: `Result truncated (${str.length} chars)`, success: (result as Record<string, unknown>)?.success };
  }
  return result;
}
