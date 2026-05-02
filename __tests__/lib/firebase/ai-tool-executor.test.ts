import { describe, it, expect, vi, beforeEach } from "vitest";

const firestoreMocks = vi.hoisted(() => {
  const pendingActions = new Map<string, Record<string, unknown> & { id: string }>();

  return {
    pendingActions,
    fetchAll: vi.fn(async (collectionName: string) => {
      if (collectionName === "ai-pending-actions") {
        return Array.from(pendingActions.values());
      }
      return [];
    }),
    fetchOne: vi.fn(async (collectionName: string, docId: string) => {
      if (collectionName === "ai-pending-actions") {
        return pendingActions.get(docId) ?? null;
      }
      return null;
    }),
    create: vi.fn().mockResolvedValue("mock-id"),
    createWithId: vi.fn(async (collectionName: string, docId: string, data: Record<string, unknown>) => {
      if (collectionName === "ai-pending-actions") {
        pendingActions.set(docId, { id: docId, ...data });
      }
    }),
    update: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn(async (collectionName: string, docId: string) => {
      if (collectionName === "ai-pending-actions") {
        pendingActions.delete(docId);
      }
    }),
    where: vi.fn(),
  };
});

// Mock all dependencies before importing the module under test
vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: { currentUser: null },
  db: {},
}));
vi.mock("@/lib/firebase/firestore", () => ({
  fetchAll: firestoreMocks.fetchAll,
  fetchOne: firestoreMocks.fetchOne,
  create: firestoreMocks.create,
  createWithId: firestoreMocks.createWithId,
  update: firestoreMocks.update,
  remove: firestoreMocks.remove,
  where: firestoreMocks.where,
}));
vi.mock("firebase/firestore", () => ({
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("@/lib/firebase/cloud-functions", () => ({
  cloudListCalendarEvents: vi.fn().mockResolvedValue([]),
  cloudFetchInbox: vi.fn().mockResolvedValue({ success: true, messages: [], total: 0, folder: "INBOX" }),
  cloudListMailboxFolders: vi.fn().mockResolvedValue([]),
  cloudSendEmail: vi.fn().mockResolvedValue({ success: true, messageId: "m1" }),
  cloudSendBulkEmail: vi.fn().mockResolvedValue({ success: true, sent: 2, failed: 0 }),
}));

import {
  executeTool,
  confirmAction,
  rejectAction,
  getPendingActions,
  clearExpiredActions,
} from "@/lib/firebase/ai-tool-executor";

describe("AI Tool Executor", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    firestoreMocks.pendingActions.clear();
  });

  // ─── executeTool — read-only (auto-execute) ─────────

  describe("auto-execute (read-only tools)", () => {
    it("executes list_calendar_events without confirmation", async () => {
      const result = await executeTool({
        name: "list_calendar_events",
        args: {},
      });
      expect(result.requiresConfirmation).toBe(false);
      expect(result.name).toBe("list_calendar_events");
      expect(result.response).toHaveProperty("success", true);
    });

    it("executes read_inbox with args", async () => {
      const result = await executeTool({
        name: "read_inbox",
        args: { limit: 5, filter: "unread" },
      });
      expect(result.requiresConfirmation).toBe(false);
      expect(result.response).toHaveProperty("success", true);
    });
  });

  // ─── executeTool — destructive (confirm) ────────────

  describe("destructive tools (require confirmation)", () => {
    it("returns pending_confirmation for send_email", async () => {
      const result = await executeTool({
        name: "send_email",
        args: { to: "test@creedava.com", subject: "Test", html: "<p>Hi</p>" },
      });
      expect(result.requiresConfirmation).toBe(true);
      expect(result.response).toHaveProperty("status", "pending_confirmation");
      expect(result.response).toHaveProperty("actionId");
      expect(result.impactSummary).toContain("test@creedava.com");
    });

    it("adds action to pending list", async () => {
      await executeTool({
        name: "send_email",
        args: { to: "a@b.com", subject: "Hi", html: "x" },
      });
      const pending = await getPendingActions();
      expect(pending.length).toBe(1);
      expect(pending[0].toolName).toBe("send_email");
    });
  });

  // ─── executeTool — unknown tool ─────────────────────

  describe("unknown tools", () => {
    it("returns error for unregistered tool", async () => {
      const result = await executeTool({
        name: "totally_fake_tool",
        args: {},
      });
      expect(result.requiresConfirmation).toBe(false);
      expect(result.response).toHaveProperty("error");
    });
  });

  // ─── confirmAction ──────────────────────────────────

  describe("confirmAction", () => {
    it("executes a previously pending action", async () => {
      // Create a pending action
      const pendingResult = await executeTool({
        name: "send_email",
        args: { to: "a@b.com", subject: "Test", html: "<p>x</p>" },
      });
      const actionId = (pendingResult.response as Record<string, unknown>)
        .actionId as string;

      // Confirm it
      const result = await confirmAction(actionId);
      expect(result.requiresConfirmation).toBe(false);
      expect(result.response).toHaveProperty("success", true);
    });

    it("returns error for unknown action ID", async () => {
      const result = await confirmAction("nonexistent-id");
      expect(result.response).toHaveProperty("error");
    });
  });

  // ─── rejectAction ──────────────────────────────────

  describe("rejectAction", () => {
    it("removes pending action and reports rejection", async () => {
      const pendingResult = await executeTool({
        name: "send_email",
        args: { to: "a@b.com", subject: "Nope", html: "<p>x</p>" },
      });
      const actionId = (pendingResult.response as Record<string, unknown>)
        .actionId as string;

      const result = await rejectAction(actionId);
      expect(result.response).toHaveProperty("status", "rejected");
      expect((await getPendingActions()).length).toBe(0);
    });
  });

  // ─── clearExpiredActions ────────────────────────────

  describe("clearExpiredActions", () => {
    it("removes expired actions", async () => {
      // Create a pending action
      await executeTool({
        name: "send_email",
        args: { to: "a@b.com", subject: "Old", html: "x" },
      });
      expect((await getPendingActions()).length).toBe(1);

      const actionId = Array.from(firestoreMocks.pendingActions.keys())[0];
      const action = firestoreMocks.pendingActions.get(actionId);
      expect(action).toBeDefined();
      action!.expiresAt = new Date(Date.now() - 1000).toISOString();

      await clearExpiredActions();
      expect((await getPendingActions()).length).toBe(0);
    });
  });

  // ─── Error handling ─────────────────────────────────

  describe("error handling", () => {
    it("catches handler errors and returns error response", async () => {
      // list_forum_threads uses fetchAll which we can make throw
      const { fetchAll } = await import("@/lib/firebase/firestore");
      vi.mocked(fetchAll).mockRejectedValueOnce(new Error("Firestore offline"));

      const result = await executeTool({
        name: "list_forum_threads",
        args: {},
      });
      expect(result.requiresConfirmation).toBe(false);
      expect(result.response).toHaveProperty("error");
    });
  });
});
