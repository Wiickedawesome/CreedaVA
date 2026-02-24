import type { FirestoreDoc } from "./crm";

// ─── Conversation Memory ─────────────────────────────

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO date
  /** The admin page where this message was sent */
  page?: string;
}

/**
 * Persisted conversation session stored in Firestore `ai-conversations` collection.
 * One active session per user — older sessions are archived.
 */
export interface AIConversation extends FirestoreDoc {
  /** Firebase Auth UID of the user */
  userId: string;
  /** Display name for the conversation (auto-generated from first message) */
  title: string;
  /** All messages in chronological order */
  messages: AIMessage[];
  /** Whether this is the active session */
  active: boolean;
  /** Summary of older messages (for token efficiency) */
  memorySummary?: string;
  /** Number of times the conversation was summarized */
  compressionCount: number;
  /** Last page the user was on when chatting */
  lastPage?: string;
}

// ─── Core Service Types ──────────────────────────────

export interface CreeaAICoreOptions {
  /** Current admin page path (e.g. "/admin/leads") */
  pagePath?: string;
  /** Pre-loaded data context string */
  dataContext?: string;
  /** Section label (e.g. "Blog AI", "SEO AI") */
  section?: string;
  /** Include competitors in prompt */
  includeCompetitors?: boolean;
  /** Include KPIs in prompt */
  includeKPIs?: boolean;
  /** Include SEO algorithms */
  includeSEOAlgorithms?: boolean;
  /** Any additional prompt modules */
  includeWebMastery?: boolean;
  /** Include citation rules for factual claims */
  includeCitationRules?: boolean;
  /** Custom instructions appended to prompt */
  customInstructions?: string;
}
