/**
 * AI Memory Service — Persistent conversation storage in Firestore
 *
 * Manages the `ai-conversations` collection:
 * - One active conversation per user at a time
 * - Auto-summarizes older messages when history exceeds token budget
 * - Provides conversation history formatted for Gemini prompts
 *
 * Collection: ai-conversations/{docId}
 */

import {
  fetchAll,
  fetchOne,
  create,
  update,
  where,
  orderBy,
  limit,
} from "@/lib/firebase/firestore";
import type { AIMessage, AIConversation } from "@/lib/types/ai";

const COLLECTION = "ai-conversations";

/**
 * Maximum number of messages to keep in full detail before summarizing.
 * Gemini 2.5 Flash has a 1M token window, but we want to keep prompts
 * under ~30K tokens for speed and cost. ~40 messages ≈ 15K tokens of history.
 */
const MAX_FULL_MESSAGES = 40;

/**
 * When compressing, keep the last N messages in full and summarize the rest.
 */
const KEEP_RECENT = 10;

// ─── CRUD Operations ─────────────────────────────────

/**
 * Get or create the active conversation for a user.
 */
export async function getActiveConversation(
  userId: string,
): Promise<AIConversation & { id: string }> {
  const results = await fetchAll<AIConversation>(
    COLLECTION,
    where("userId", "==", userId),
    where("active", "==", true),
    orderBy("updatedAt", "desc"),
    limit(1),
  );

  if (results.length > 0) {
    return results[0];
  }

  // Create a new active conversation
  const newConvo: Omit<AIConversation, "id" | "createdAt" | "updatedAt"> = {
    userId,
    title: "New conversation",
    messages: [],
    active: true,
    compressionCount: 0,
  };

  const id = await create(COLLECTION, newConvo);
  return { id, ...newConvo } as AIConversation & { id: string };
}

/**
 * Add a message to the active conversation and persist.
 */
export async function addMessage(
  conversationId: string,
  message: AIMessage,
  existingMessages: AIMessage[],
): Promise<AIMessage[]> {
  const updated = [...existingMessages, message];

  await update(COLLECTION, conversationId, {
    messages: updated,
    lastPage: message.page,
    // Auto-title from first user message
    ...(existingMessages.length === 0 && message.role === "user"
      ? { title: message.content.slice(0, 80) }
      : {}),
  });

  return updated;
}

/**
 * Start a new conversation, archiving the current active one.
 */
export async function startNewConversation(
  userId: string,
): Promise<AIConversation & { id: string }> {
  // Archive all currently active conversations
  const active = await fetchAll<AIConversation>(
    COLLECTION,
    where("userId", "==", userId),
    where("active", "==", true),
  );

  await Promise.all(
    active.map((c) => update(COLLECTION, c.id, { active: false })),
  );

  // Create fresh conversation
  const newConvo: Omit<AIConversation, "id" | "createdAt" | "updatedAt"> = {
    userId,
    title: "New conversation",
    messages: [],
    active: true,
    compressionCount: 0,
  };

  const id = await create(COLLECTION, newConvo);
  return { id, ...newConvo } as AIConversation & { id: string };
}

/**
 * Get past conversations for history sidebar (archived ones).
 */
export async function getConversationHistory(
  userId: string,
  count = 20,
): Promise<(AIConversation & { id: string })[]> {
  return fetchAll<AIConversation>(
    COLLECTION,
    where("userId", "==", userId),
    orderBy("updatedAt", "desc"),
    limit(count),
  );
}

/**
 * Load a specific conversation by ID.
 */
export async function getConversationById(
  conversationId: string,
): Promise<(AIConversation & { id: string }) | null> {
  const doc = await fetchOne<AIConversation>(COLLECTION, conversationId);
  return doc ?? null;
}

/**
 * Switch the active conversation: deactivate the current one and
 * reactivate the specified one.
 */
export async function switchToConversation(
  userId: string,
  conversationId: string,
): Promise<AIConversation & { id: string }> {
  // Deactivate all currently active
  const active = await fetchAll<AIConversation>(
    COLLECTION,
    where("userId", "==", userId),
    where("active", "==", true),
  );

  await Promise.all(
    active
      .filter((c) => c.id !== conversationId)
      .map((c) => update(COLLECTION, c.id, { active: false })),
  );

  // Reactivate the target
  await update(COLLECTION, conversationId, { active: true });

  const doc = await fetchOne<AIConversation>(COLLECTION, conversationId);
  if (!doc) throw new Error(`Conversation ${conversationId} not found`);
  return doc;
}

// ─── Memory Compression ─────────────────────────────

/**
 * Check if conversation needs compression and compress if so.
 * Returns the updated messages array and any memory summary.
 *
 * When messages exceed MAX_FULL_MESSAGES:
 * 1. Keep the last KEEP_RECENT messages in full
 * 2. Summarize everything before that into a `memorySummary`
 * 3. Persist the compressed state
 */
export async function compressIfNeeded(
  conversationId: string,
  messages: AIMessage[],
  existingSummary?: string,
  generateSummaryFn?: (text: string) => Promise<string>,
): Promise<{ messages: AIMessage[]; memorySummary?: string }> {
  if (messages.length <= MAX_FULL_MESSAGES) {
    return { messages, memorySummary: existingSummary };
  }

  // Split: old messages to summarize, recent to keep
  const toSummarize = messages.slice(0, messages.length - KEEP_RECENT);
  const toKeep = messages.slice(messages.length - KEEP_RECENT);

  // Build text block of old messages for summarization
  const oldText = toSummarize
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const contextToSummarize = existingSummary
    ? `Previous summary:\n${existingSummary}\n\nNew messages to incorporate:\n${oldText}`
    : oldText;

  let memorySummary: string;

  if (generateSummaryFn) {
    memorySummary = await generateSummaryFn(
      `Summarize this conversation history concisely. Preserve key facts, decisions, insights given, and anything the user asked about. This summary will be used as memory context for future AI responses.\n\n${contextToSummarize}`,
    );
  } else {
    // Fallback: simple truncation-based summary
    memorySummary = `[Conversation summary — ${toSummarize.length} earlier messages]\n` +
      (existingSummary ? existingSummary + "\n" : "") +
      toSummarize
        .slice(-5)
        .map((m) => `${m.role}: ${m.content.slice(0, 150)}...`)
        .join("\n");
  }

  // Persist compressed state
  await update(COLLECTION, conversationId, {
    messages: toKeep,
    memorySummary,
    compressionCount: (await fetchOne<AIConversation>(COLLECTION, conversationId))
      ?.compressionCount
      ? ((await fetchOne<AIConversation>(COLLECTION, conversationId))?.compressionCount ?? 0) + 1
      : 1,
  });

  return { messages: toKeep, memorySummary };
}

// ─── Prompt Formatting ──────────────────────────────

/**
 * Format conversation history for inclusion in a Gemini prompt.
 * Includes memory summary (if any) + recent messages.
 */
export function formatHistoryForPrompt(
  messages: AIMessage[],
  memorySummary?: string,
): string {
  const parts: string[] = [];

  if (memorySummary) {
    parts.push(`--- CONVERSATION MEMORY (earlier context) ---\n${memorySummary}`);
  }

  if (messages.length > 0) {
    parts.push(
      `--- RECENT CONVERSATION ---\n` +
        messages
          .map((m) => {
            const prefix = m.role === "user" ? "USER" : "CREEDA AI";
            const pageTag = m.page ? ` [on ${m.page}]` : "";
            return `${prefix}${pageTag}: ${m.content}`;
          })
          .join("\n\n"),
    );
  }

  return parts.join("\n\n");
}
