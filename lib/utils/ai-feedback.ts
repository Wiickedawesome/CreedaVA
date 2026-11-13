/**
 * AI Feedback — Specialist Note Store
 *
 * Persists useful AI-generated insights from chat conversations into
 * the `ai-tasks` Firestore collection, acting as an assistant feedback
 * and knowledge capture system.
 *
 * When a user clicks "Save Note" on any assistant chat bubble, the insight
 * is persisted with area attribution for future reference.
 *
 * Collection: `ai-tasks`
 * Access: admin only (see firestore.rules)
 */

import { create } from "@/lib/firebase/firestore";

// ─── Types ────────────────────────────────────────────

export interface SpecialistNote {
  /** Firestore document ID */
  id?: string;
  /** The full content of the saved AI response */
  content: string;
  /** Who produced this insight — always "Creeda AI" */
  specialistCodename: string;
  /** Specialist title for display (e.g. "Growth Strategist") */
  specialistTitle: string;
  /** Admin section the note was saved from (e.g. "Keyword AI") */
  section: string;
  /** Admin page path at time of save (e.g. "/admin/seo/keywords") */
  pagePath: string;
  /** ISO timestamp when the note was saved */
  savedAt: string;
  /** Auto-added by Firestore wrapper */
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ─── Write ────────────────────────────────────────────

/**
 * Saves an assistant response as a note in the `ai-tasks` collection.
 *
 * @param content           - The AI response text to save
 * @param specialistCodename - the assistant name, e.g. "Creeda AI"
 * @param specialistTitle    - the admin area it answered in, e.g. "SEO"
 * @param section            - Admin section label, e.g. "Keyword AI"
 * @param pagePath           - Current admin page path
 * @returns The new document ID
 */
export async function saveSpecialistNote(
  content: string,
  specialistCodename: string,
  specialistTitle: string,
  section: string,
  pagePath: string,
): Promise<string> {
  const note: Omit<SpecialistNote, "id" | "createdAt" | "updatedAt"> = {
    content: content.slice(0, 10_000), // cap size
    specialistCodename,
    specialistTitle,
    section,
    pagePath,
    savedAt: new Date().toISOString(),
  };
  return create<typeof note>("ai-tasks", note);
}
