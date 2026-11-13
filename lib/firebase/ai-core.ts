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
 * - Function calling: Gemini can invoke real tools (CRM, email, blog, etc.)
 *
 * Based on: https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system
 */

import type { Content, Part } from "@google/generative-ai";
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
import { getAssistantContext } from "@/lib/utils/ai-assistant-context";
import { cloudWebSearch } from "@/lib/firebase/cloud-functions";
import {
  executeTool,
  confirmAction as execConfirm,
  rejectAction as execReject,
  type ToolExecutionResult,
  type PendingAction,
} from "./ai-tool-executor";
import type { AIMessage, AIConversation, CreeaAICoreOptions } from "@/lib/types/ai";

// ─── Tool-Aware Model ────────────────────────────────

/**
 * Separate model instance for tool-enabled calls.
 * The base `ai.ts` model doesn't support tools — this one does.
 */
/**
 * Call the /api/ai proxy in "chat" mode — one round of the tool loop.
 * Returns a mock GenerateContentResult so the existing loop logic works unchanged.
 */
async function callChatProxy(
  systemInstruction: string,
  contents: Content[],
): Promise<{
  response: {
    candidates: Array<{ content: { parts: Part[]; role: string } }>;
    text(): string;
  };
}> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "chat", systemInstruction, contents }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(`[AI Core Proxy] ${errBody.error ?? res.status}`);
  }
  const { parts, text } = await res.json();
  return {
    response: {
      candidates: [{ content: { parts: parts ?? [], role: "model" } }],
      text: () => text ?? "",
    },
  };
}

/** Max function call rounds to prevent infinite loops */
const MAX_TOOL_ROUNDS = 8;

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

// ─── NOVA: Web Research Pre-fetch ──────────────────────

/**
 * Extracts a content topic from a user message by looking for creation verbs.
 * Returns null if no content-creation intent is detected.
 */
function extractContentTopic(message: string): string | null {
  const triggers = [
    "write",
    "create",
    "generate",
    "draft",
    "post about",
    "article about",
    "blog about",
    "blog post on",
    "blog on",
  ];
  const lower = message.toLowerCase();
  for (const trigger of triggers) {
    const idx = lower.indexOf(trigger);
    if (idx !== -1) {
      const after = message.slice(idx + trigger.length).trim();
      const topic = after.slice(0, 80).replace(/[.!?].*$/, "").trim();
      if (topic.length > 3) return topic;
    }
  }
  return null;
}

/**
 * Pre-fetches web research for NOVA's content creation tasks.
 * Fires two parallel web searches and formats results as a context block.
 * Silently swallows errors so AI generation is never blocked.
 */
async function fetchWebContextForNova(topic: string): Promise<string> {
  try {
    const queries = [
      `virtual assistant ${topic} trends 2026`,
      `${topic} small business outsourcing 2026`,
    ];
    const results = await Promise.allSettled(
      queries.map((q) => cloudWebSearch(q, 5)),
    );
    const sections: string[] = [];
    for (let i = 0; i < queries.length; i++) {
      const r = results[i];
      if (
        r.status === "fulfilled" &&
        r.value.success &&
        r.value.results.length > 0
      ) {
        const items = r.value.results
          .map((sr) => `  - ${sr.title}: ${sr.snippet} (${sr.link})`)
          .join("\n");
        sections.push(`[${queries[i]}]\n${items}`);
      }
    }
    return sections.length > 0 ? sections.join("\n\n") : "";
  } catch {
    return "";
  }
}

// ─── Core: Send Message ──────────────────────────────

export interface SendMessageResult {
  response: string;
  conversationId: string;
  messageCount: number;
  /** Tools that were invoked during this exchange */
  toolsUsed?: ToolExecutionResult[];
  /** Actions waiting for user confirmation */
  pendingActions?: PendingAction[];
}

