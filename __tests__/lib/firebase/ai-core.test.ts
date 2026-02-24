import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies
const mockGetActiveConversation = vi.fn();
const mockAddMessage = vi.fn();
const mockStartNewConversation = vi.fn();
const mockCompressIfNeeded = vi.fn();
const mockFormatHistoryForPrompt = vi.fn();
const mockSwitchToConversation = vi.fn();
const mockGenerateText = vi.fn();
const mockGenerateTextStream = vi.fn();
const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => {
  const mockModel = {
    generateContent: (...args: unknown[]) => mockGenerateContent(...args),
  };
  return {
    GoogleGenerativeAI: vi.fn(function () {
      return { getGenerativeModel: vi.fn(() => mockModel) };
    }),
    FunctionCallingMode: { AUTO: "AUTO", ANY: "ANY", NONE: "NONE" },
    SchemaType: { STRING: "STRING", NUMBER: "NUMBER", INTEGER: "INTEGER", BOOLEAN: "BOOLEAN", ARRAY: "ARRAY" },
  };
});

vi.mock("@/lib/firebase/ai-tools", () => ({
  ALL_TOOLS: { functionDeclarations: [] },
  TOOL_REGISTRY: {},
}));

vi.mock("@/lib/firebase/ai-tool-executor", () => ({
  executeTool: vi.fn(),
  confirmAction: vi.fn(),
  rejectAction: vi.fn(),
}));

vi.mock("@/lib/firebase/ai-memory", () => ({
  getActiveConversation: (...args: unknown[]) => mockGetActiveConversation(...args),
  addMessage: (...args: unknown[]) => mockAddMessage(...args),
  startNewConversation: (...args: unknown[]) => mockStartNewConversation(...args),
  compressIfNeeded: (...args: unknown[]) => mockCompressIfNeeded(...args),
  formatHistoryForPrompt: (...args: unknown[]) => mockFormatHistoryForPrompt(...args),
  switchToConversation: (...args: unknown[]) => mockSwitchToConversation(...args),
}));

vi.mock("@/lib/firebase/ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  generateTextStream: (...args: unknown[]) => mockGenerateTextStream(...args),
}));

vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: {},
  db: {},
}));

vi.mock("@/lib/utils/ai-system-prompt", () => ({
  buildTrainedPrompt: (_section: string, msg: string) => `TRAINED: ${msg}`,
  getPageContext: () => "page context",
}));

vi.mock("@/lib/utils/ai-page-context", () => ({
  loadPageAwareContext: () => Promise.resolve({ dataContext: "auto-context" }),
}));

import {
  sendMessage,
  newConversation,
  getCurrentMessages,
  clearCache,
  logActionToMemory,
  switchConversation,
} from "@/lib/firebase/ai-core";

const makeConvo = (overrides = {}) => ({
  id: "conv-1",
  userId: "u1",
  title: "Test",
  messages: [],
  active: true,
  compressionCount: 0,
  memorySummary: undefined,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_GEMINI_API_KEY = "test-key";
  clearCache(); // Ensure cache is clean between tests

  // Default mock: model returns text with no function calls
  mockGenerateContent.mockResolvedValue({
    response: {
      text: () => "AI reply",
      candidates: [
        {
          content: {
            parts: [{ text: "AI reply" }],
          },
        },
      ],
    },
  });
});

// ─── sendMessage ─────────────────────────────────────

describe("sendMessage", () => {
  it("sends a message and returns the AI response", async () => {
    const convo = makeConvo();
    mockGetActiveConversation.mockResolvedValue(convo);
    mockAddMessage.mockImplementation((_id, msg, existing) => [...existing, msg]);
    mockCompressIfNeeded.mockImplementation((_id, msgs) => ({
      messages: msgs,
      memorySummary: undefined,
    }));
    mockFormatHistoryForPrompt.mockReturnValue("");

    const result = await sendMessage("u1", "Hello");

    expect(result.response).toBe("AI reply");
    expect(result.conversationId).toBe("conv-1");
    expect(result.messageCount).toBe(2); // user + assistant
    expect(mockAddMessage).toHaveBeenCalledTimes(2); // user msg + AI msg
    expect(mockGenerateContent).toHaveBeenCalledOnce();
  });

  it("includes data context when provided", async () => {
    const convo = makeConvo();
    mockGetActiveConversation.mockResolvedValue(convo);
    mockAddMessage.mockImplementation((_id, msg, existing) => [...existing, msg]);
    mockCompressIfNeeded.mockImplementation((_id, msgs) => ({
      messages: msgs,
      memorySummary: undefined,
    }));
    mockFormatHistoryForPrompt.mockReturnValue("");

    await sendMessage("u1", "Question", { dataContext: "Some data" });

    expect(mockGenerateContent).toHaveBeenCalledOnce();
  });
});

