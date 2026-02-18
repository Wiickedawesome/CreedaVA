import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Firestore to prevent real Firebase calls
const mockFetchAll = vi.fn();
const mockFetchOne = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/firebase/firestore", () => ({
  fetchAll: (...args: unknown[]) => mockFetchAll(...args),
  fetchOne: (...args: unknown[]) => mockFetchOne(...args),
  create: (...args: unknown[]) => mockCreate(...args),
  update: (...args: unknown[]) => mockUpdate(...args),
  where: (field: string, op: string, value: unknown) => ({ field, op, value }),
  orderBy: (field: string, dir: string) => ({ field, dir }),
  limit: (n: number) => ({ limit: n }),
}));

vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: {},
  db: {},
}));

import {
  getActiveConversation,
  addMessage,
  startNewConversation,
  getConversationHistory,
  formatHistoryForPrompt,
  compressIfNeeded,
  getConversationById,
  switchToConversation,
} from "@/lib/firebase/ai-memory";
import type { AIMessage } from "@/lib/types/ai";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getActiveConversation ───────────────────────────

describe("getActiveConversation", () => {
  it("returns existing active conversation", async () => {
    const existing = {
      id: "conv-1",
      userId: "u1",
      title: "Chat",
      messages: [],
      active: true,
      compressionCount: 0,
    };
    mockFetchAll.mockResolvedValue([existing]);

    const result = await getActiveConversation("u1");
    expect(result).toEqual(existing);
    expect(mockFetchAll).toHaveBeenCalledWith(
      "ai-conversations",
      expect.objectContaining({ field: "userId", value: "u1" }),
      expect.objectContaining({ field: "active", value: true }),
      expect.objectContaining({ field: "updatedAt" }),
      expect.objectContaining({ limit: 1 }),
    );
  });

  it("creates a new conversation when none exists", async () => {
    mockFetchAll.mockResolvedValue([]);
    mockCreate.mockResolvedValue("new-conv-id");

    const result = await getActiveConversation("u1");
    expect(mockCreate).toHaveBeenCalledWith("ai-conversations", {
      userId: "u1",
      title: "New conversation",
      messages: [],
      active: true,
      compressionCount: 0,
    });
    expect(result.id).toBe("new-conv-id");
    expect(result.active).toBe(true);
  });
});

// ─── addMessage ──────────────────────────────────────

describe("addMessage", () => {
  it("appends message and persists to Firestore", async () => {
    mockUpdate.mockResolvedValue(undefined);

    const msg: AIMessage = {
      role: "user",
      content: "Hello",
      timestamp: "2025-01-01T00:00:00Z",
      page: "/admin",
    };

    const result = await addMessage("conv-1", msg, []);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Hello");
    expect(mockUpdate).toHaveBeenCalledWith(
      "ai-conversations",
      "conv-1",
      expect.objectContaining({
        messages: [msg],
        lastPage: "/admin",
        title: "Hello", // auto-titled from first user message
      }),
    );
  });

  it("does not auto-title on subsequent messages", async () => {
    mockUpdate.mockResolvedValue(undefined);
    const existing: AIMessage = {
      role: "user",
      content: "First message",
      timestamp: "2025-01-01T00:00:00Z",
    };
    const newMsg: AIMessage = {
      role: "assistant",
      content: "Reply",
      timestamp: "2025-01-01T00:01:00Z",
    };

    await addMessage("conv-1", newMsg, [existing]);
    expect(mockUpdate).toHaveBeenCalledWith(
      "ai-conversations",
      "conv-1",
      expect.not.objectContaining({ title: expect.anything() }),
    );
  });
});

// ─── startNewConversation ────────────────────────────

describe("startNewConversation", () => {
  it("archives active conversations and creates a new one", async () => {
    const active = [
      { id: "old-1", userId: "u1", active: true },
      { id: "old-2", userId: "u1", active: true },
    ];
    mockFetchAll.mockResolvedValue(active);
    mockUpdate.mockResolvedValue(undefined);
    mockCreate.mockResolvedValue("new-conv-id");

    const result = await startNewConversation("u1");
    expect(mockUpdate).toHaveBeenCalledWith("ai-conversations", "old-1", { active: false });
    expect(mockUpdate).toHaveBeenCalledWith("ai-conversations", "old-2", { active: false });
    expect(mockCreate).toHaveBeenCalled();
    expect(result.id).toBe("new-conv-id");
    expect(result.active).toBe(true);
  });
});

// ─── getConversationHistory ──────────────────────────

describe("getConversationHistory", () => {
  it("fetches past conversations ordered by recency", async () => {
    const convos = [
      { id: "c1", title: "Chat 1" },
      { id: "c2", title: "Chat 2" },
    ];
    mockFetchAll.mockResolvedValue(convos);

    const result = await getConversationHistory("u1", 10);
    expect(result).toEqual(convos);
    expect(mockFetchAll).toHaveBeenCalledWith(
      "ai-conversations",
      expect.objectContaining({ field: "userId", value: "u1" }),
      expect.objectContaining({ field: "updatedAt", dir: "desc" }),
      expect.objectContaining({ limit: 10 }),
    );
  });
});