/**
 * Send a message to Creeda AI with full context awareness, memory, and tools.
 *
 * This is THE single entry point for all AI interactions:
 * 1. Loads (or creates) the active conversation from Firestore
 * 2. Appends the user message to history
 * 3. Compresses history if needed (token budget)
 * 4. Builds a fully-trained prompt with identity + data + history + user message
 * 5. Calls Gemini with function calling enabled
 * 6. If Gemini returns function calls, executes them and re-prompts (up to MAX_TOOL_ROUNDS)
 * 7. Appends the AI response to history
 * 8. Persists everything back to Firestore
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

  // 5.5 Resolve the skill set for this page, plus content research where it helps
  const assistant = getAssistantContext(pagePath);
  let webResearchContext = "";
  if (assistant.area === "content") {
    const topic = extractContentTopic(userMessage);
    if (topic) {
      webResearchContext = await fetchWebContextForNova(topic);
    }
  }

  // 6. Build the fully-trained prompt using the area's modules + memory
  const pageContext = getPageContext(pagePath);
  const trained = buildTrainedPrompt(section, userMessage, dataContext, {
    ...assistant.promptOptions,
    includeToolGuidelines: true,
    webSearchResults: webResearchContext || undefined,
    pageContext: [
      pageContext,
      historyBlock,
      `\nIMPORTANT: You have conversation memory. The user may refer to things discussed earlier. Use the conversation history above to maintain continuity. If they mention "earlier" or "before", check the history. Always respond as the same Creeda AI identity — you are one unified assistant, not separate per-page instances.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    customInstructions: options.customInstructions,
  });

  // 7. Call proxy in tool-calling mode (first round)
  const contents: Content[] = [
    { role: "user", parts: [{ text: trained.userContent }] },
  ];

  let response = await callChatProxy(trained.systemInstruction, contents);

  // 8. Tool-call loop: execute function calls, feed results back to Gemini
  const toolsUsed: ToolExecutionResult[] = [];
  const pendingConfirmations: PendingAction[] = [];
  let rounds = 0;
  let autoExecuteCount = 0;
  const AUTO_EXECUTE_WARN_THRESHOLD = 3;
  let toolChainWarning = "";

  while (rounds < MAX_TOOL_ROUNDS) {
    const candidate = response.response.candidates?.[0];
    if (!candidate) break;

    // Check for function calls in the response
    const functionCalls = candidate.content?.parts?.filter(
      (p): p is Part & { functionCall: { name: string; args: Record<string, unknown> } } =>
        "functionCall" in p && p.functionCall !== undefined,
    );

    if (!functionCalls || functionCalls.length === 0) break;

    console.info(
      `[Creeda AI Core] Tool round ${rounds + 1}: ${functionCalls.map((fc) => fc.functionCall.name).join(", ")}`,
    );

    // Add the model's function call response to the conversation
    contents.push({
      role: "model",
      parts: candidate.content?.parts ?? [],
    });

    // Execute each function call
    const functionResponses: Part[] = [];
    for (const fc of functionCalls) {
      const result = await executeTool(fc.functionCall, convo.id);
      toolsUsed.push(result);

      if (!result.requiresConfirmation) {
        autoExecuteCount++;
      }

      if (result.requiresConfirmation) {
        pendingConfirmations.push({
          id: (result.response as Record<string, unknown>).actionId as string,
          toolName: result.name,
          args: fc.functionCall.args as Record<string, unknown>,
          impactSummary: result.impactSummary ?? `Execute ${result.name}`,
          conversationId: convo.id,
          createdAt: new Date(),
        });
      }

      functionResponses.push({
        functionResponse: {
          name: result.name,
          response: result.response,
        },
      });
    }

    // Feed function responses back to proxy (next tool round)
    contents.push({
      role: "user",
      parts: functionResponses,
    });

    response = await callChatProxy(trained.systemInstruction, contents);

    rounds++;
  }

  if (autoExecuteCount > AUTO_EXECUTE_WARN_THRESHOLD) {
    toolChainWarning = `\n\n> ⚠️ ${autoExecuteCount} tools were auto-executed in this response. Review the actions above to ensure they are correct.`;
  }

  // 9. Extract the final text response
  const finalText = response.response.text() ?? "";

  // 10. Build tool usage summary for the memory log
  const toolSummary =
    toolsUsed.length > 0
      ? `\n[Tools used: ${toolsUsed.map((t) => t.name).join(", ")}]`
      : "";

  // 11. Add AI response to conversation
  const aiMsg: AIMessage = {
    role: "assistant",
    content: finalText + toolSummary + toolChainWarning,
    timestamp: new Date().toISOString(),
    page: pagePath,
  };
  const messagesAfterAI = await addMessage(convo.id, aiMsg, convo.messages);
  convo.messages = messagesAfterAI;

  // Update cache
  _cachedConvo = convo;

  return {
    response: finalText + toolChainWarning,
    conversationId: convo.id,
    messageCount: messagesAfterAI.length,
    toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    pendingActions: pendingConfirmations.length > 0 ? pendingConfirmations : undefined,
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
 *
 * NOTE: Streaming mode does NOT support function calling (Gemini limitation
 * with multi-turn tool loops). If the AI needs to call tools, use
 * `sendMessage` instead. The streaming variant is for pure text responses.
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
  const trained = buildTrainedPrompt(section, userMessage, dataContext, {
    includeCompetitors: options.includeCompetitors ?? true,
    includeKPIs: options.includeKPIs ?? true,
    includeSEOAlgorithms: options.includeSEOAlgorithms ?? true,
    includeWebMastery: options.includeWebMastery,
    includeCitationRules: options.includeCitationRules ?? true,
    includeToolGuidelines: true,
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
  for await (const chunk of generateTextStream(trained)) {
    fullResponse += chunk;
    yield chunk;
  }

  // 5.5 Detect if the AI tried to invoke tools in streaming mode
  const toolPatterns = [
    /i'?ll\s+(now\s+)?(run|execute|call|use|invoke|check|fetch|search|send|create|update)/i,
    /let me\s+(run|execute|call|use|invoke|check|fetch|search|send|create|update)/i,
    /i'?m\s+(going to|about to)\s+(run|execute|call|use|invoke)/i,
  ];
  const looksLikeToolAttempt = toolPatterns.some((p) => p.test(fullResponse));
  if (looksLikeToolAttempt) {
    const toolWarning =
      "\n\n---\n> **Note:** It looks like I wanted to perform an action, but streaming mode doesn't support tool execution. Please use the main chat prompt (non-streaming) so I can execute actions on your behalf.";
    fullResponse += toolWarning;
    yield toolWarning;
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

// ─── Tool Action Confirmation ────────────────────────

/**
 * Confirm a pending destructive action (e.g., send email, publish post).
 * Call this when the user clicks "Confirm" on a pending action card.
 */
export async function confirmAction(actionId: string): Promise<ToolExecutionResult> {
  return execConfirm(actionId);
}

/**
 * Reject a pending destructive action.
 * Call this when the user clicks "Reject" on a pending action card.
 */
export async function rejectAction(actionId: string): Promise<ToolExecutionResult> {
  return execReject(actionId);
}
