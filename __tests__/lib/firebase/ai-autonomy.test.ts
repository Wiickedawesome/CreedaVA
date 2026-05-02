import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Firestore before importing the module under test
vi.mock("@/lib/firebase/firestore", () => ({
  create: vi.fn().mockResolvedValue("mock-audit-id"),
  fetchAll: vi.fn(),
  where: vi.fn(),
}));
vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: {},
  db: {},
}));

import {
  evaluateAction,
  buildAuditEntry,
  logToolInvocation,
  type ActionRequest,
} from "@/lib/firebase/ai-autonomy";
import { create } from "@/lib/firebase/firestore";

describe("AI Autonomy Rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── evaluateAction ─────────────────────────────────

  describe("evaluateAction", () => {
    it("denies unknown tools", () => {
      const result = evaluateAction({
        toolName: "nonexistent_tool",
        args: {},
      });
      expect(result.decision).toBe("deny");
      expect(result.reason).toContain("Unknown tool");
    });

    it("auto-executes read-only tools", () => {
      const result = evaluateAction({
        toolName: "list_calendar_events",
        args: {},
      });
      expect(result.decision).toBe("auto-execute");
    });

    it("auto-executes draft-risk tools", () => {
      const result = evaluateAction({
        toolName: "create_blog_draft",
        args: { title: "Test" },
      });
      expect(result.decision).toBe("auto-execute");
      expect(result.reason).toContain("draft");
    });

    it("auto-executes auto-risk tools (forum)", () => {
      const result = evaluateAction({
        toolName: "create_forum_thread",
        args: { title: "Test", content: "Hello" },
      });
      expect(result.decision).toBe("auto-execute");
    });

    it("requires confirmation for destructive tools", () => {
      const result = evaluateAction({
        toolName: "send_email",
        args: { to: "test@example.com", subject: "Hello", html: "<p>Hi</p>" },
      });
      expect(result.decision).toBe("confirm");
      expect(result.impactSummary).toContain("test@example.com");
    });

    it("builds impact summary for send_email", () => {
      const result = evaluateAction({
        toolName: "send_email",
        args: { to: "john@creedava.com", subject: "Follow-up" },
      });
      expect(result.impactSummary).toContain("john@creedava.com");
      expect(result.impactSummary).toContain("Follow-up");
    });

    it("builds impact summary for send_bulk_email", () => {
      const result = evaluateAction({
        toolName: "send_bulk_email",
        args: {
          recipients: ["a@a.com", "b@b.com"],
          subject: "Newsletter",
        },
      });
      expect(result.impactSummary).toContain("2 recipients");
      expect(result.impactSummary).toContain("Newsletter");
    });

    it("builds impact summary for publish_blog_post", () => {
      const result = evaluateAction({
        toolName: "publish_blog_post",
        args: { postId: "abc123" },
      });
      expect(result.impactSummary).toContain("abc123");
    });

    it("builds generic impact summary for unknown destructive tools", () => {
      // close_thread is destructive
      const result = evaluateAction({
        toolName: "close_thread",
        args: { threadId: "t1" },
      });
      expect(result.decision).toBe("confirm");
      expect(result.impactSummary).toBeDefined();
    });
  });

  // ─── buildAuditEntry ───────────────────────────────

  describe("buildAuditEntry", () => {
    it("produces a complete audit entry", () => {
      const request: ActionRequest = {
        toolName: "list_calendar_events",
        args: {},
        conversationId: "conv-123",
      };
      const entry = buildAuditEntry(request, "auto-execute", { events: [] });
      expect(entry.toolName).toBe("list_calendar_events");
      expect(entry.domain).toBe("calendar");
      expect(entry.risk).toBe("read-only");
      expect(entry.decision).toBe("auto-execute");
      expect(entry.conversationId).toBe("conv-123");
      expect(entry.executedAt).toBeInstanceOf(Date);
    });

    it("handles unknown tool gracefully", () => {
      const entry = buildAuditEntry(
        { toolName: "unknown_tool", args: {} },
        "deny",
      );
      expect(entry.domain).toBe("unknown");
      expect(entry.risk).toBe("destructive"); // defaults to destructive
    });

    it("sanitizes long HTML content in args", () => {
      const longHtml = "<p>" + "x".repeat(500) + "</p>";
      const entry = buildAuditEntry(
        { toolName: "send_email", args: { html: longHtml, to: "a@b.com" } },
        "auto-execute",
      );
      expect((entry.args.html as string).length).toBeLessThan(longHtml.length);
      expect((entry.args.html as string)).toContain("[truncated]");
      expect(entry.args.to).toBe("a@b.com"); // non-HTML args unchanged
    });

    it("summarizes large results", () => {
      const bigResult = { data: "x".repeat(1000), success: true };
      const entry = buildAuditEntry(
        { toolName: "list_leads", args: {} },
        "auto-execute",
        bigResult,
      );
      expect(entry.result).toHaveProperty("_summary");
      expect((entry.result as Record<string, unknown>).success).toBe(true);
    });

    it("records errors in audit entry", () => {
      const entry = buildAuditEntry(
        { toolName: "send_email", args: {} },
        "auto-execute",
        undefined,
        "SMTP connection failed",
      );
      expect(entry.error).toBe("SMTP connection failed");
    });
  });

  // ─── logToolInvocation ──────────────────────────────

  describe("logToolInvocation", () => {
    it("writes audit entry to Firestore", async () => {
      const entry = buildAuditEntry(
        { toolName: "list_calendar_events", args: {} },
        "auto-execute",
      );
      await logToolInvocation(entry);
      expect(create).toHaveBeenCalledOnce();
      expect(create).toHaveBeenCalledWith(
        "ai-activity-log",
        expect.objectContaining({
          toolName: "list_calendar_events",
          decision: "auto-execute",
        }),
      );
    });

    it("does not throw on Firestore failure", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      vi.mocked(create).mockRejectedValueOnce(new Error("Firestore down"));
      const entry = buildAuditEntry(
        { toolName: "read_inbox", args: {} },
        "auto-execute",
      );
      // Should not throw
      await expect(logToolInvocation(entry)).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith(
        "[AI Autonomy] Failed to log tool invocation:",
        expect.any(Error),
      );
    });
  });
});
