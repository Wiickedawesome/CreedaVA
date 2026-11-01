/**
 * Request limits for the /api/ai proxy.
 *
 * These are guardrails against abuse and runaway cost, not Gemini's own
 * limits. The assembled system instruction (identity + expertise modules) is
 * ~74k characters for the largest builder, so the cap must stay above that —
 * a 50k cap silently broke blog and landing-page generation.
 *
 * `__tests__/lib/utils/ai-prompt-limits.test.ts` keeps the builders under these.
 */

/** Largest assembled system instruction (identity + expertise modules). */
export const MAX_SYSTEM_INSTRUCTION_LENGTH = 120_000;

/** User message + injected business data. */
export const MAX_USER_CONTENT_LENGTH = 50_000;

/** Total parts across a chat conversation history. */
export const MAX_CONVERSATION_PARTS = 500;