// ─── newConversation ─────────────────────────────────

describe("newConversation", () => {
  it("starts a fresh conversation and returns its ID", async () => {
    const freshConvo = makeConvo({ id: "new-conv" });
    mockStartNewConversation.mockResolvedValue(freshConvo);

    const result = await newConversation("u1");
    expect(result).toBe("new-conv");
    expect(mockStartNewConversation).toHaveBeenCalledWith("u1");
  });
});

// ─── getCurrentMessages ──────────────────────────────

describe("getCurrentMessages", () => {
  it("returns messages from the active conversation", async () => {
    const messages = [
      { role: "user", content: "Hi", timestamp: "2025-01-01T00:00:00Z" },
      { role: "assistant", content: "Hello!", timestamp: "2025-01-01T00:01:00Z" },
    ];
    const convo = makeConvo({ messages });
    mockGetActiveConversation.mockResolvedValue(convo);

    const result = await getCurrentMessages("u1");
    expect(result.messages).toEqual(messages);
    expect(result.conversationId).toBe("conv-1");
  });
});

// ─── logActionToMemory ───────────────────────────────

describe("logActionToMemory", () => {
  it("logs user action and truncated AI result to memory", async () => {
    const convo = makeConvo();
    mockGetActiveConversation.mockResolvedValue(convo);
    mockAddMessage.mockImplementation((_id, msg, existing) => [...existing, msg]);

    await logActionToMemory("u1", "Generate blog", "<p>Long HTML content</p>", "Blog AI", "/admin/blog");

    expect(mockAddMessage).toHaveBeenCalledTimes(2);
    // First call: user action message
    const firstMsg = mockAddMessage.mock.calls[0][1];
    expect(firstMsg.role).toBe("user");
    expect(firstMsg.content).toContain("[Blog AI — Action]");
    expect(firstMsg.content).toContain("Generate blog");

    // Second call: AI result (HTML stripped)
    const secondMsg = mockAddMessage.mock.calls[1][1];
    expect(secondMsg.role).toBe("assistant");
    expect(secondMsg.content).toContain("[Generated Blog AI content]");
    expect(secondMsg.content).not.toContain("<p>");
  });

  it("truncates results longer than 500 chars", async () => {
    const convo = makeConvo();
    mockGetActiveConversation.mockResolvedValue(convo);
    mockAddMessage.mockImplementation((_id, msg, existing) => [...existing, msg]);

    const longResult = "A".repeat(600);
    await logActionToMemory("u1", "Do thing", longResult, "Test", "/admin");

    const savedMsg = mockAddMessage.mock.calls[1][1];
    expect(savedMsg.content.length).toBeLessThan(600);
    expect(savedMsg.content).toContain("…");
  });
});

// ─── switchConversation ──────────────────────────────

describe("switchConversation", () => {
  it("switches to a previous conversation", async () => {
    const targetConvo = makeConvo({
      id: "old-conv",
      messages: [{ role: "user", content: "Old message", timestamp: "2025-01-01T00:00:00Z" }],
      memorySummary: "Old summary",
    });
    mockSwitchToConversation.mockResolvedValue(targetConvo);

    const result = await switchConversation("u1", "old-conv");
    expect(result.conversationId).toBe("old-conv");
    expect(result.messages).toHaveLength(1);
    expect(result.memorySummary).toBe("Old summary");
    expect(mockSwitchToConversation).toHaveBeenCalledWith("u1", "old-conv");
  });
});

// ─── clearCache ──────────────────────────────────────

describe("clearCache", () => {
  it("clears cached conversation so next call refetches", async () => {
    // Populate cache
    const convo = makeConvo();
    mockGetActiveConversation.mockResolvedValue(convo);
    mockAddMessage.mockImplementation((_id, msg, existing) => [...existing, msg]);
    mockCompressIfNeeded.mockImplementation((_id, msgs) => ({
      messages: msgs,
      memorySummary: undefined,
    }));
    mockFormatHistoryForPrompt.mockReturnValue("");

    await sendMessage("u1", "Test");
    expect(mockGetActiveConversation).toHaveBeenCalledTimes(1);

    // Second call uses cache
    await sendMessage("u1", "Test 2");
    expect(mockGetActiveConversation).toHaveBeenCalledTimes(1); // still 1 — cached

    // Clear and verify refetch
    clearCache();
    const convo2 = makeConvo({ id: "conv-2" });
    mockGetActiveConversation.mockResolvedValue(convo2);
    await sendMessage("u1", "Test 3");
    expect(mockGetActiveConversation).toHaveBeenCalledTimes(2); // refetched
  });
});
