import { adminDb, canUseAdminDb } from "@/lib/firebase-admin";
import type { ForumThread } from "@/lib/types/content";
import type { ForumThreadRow } from "@/lib/types/forum";

/**
 * Read forum threads on the server so the page has real content in its HTML.
 *
 * The list used to arrive after hydration, which left the crawler looking at an
 * empty shell — `/forum` reported 11 words while the page carried several
 * paragraphs of guidance, and every thread page had no `<h1>` at all
 * (measured 2026-11-25).
 *
 * Returns `[]` rather than throwing: the client still loads the list itself, so
 * a cold or misconfigured server degrades to the previous behaviour instead of
 * failing the route.
 */
export async function loadForumThreads(limit = 50): Promise<ForumThreadRow[]> {
  if (!canUseAdminDb) return [];

  try {
    const snap = await adminDb
      .collection("forum")
      .where("status", "in", ["open", "closed"])
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        ...(data as Omit<ForumThread, "createdAt" | "updatedAt">),
        id: doc.id,
        createdAt: data.createdAt?.toDate?.().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Read one thread on the server.
 *
 * Its own document, not a lookup in `loadForumThreads`, because a thread page
 * must work for an id outside the list window.
 */
export async function loadForumThread(id: string): Promise<ForumThreadRow | null> {
  if (!canUseAdminDb) return null;

  try {
    const doc = await adminDb.collection("forum").doc(id).get();
    const data = doc.data();
    if (!data) return null;

    return {
      ...(data as Omit<ForumThread, "createdAt" | "updatedAt">),
      id: doc.id,
      createdAt: data.createdAt?.toDate?.().toISOString(),
      updatedAt: data.updatedAt?.toDate?.().toISOString(),
    };
  } catch {
    return null;
  }
}
