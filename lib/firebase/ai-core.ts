/**
 * Creeda AI Core — Unified Orchestrator
 *
 * Single entry point for ALL AI interactions across the admin dashboard.
 * Both the AIPromptButton (per-page) and AIChatBox (AI Dashboard) use this.
 *
 * Architecture: Single Agent with Shared Memory (Orchestrator pattern)
 * - Persistent conversation stored in Firestore `ai-conversations`
 * - Conversation history included in every prompt
 * - Token-aware compression when history grows large
 * - Page-aware context auto-loading
 * - Unified identity across all surfaces
 *
 * Based on: https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system
 */

import { generateText, generateTextStream } from "./ai";
import {
  getActiveConversation,
  addMessage,
  startNewConversation,
  compressIfNeeded,
  formatHistoryForPrompt,
  switchToConversation,
} from "./ai-memory";
import {
  buildTrainedPrompt,
  getPageContext,
} from "@/lib/utils/ai-system-prompt";
import { loadPageAwareContext } from "@/lib/utils/ai-page-context";
import type { AIMessage, AIConversation, CreeaAICoreOptions } from "@/lib/types/ai";

// ─── Orchestrator State ──────────────────────────────

/**
 * In-memory cache of the active conversation to avoid re-fetching
 * from Firestore on every message. Synced back after each exchange.
 */
let _cachedConvo: (AIConversation & { id: string }) | null = null;
let _cachedUserId: string | null = null;

/**
 * Get the active conversation, using cache when possible.
 */
async function getConvo(userId: string): Promise<AIConversation & { id: string }> {
  if (_cachedConvo && _cachedUserId === userId && _cachedConvo.active) {
    return _cachedConvo;
  }
  _cachedUserId = userId;
  _cachedConvo = await getActiveConversation(userId);
  return _cachedConvo;
}

/**
 * Invalidate the cache (e.g., when starting a new conversation).
 */
function invalidateCache() {
  _cachedConvo = null;
  _cachedUserId = null;
}

// ─── Core: Send Message ──────────────────────────────

export interface SendMessageResult {
  response: string;
  conversationId: string;
  messageCount: number;
}

/**
 * Send a message to Creeda AI with full context awareness and memory.
 *
 * This is THE single entry point for all AI interactions:
 * 1. Loads (or creates) the active conversation from Firestore
 * 2. Appends the user message to history
 * 3. Compresses history if needed (token budget)
 * 4. Builds a fully-trained prompt with identity + data + history + user message
 * 5. Calls Gemini
 * 6. Appends the AI response to history
 * 7. Persists everything back to Firestore
 *
 * @param userId - Firebase Auth UID
 * @param userMessage - The user's message text
 * @param options - Context options (page, data, modules)
 */