// ─── getConversationById ─────────────────────────────

describe("getConversationById", () => {
  it("returns conversation with id when found", async () => {
    const doc = { id: "conv-5", userId: "u1", title: "Chat", messages: [], active: false };
    mockFetchOne.mockResolvedValue(doc);

    const result = await getConversationById("conv-5");
    expect(result).toEqual(doc);
  });

  it("returns null when not found", async () => {
    mockFetchOne.mockResolvedValue(null);

    const result = await getConversationById("missing");
    expect(result).toBeNull();
  });
});

// ─── switchToConversation ────────────────────────────

describe("switchToConversation", () => {
  it("deactivates other conversations and reactivates the target", async () => {
    const active = [
      { id: "current", userId: "u1", active: true },
    ];
    mockFetchAll.mockResolvedValue(active);
    mockUpdate.mockResolvedValue(undefined);
    const targetDoc = { id: "target-conv", userId: "u1", title: "Old Chat", messages: [], active: true };
    mockFetchOne.mockResolvedValue(targetDoc);

    const result = await switchToConversation("u1", "target-conv");
    expect(mockUpdate).toHaveBeenCalledWith("ai-conversations", "current", { active: false });
    expect(mockUpdate).toHaveBeenCalledWith("ai-conversations", "target-conv", { active: true });
    expect(result.id).toBe("target-conv");
  });
});

// ─── formatHistoryForPrompt ──────────────────────────

describe("formatHistoryForPrompt", () => {
  it("returns empty string when no messages or summary", () => {
    const result = formatHistoryForPrompt([]);
    expect(result).toBe("");
  });

  it("formats messages with roles and pages", () => {
    const messages: AIMessage[] = [
      { role: "user", content: "Hi", timestamp: "2025-01-01T00:00:00Z", page: "/admin/leads" },
      { role: "assistant", content: "Hello!", timestamp: "2025-01-01T00:01:00Z" },
    ];
    const result = formatHistoryForPrompt(messages);
    expect(result).toContain("USER [on /admin/leads]: Hi");
    expect(result).toContain("CREEDA AI: Hello!");
    expect(result).toContain("RECENT CONVERSATION");
  });

  it("includes memory summary when provided", () => {
    const result = formatHistoryForPrompt([], "Previously discussed SEO strategy");
    expect(result).toContain("CONVERSATION MEMORY");
    expect(result).toContain("Previously discussed SEO strategy");
  });

  it("includes both summary and recent messages", () => {
    const messages: AIMessage[] = [
      { role: "user", content: "What about now?", timestamp: "2025-01-01T00:00:00Z" },
    ];
    const result = formatHistoryForPrompt(messages, "Earlier context here");
    expect(result).toContain("CONVERSATION MEMORY");
    expect(result).toContain("RECENT CONVERSATION");
  });
});

// ─── compressIfNeeded ────────────────────────────────

describe("compressIfNeeded", () => {
  it("returns unchanged when under threshold", async () => {
    const messages: AIMessage[] = Array.from({ length: 10 }, (_, i) => ({
      role: "user" as const,
      content: `Message ${i}`,
      timestamp: `2025-01-01T00:0${i}:00Z`,
    }));

    const result = await compressIfNeeded("conv-1", messages, undefined);
    expect(result.messages).toEqual(messages);
    expect(result.memorySummary).toBeUndefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("compresses when over threshold using AI summary function", async () => {
    const messages: AIMessage[] = Array.from({ length: 45 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `Message ${i}`,
      timestamp: `2025-01-01T00:00:${String(i).padStart(2, "0")}Z`,
    }));

    // Mock the fetchOne for compression count
    mockFetchOne.mockResolvedValue({ compressionCount: 0 });
    mockUpdate.mockResolvedValue(undefined);

    const mockSummaryFn = vi.fn().mockResolvedValue("Summarized conversation about messages 0-34");

    const result = await compressIfNeeded("conv-1", messages, undefined, mockSummaryFn);

    // Should keep only the last 10 messages
    expect(result.messages).toHaveLength(10);
    expect(result.messages[0].content).toBe("Message 35");
    expect(result.memorySummary).toBe("Summarized conversation about messages 0-34");
    expect(mockSummaryFn).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("uses fallback summary when no summary function provided", async () => {
    const messages: AIMessage[] = Array.from({ length: 45 }, (_, i) => ({
      role: "user" as const,
      content: `Message ${i}`,
      timestamp: `2025-01-01T00:00:${String(i).padStart(2, "0")}Z`,
    }));

    mockFetchOne.mockResolvedValue({ compressionCount: 0 });
    mockUpdate.mockResolvedValue(undefined);

    const result = await compressIfNeeded("conv-1", messages, undefined);

    expect(result.messages).toHaveLength(10);
    expect(result.memorySummary).toContain("Conversation summary");
  });
});