export async function sendMessage(
  userId: string,
  userMessage: string,
  options: CreeaAICoreOptions = {},
): Promise<SendMessageResult> {
  const pagePath = options.pagePath || "/admin";
  const section = options.section || "AI Chat";

  // 1. Get or create conversation
  const convo = await getConvo(userId);

  // 2. Add user message
  const userMsg: AIMessage = {
    role: "user",
    content: userMessage,
    timestamp: new Date().toISOString(),
    page: pagePath,
  };
  const messagesAfterUser = await addMessage(convo.id, userMsg, convo.messages);
  convo.messages = messagesAfterUser;

  // 3. Compress if needed (uses AI to summarize old messages)
  const { messages: compressedMessages, memorySummary } = await compressIfNeeded(
    convo.id,
    messagesAfterUser,
    convo.memorySummary,
    async (text) => generateText(text),
  );
  convo.messages = compressedMessages;
  convo.memorySummary = memorySummary;

  // 4. Build the conversation history block
  const historyBlock = formatHistoryForPrompt(
    // Include all messages except the last one (that's the current user message,
    // which goes in the USER REQUEST section)
    compressedMessages.slice(0, -1),
    memorySummary,
  );

  // 5. Load page-aware data context
  let dataContext = options.dataContext || "";
  if (!dataContext) {
    try {
      const ctx = await loadPageAwareContext(pagePath);
      dataContext = ctx.dataContext;
    } catch (err) {
      console.warn("[Creeda AI Core] Page context loading failed:", err);
    }
  }

  // 6. Build the fully-trained prompt with memory
  const pageContext = getPageContext(pagePath);
  const fullPrompt = buildTrainedPrompt(section, userMessage, dataContext, {
    includeCompetitors: options.includeCompetitors ?? true,
    includeKPIs: options.includeKPIs ?? true,
    includeSEOAlgorithms: options.includeSEOAlgorithms ?? true,
    includeWebMastery: options.includeWebMastery,
    pageContext: [
      pageContext,
      historyBlock,
      `\nIMPORTANT: You have conversation memory. The user may refer to things discussed earlier. Use the conversation history above to maintain continuity. If they mention "earlier" or "before", check the history. Always respond as the same Creeda AI identity — you are one unified assistant, not separate per-page instances.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    customInstructions: options.customInstructions,
  });

  // 7. Generate response
  const response = await generateText(fullPrompt);

  // 8. Add AI response to conversation
  const aiMsg: AIMessage = {
    role: "assistant",
    content: response,
    timestamp: new Date().toISOString(),
    page: pagePath,
  };
  const messagesAfterAI = await addMessage(convo.id, aiMsg, convo.messages);
  convo.messages = messagesAfterAI;

  // Update cache
  _cachedConvo = convo;

  return {
    response,
    conversationId: convo.id,
    messageCount: messagesAfterAI.length,
  };
}

// ─── Conversation Management ─────────────────────────

/**
 * Start a fresh conversation. Archives the current one.
 */
export async function newConversation(userId: string): Promise<string> {
  invalidateCache();
  const convo = await startNewConversation(userId);
  _cachedConvo = convo;
  _cachedUserId = userId;
  return convo.id;
}

/**
 * Get the current conversation's messages for display.
 */
export async function getCurrentMessages(
  userId: string,
): Promise<{ messages: AIMessage[]; memorySummary?: string; conversationId: string }> {
  const convo = await getConvo(userId);
  return {
    messages: convo.messages,
    memorySummary: convo.memorySummary,
    conversationId: convo.id,
  };
}

/**
 * Switch to a previous conversation (from history).
 */
export async function switchConversation(
  userId: string,
  conversationId: string,
): Promise<{ messages: AIMessage[]; memorySummary?: string; conversationId: string }> {
  invalidateCache();
  const convo = await switchToConversation(userId, conversationId);
  _cachedConvo = convo;
  _cachedUserId = userId;
  return {
    messages: convo.messages,
    memorySummary: convo.memorySummary,
    conversationId: convo.id,
  };
}

/**
 * Clear the in-memory cache. Call when user signs out.
 */
export function clearCache() {
  invalidateCache();
}

// ─── Action Mode Logging ─────────────────────────────

/**
 * Log a one-shot action (e.g. blog generation, landing page creation)
 * to the conversation memory so Creeda AI can reference it later.
 *
 * This is fire-and-forget — it doesn't block the UI.
 *
 * @param userId — Firebase Auth UID
 * @param userPrompt — What the user requested
 * @param aiResult — Truncated result (we don't store the full HTML)
 * @param section — Which page/section triggered it (e.g. "Blog AI")
 * @param pagePath — Admin route path
 */
export async function logActionToMemory(
  userId: string,
  userPrompt: string,
  aiResult: string,
  section: string,
  pagePath: string,
): Promise<void> {
  try {
    const convo = await getConvo(userId);

    const userMsg: AIMessage = {
      role: "user",
      content: `[${section} — Action] ${userPrompt}`,
      timestamp: new Date().toISOString(),
      page: pagePath,
    };

    // Truncate result to keep memory lightweight — store summary, not full HTML
    const truncated =
      aiResult.length > 500
        ? aiResult.slice(0, 500).replace(/<[^>]*>/g, "").trim() + "…"
        : aiResult.replace(/<[^>]*>/g, "").trim();

    const aiMsg: AIMessage = {
      role: "assistant",
      content: `[Generated ${section} content] ${truncated}`,
      timestamp: new Date().toISOString(),
      page: pagePath,
    };

    const afterUser = await addMessage(convo.id, userMsg, convo.messages);
    convo.messages = afterUser;
    const afterAI = await addMessage(convo.id, aiMsg, afterUser);
    convo.messages = afterAI;
    _cachedConvo = convo;
  } catch (err) {
    // Non-critical — don't let memory logging break the main flow
    console.warn("[Creeda AI Core] Action logging failed:", err);
  }
}

// ─── Streaming ───────────────────────────────────────

/**
 * Send a message with streaming — yields text chunks as they arrive.
 *
 * Same memory management as `sendMessage`, but streams the AI response
 * in real-time for a better UX. The full response is persisted to Firestore
 * once the stream completes.
 */
export async function* sendMessageStream(
  userId: string,
  userMessage: string,
  options: CreeaAICoreOptions = {},
): AsyncGenerator<string, SendMessageResult, unknown> {
  const pagePath = options.pagePath || "/admin";
  const section = options.section || "AI Chat";

  // 1. Get or create conversation
  const convo = await getConvo(userId);

  // 2. Add user message
  const userMsg: AIMessage = {
    role: "user",
    content: userMessage,
    timestamp: new Date().toISOString(),
    page: pagePath,
  };
  const messagesAfterUser = await addMessage(convo.id, userMsg, convo.messages);
  convo.messages = messagesAfterUser;

  // 3. Compress if needed
  const { messages: compressedMessages, memorySummary } = await compressIfNeeded(
    convo.id,
    messagesAfterUser,
    convo.memorySummary,
    async (text) => generateText(text),
  );
  convo.messages = compressedMessages;
  convo.memorySummary = memorySummary;

  // 4. Build history & context
  const historyBlock = formatHistoryForPrompt(
    compressedMessages.slice(0, -1),
    memorySummary,
  );

  let dataContext = options.dataContext || "";
  if (!dataContext) {
    try {
      const ctx = await loadPageAwareContext(pagePath);
      dataContext = ctx.dataContext;
    } catch {
      // noop
    }
  }

  const pageContext = getPageContext(pagePath);
  const fullPrompt = buildTrainedPrompt(section, userMessage, dataContext, {
    includeCompetitors: options.includeCompetitors ?? true,
    includeKPIs: options.includeKPIs ?? true,
    includeSEOAlgorithms: options.includeSEOAlgorithms ?? true,
    includeWebMastery: options.includeWebMastery,
    pageContext: [
      pageContext,
      historyBlock,
      `\nIMPORTANT: You have conversation memory. The user may refer to things discussed earlier. Use the conversation history above to maintain continuity. If they mention "earlier" or "before", check the history. Always respond as the same Creeda AI identity — you are one unified assistant, not separate per-page instances.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    customInstructions: options.customInstructions,
  });

  // 5. Stream the response, accumulating full text
  let fullResponse = "";
  for await (const chunk of generateTextStream(fullPrompt)) {
    fullResponse += chunk;
    yield chunk;
  }

  // 6. Persist the complete AI response to memory
  const aiMsg: AIMessage = {
    role: "assistant",
    content: fullResponse,
    timestamp: new Date().toISOString(),
    page: pagePath,
  };
  const messagesAfterAI = await addMessage(convo.id, aiMsg, convo.messages);
  convo.messages = messagesAfterAI;
  _cachedConvo = convo;

  return {
    response: fullResponse,
    conversationId: convo.id,
    messageCount: messagesAfterAI.length,
  };
}
